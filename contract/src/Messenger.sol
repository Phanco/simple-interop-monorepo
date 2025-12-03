// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { MessageHashUtils } from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title Messenger
 * @notice Unified contract for sending and receiving cross-chain messages with multi-signature verification
 * @dev This contract combines the functionality of MessageSender and MessageReceiver.
 *      It uses a multi-sig relayer system for message verification and supports acknowledgments.
 */
contract Messenger is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    /**
     * @notice Stores received cross-chain messages
     */
    struct Message {
        uint256 sourceChainId;
        uint256 nonce;
        address sender;
        address recipient;
        bytes payload;
        uint256 timestamp;
    }

    // --- Sender State ---

    /// @notice Global counter used for work distribution among relayers
    uint256 public globalNonce;

    /// @notice Tracks the next nonce for each sender to each destination chain
    mapping(address => mapping(uint256 => uint256)) public outgoingNonces;

    // --- Receiver State ---

    /// @notice The minimum number of relayer signatures required to accept a message
    uint256 public immutable CONSENSUS_THRESHOLD;

    /// @notice Array of authorized relayer addresses
    address[] public relayers;

    /// @notice Maps relayer addresses to their index in the relayers array (plus 1)
    mapping(address => uint256) public relayersMap;

    /// @notice Tracks each relayer's current vote for relayer replacement
    mapping(address => bytes32) public currentProposals;

    /// @notice Tracks the number of votes for each relayer replacement proposal
    mapping(bytes32 => uint256) public votes;

    /// @notice Counter used to prevent proposal hash collisions
    uint256 public proposalNonce;

    /// @notice Array of all successfully received and verified messages
    Message[] public messages;

    /// @notice Tracks the next expected nonce for each sender from each source chain
    mapping(uint256 => mapping(address => uint256)) public incomingNonces;

    /// @notice Message Hash => ACKed
    mapping(bytes32 => bool) public ackHashes;

    // --- Modifiers ---

    modifier isRelayer(address relayer) {
        require(relayersMap[relayer] > 0, NotRelayer());
        _;
    }

    // --- Constructor ---

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

    // --- Sender Functions ---

    /**
     * @notice Sends a cross-chain message to a destination chain
     * @param destinationChainId The chain ID of the destination chain
     * @param recipient The address that should receive the message on the destination chain
     * @param nonce The sequential nonce for this message (must match the current nonce)
     * @param payload The message data to transmit
     */
    function sendMessage(uint256 destinationChainId, address recipient, uint256 nonce, bytes calldata payload) public {
        require(destinationChainId != 0 && destinationChainId != block.chainid, InvalidDestinationChain());
        require(payload.length > 0, EmptyPayload());
        require(outgoingNonces[msg.sender][destinationChainId] == nonce, InvalidNonce());

        outgoingNonces[msg.sender][destinationChainId]++;

        emit MessageSent(destinationChainId, msg.sender, nonce, recipient, payload, globalNonce++);
    }

    // --- Receiver Functions ---

    /**
     * @notice Receives and validates a cross-chain message with multi-signature verification
     * @param sourceChainId The chain ID where the message originated
     * @param nonce The sequential nonce for this sender on the source chain
     * @param sender The address that sent the message on the source chain
     * @param recipient The intended recipient address on this chain
     * @param payload The message data being transmitted
     * @param signatures Array of ECDSA signatures from relayers attesting to this message
     */
    function receiveMessage(
        uint256 sourceChainId,
        uint256 nonce,
        address sender,
        address recipient,
        bytes calldata payload,
        bytes[] calldata signatures
    ) external {
        require(incomingNonces[sourceChainId][sender] == nonce, MessageAlreadyProcessed());
        bytes32 messageHash = getMessageHash(sourceChainId, block.chainid, nonce, sender, recipient, payload);

        _verifySignatures(messageHash, signatures);

        incomingNonces[sourceChainId][sender]++;
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
     * @notice Receives an acknowledgment for a message that was sent from this chain
     * @param messageHash The original payload
     * @param signatures Signatures from relayers attesting to the ACK
     * @dev The ACK is verified by re-computing the original message hash.
     *      This links the acknowledgment to the original message.
     */
    function receiveAck(bytes32 messageHash, bytes[] calldata signatures) external {
        require(!ackHashes[messageHash], AckAlreadyProcessed());

        bytes32 messageHashHash = keccak256(abi.encodePacked(messageHash)).toEthSignedMessageHash();
        _verifySignatures(messageHashHash, signatures);

        ackHashes[messageHash] = true;
        emit AckReceived(messageHash);
    }

    // --- Internal Functions ---

    function _verifySignatures(bytes32 messageHash, bytes[] calldata signatures) internal view {
        uint256 validSignatures;
        uint256 seenRelayers;

        for (uint256 i; i < signatures.length;) {
            address recoveredSigner = ECDSA.recover(messageHash, signatures[i]);
            uint256 relayerBit = 1 << getRelayerIndex(recoveredSigner);
            require(seenRelayers & relayerBit == 0, DuplicateSignature());

            seenRelayers |= relayerBit;

            unchecked {
                validSignatures++;
                i++;
            }
        }

        require(validSignatures >= CONSENSUS_THRESHOLD, InsufficientRelayers());
    }

    // --- View Functions ---

    /**
     * @notice Get the message hash for signing
     * @param sourceChainId Source chain ID
     * @param destinationChainId Destination chain ID
     * @param nonce Message nonce
     * @param sender Original sender
     * @param recipient Message recipient
     * @param payload Message data
     * @return Hash of the message parameters
     */
    function getMessageHash(
        uint256 sourceChainId,
        uint256 destinationChainId,
        uint256 nonce,
        address sender,
        address recipient,
        bytes calldata payload
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(sourceChainId, destinationChainId, nonce, sender, recipient, payload))
            .toEthSignedMessageHash();
    }

    function relayersLength() public view returns (uint256) {
        return relayers.length;
    }

    function getRelayerIndex(address relayer) public view isRelayer(relayer) returns (uint256) {
        return relayersMap[relayer] - 1;
    }

    // --- Relayer Management ---

    function updateRelayer(address oldRelayer, address newRelayer) public isRelayer(oldRelayer) {
        require(owner() == address(0) || msg.sender == owner(), Unauthorized());
        require(relayersMap[newRelayer] == 0, AlreadyRelayer());

        if (msg.sender == owner()) {
            _replaceRelayer(oldRelayer, newRelayer);
        } else {
            bytes32 proposal = keccak256(abi.encodePacked(oldRelayer, newRelayer, proposalNonce));

            if (currentProposals[msg.sender] != bytes32(0)) {
                votes[currentProposals[msg.sender]]--;
            }
            votes[proposal]++;
            currentProposals[msg.sender] = proposal;

            if (votes[proposal] >= CONSENSUS_THRESHOLD) {
                _replaceRelayer(oldRelayer, newRelayer);
                proposalNonce++;
            }
        }
    }

    function _replaceRelayer(address oldRelayer, address newRelayer) internal {
        relayersMap[newRelayer] = relayersMap[oldRelayer];
        relayersMap[oldRelayer] = 0;
        relayers[getRelayerIndex(newRelayer)] = newRelayer;

        emit RelayerUpdated(oldRelayer, newRelayer);
    }

    // --- Events ---

    event MessageSent(
        uint256 indexed destinationChainId,
        address indexed sender,
        uint256 indexed nonce,
        address recipient,
        bytes payload,
        uint256 globalNonce
    );

    event MessageReceived(
        uint256 indexed sourceChainId, uint256 indexed nonce, address indexed sender, address recipient, bytes payload
    );

    event AckReceived(bytes32 indexed messageHash);

    event RelayerUpdated(address oldRelayer, address newRelayer);

    // --- Errors ---

    error InvalidDestinationChain();
    error EmptyPayload();
    error InvalidNonce();
    error MessageAlreadyProcessed();
    error AckAlreadyProcessed();
    error Unauthorized();
    error NotRelayer();
    error DuplicateSignature();
    error InsufficientRelayers();
    error AlreadyRelayer();
}
