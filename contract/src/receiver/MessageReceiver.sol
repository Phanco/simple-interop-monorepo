// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { MessageHashUtils } from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title MessageReceiver
 * @notice Receives and validates cross-chain messages using multi-signature verification
 * @dev This contract verifies messages from source chains by requiring a threshold number
 *      of signatures from registered relayers. It supports both owner-based and consensus-based
 *      relayer rotation for security and decentralization.
 */
contract MessageReceiver is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    /**
     * @notice Stores received cross-chain messages
     * @dev Contains all necessary information to track a message from source to destination
     */
    struct Message {
        uint256 sourceChainId;
        uint256 nonce;
        address sender;
        address recipient;
        bytes payload;
        uint256 timestamp;
    }

    /// @notice The minimum number of relayer signatures required to accept a message
    /// @dev Set during deployment and cannot be changed afterward
    uint256 public immutable CONSENSUS_THRESHOLD;

    /// @notice Array of authorized relayer addresses
    /// @dev Relayers are responsible for signing cross-chain messages
    address[] public relayers;

    /// @notice Maps relayer addresses to their index in the relayers array (plus 1)
    /// @dev Zero value indicates the address is not a relayer. Actual index is value - 1
    mapping(address => uint256) public relayersMap;

    /// @notice Tracks each relayer's current vote for relayer replacement
    /// @dev Maps relayer address to the proposal hash they are currently voting for
    mapping(address => bytes32) public currentProposals;

    /// @notice Tracks the number of votes for each relayer replacement proposal
    /// @dev Maps proposal hash to vote count. Proposal reaches consensus at CONSENSUS_THRESHOLD votes
    mapping(bytes32 => uint256) public votes;

    /// @notice Counter used to prevent proposal hash collisions
    /// @dev Incremented after each successful relayer replacement
    uint256 public proposalNonce;

    /// @notice Array of all successfully received and verified messages
    /// @dev Messages are appended in the order they are received
    Message[] public messages;

    /// @notice Tracks the next expected nonce for each sender from each source chain
    /// @dev Maps sourceChainId => sender => expected nonce. Ensures message ordering and replay protection
    mapping(uint256 => mapping(address => uint256)) public processedMessageNonces;

    /**
     * @notice Restricts function access to registered relayers only
     * @param relayer The address to verify as a relayer
     * @dev Reverts with NotRelayer if the address is not in the relayersMap
     */
    modifier isRelayer(address relayer) {
        require(relayersMap[relayer] > 0, NotRelayer());
        _;
    }

    /**
     * @notice Initializes the MessageReceiver contract with relayers and consensus threshold
     * @param _owner The address that will own this contract (can be zero address for decentralized operation)
     * @param _relayers Array of initial relayer addresses
     * @param threshold Minimum number of signatures required to accept a message
     * @dev Relayers are stored with their index + 1 to distinguish from unset addresses (which map to 0)
     */
    constructor(address _owner, address[] memory _relayers, uint256 threshold) Ownable(_owner) {
        relayers = new address[](_relayers.length);
        for (uint256 i; i < _relayers.length;) {
            relayers[i] = _relayers[i];
            relayersMap[_relayers[i]] = i + 1;
            unchecked {
                i++;
            }
        }
        CONSENSUS_THRESHOLD = threshold;
    }

    /**
     * @notice Receives and validates a cross-chain message with multi-signature verification
     * @param sourceChainId The chain ID where the message originated
     * @param nonce The sequential nonce for this sender on the source chain
     * @param sender The address that sent the message on the source chain
     * @param recipient The intended recipient address on this chain
     * @param payload The message data being transmitted
     * @param signatures Array of ECDSA signatures from relayers attesting to this message
     * @dev Verifies that:
     *      - The nonce matches the expected next nonce for this sender/chain
     *      - At least CONSENSUS_THRESHOLD valid signatures are provided
     *      - No relayer has signed the message more than once (prevents signature duplication)
     *      Emits MessageReceived event on success
     */
    function receiveMessage(
        uint256 sourceChainId,
        uint256 nonce,
        address sender,
        address recipient,
        bytes calldata payload,
        bytes[] calldata signatures
    ) external {
        // Verify this is the next expected nonce (prevents replay attacks and ensures ordering)
        require(processedMessageNonces[sourceChainId][sender] == nonce, MessageAlreadyProcessed());
        bytes32 messageHash = getMessageHash(sourceChainId, nonce, sender, recipient, payload);

        uint256 validSignatures;
        uint256 seenRelayers; // Bitmask to track which relayers have signed

        // Verify signatures and check for duplicates
        for (uint256 i; i < signatures.length;) {
            // Recover the signer address from the signature
            address recoveredSigner = ECDSA.recover(messageHash, signatures[i]);
            // forge-lint: disable-next-line
            // Create a bitmask for this relayer's index
            uint256 relayerBit = 1 << getRelayerIndex(recoveredSigner);
            // Ensure this relayer hasn't already signed (prevent duplicate signatures)
            require(seenRelayers & relayerBit == 0, DuplicateSignature());

            // Mark this relayer as having signed
            seenRelayers |= relayerBit;

            unchecked {
                validSignatures++;
                i++;
            }
        }

        // Verify we have reached the consensus threshold
        require(validSignatures >= CONSENSUS_THRESHOLD, "Insufficient Relayers");

        processedMessageNonces[sourceChainId][sender]++;
        messages.push(
            Message({
                sourceChainId: sourceChainId,
                nonce: nonce,
                sender: sender,
                recipient: recipient,
                payload: payload,
                timestamp: block.timestamp
            })
        );

        emit MessageReceived(sourceChainId, nonce, sender, recipient, payload);
    }

    /**
     * @notice Get the message hash for signing
     * @param sourceChainId Source chain ID
     * @param nonce Message nonce
     * @param sender Original sender
     * @param recipient Message recipient
     * @param payload Message data
     * @return Hash of the message parameters
     */
    function getMessageHash(
        uint256 sourceChainId,
        uint256 nonce,
        address sender,
        address recipient,
        bytes calldata payload
    ) public view returns (bytes32) {
        return keccak256(abi.encodePacked(sourceChainId, block.chainid, nonce, sender, recipient, payload))
            .toEthSignedMessageHash();
    }

    /**
     * @notice Returns the total number of registered relayers
     * @return The length of the relayers array
     */
    function relayersLength() public view returns (uint256) {
        return relayers.length;
    }

    /**
     * @notice Gets the array index of a relayer address
     * @param relayer The relayer address to look up
     * @return The index position of the relayer in the relayers array
     * @dev Reverts if the address is not a registered relayer
     */
    function getRelayerIndex(address relayer) public view isRelayer(relayer) returns (uint256) {
        return relayersMap[relayer] - 1;
    }

    /**
     * @notice Replaces an existing relayer with a new relayer address
     * @param oldRelayer The current relayer address to be replaced
     * @param newRelayer The new relayer address to add
     * @dev Two modes of operation:
     *      1. Owner mode: If called by owner, replacement happens immediately
     *      2. Consensus mode: If owner is zero address, requires CONSENSUS_THRESHOLD votes from relayers
     *      Reverts if oldRelayer is not registered or newRelayer is already a relayer
     */
    function updateRelayer(address oldRelayer, address newRelayer) public isRelayer(oldRelayer) {
        require(owner() == address(0) || msg.sender == owner(), Unauthorized());
        require(relayersMap[newRelayer] == 0, "Already relayer");

        // Owner updating relayer directly
        if (msg.sender == owner()) {
            _replaceRelayer(oldRelayer, newRelayer);
        } else {
            // Hash includes proposalNonce to prevent replaying old proposals
            bytes32 proposal = keccak256(abi.encodePacked(oldRelayer, newRelayer, proposalNonce));

            // Remove relayer's previous vote if they are changing their vote
            if (currentProposals[msg.sender] != bytes32(0)) {
                votes[currentProposals[msg.sender]]--;
            }
            // Add vote to the new proposal
            votes[proposal]++;
            currentProposals[msg.sender] = proposal;

            // Execute replacement if consensus threshold is reached
            if (votes[proposal] >= CONSENSUS_THRESHOLD) {
                _replaceRelayer(oldRelayer, newRelayer);
                proposalNonce++;
            }
        }
    }

    /**
     * @notice Internal function to execute relayer replacement
     * @param oldRelayer The relayer address being removed
     * @param newRelayer The relayer address being added
     * @dev Updates both the relayersMap and relayers array, then emits RelayerUpdated event
     */
    function _replaceRelayer(address oldRelayer, address newRelayer) internal {
        relayersMap[newRelayer] = relayersMap[oldRelayer];
        relayersMap[oldRelayer] = 0;
        relayers[getRelayerIndex(newRelayer)] = newRelayer;

        emit RelayerUpdated(oldRelayer, newRelayer);
    }

    /**
     * @notice Emitted when a cross-chain message is successfully received
     * @param sourceChainId Source Chain ID
     * @param nonce The message nonce from the source chain
     * @param sender The address that sent the message on the source chain
     * @param recipient The intended recipient on this chain
     * @param payload The message data that was transmitted
     */
    event MessageReceived(
        uint256 indexed sourceChainId, uint256 indexed nonce, address indexed sender, address recipient, bytes payload
    );

    /**
     * @notice Emitted when a relayer is successfully replaced
     * @param oldRelayer The address of the relayer that was removed
     * @param newRelayer The address of the relayer that was added
     */
    event RelayerUpdated(address oldRelayer, address newRelayer);

    /// @notice Thrown when attempting to process a message with an invalid nonce
    error MessageAlreadyProcessed();

    /// @notice Thrown when a non-owner or non-relayer attempts a restricted operation
    error Unauthorized();

    /// @notice Thrown when an address is expected to be a relayer but is not registered
    error NotRelayer();

    /// @notice Thrown when the same relayer signs a message multiple times
    error DuplicateSignature();
}
