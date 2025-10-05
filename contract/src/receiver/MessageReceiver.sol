// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { MessageHashUtils } from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { console } from "forge-std/console.sol";

contract MessageReceiver is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    /// @notice Stores received messages
    struct Message {
        uint256 sourceChainId;
        uint256 nonce;
        address sender;
        address recipient;
        bytes payload;
        uint256 timestamp;
    }

    uint256 public immutable CONSENSUS_THRESHOLD;

    address[] public relayers;
    mapping(address => uint256) public relayersMap;

    // New Candidate
    mapping(address => bytes32) public currentProposals; // Relayer => Proposal
    mapping(bytes32 => uint256) public votes; // Proposal => numberOfVotes
    uint256 public proposalNonce;

    /// @notice All received messages
    Message[] public messages;

    /// @notice Mapping to track processed message nonces from source chain
    /// @dev sourceChainId => sender => nonce
    mapping(uint256 => mapping(address => uint256)) public processedMessageNonces;

    modifier isRelayer(address relayer) {
        require(relayersMap[relayer] > 0, NotRelayer());
        _;
    }

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

    function receiveMessage(
        uint256 sourceChainId,
        uint256 nonce,
        address sender,
        address recipient,
        bytes calldata payload,
        bytes[] calldata signatures
    ) external {
        require(processedMessageNonces[sourceChainId][sender] == nonce, MessageAlreadyProcessed());
        bytes32 messageHash = getMessageHash(sourceChainId, nonce, sender, recipient, payload);

        uint256 validSignatures;
        uint256 seenRelayers;
        for (uint256 i; i < signatures.length;) {
            address recoveredSigner = ECDSA.recover(messageHash, signatures[i]);
            // forge-lint: disable-next-line
            uint256 relayerBit = 1 << getRelayerIndex(recoveredSigner);
            require(seenRelayers & relayerBit == 0, DuplicateSignature());

            seenRelayers |= relayerBit;

            unchecked {
                validSignatures++;
                i++;
            }
        }
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
        //        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
    }

    function relayersLength() public view returns (uint256) {
        return relayers.length;
    }

    function getRelayerIndex(address relayer) public view isRelayer(relayer) returns (uint256) {
        return relayersMap[relayer] - 1;
    }

    function updateRelayer(address oldRelayer, address newRelayer) public isRelayer(oldRelayer) {
        require(owner() == address(0) || msg.sender == owner(), Unauthorized());
        require(relayersMap[newRelayer] == 0, "Already relayer");

        // Owner updating relayer directly
        if (msg.sender == owner()) {
            _replaceRelayer(oldRelayer, newRelayer);
        } else {
            bytes32 proposal = keccak256(abi.encodePacked(oldRelayer, newRelayer, proposalNonce));
            console.logBytes32(proposal);

            // Remove old vote
            if (currentProposals[msg.sender] != bytes32(0)) {
                votes[currentProposals[msg.sender]]--;
            }
            votes[proposal]++;
            currentProposals[msg.sender] = proposal;

            // Enough vote, replacing relayers
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

    /// @notice Emitted when a message is received
    event MessageReceived(
        uint256 indexed sourceChainId, uint256 indexed nonce, address indexed sender, address recipient, bytes payload
    );

    event RelayerUpdated(address oldRelayer, address newRelayer);

    error InvalidRelayer();
    error InvalidSignature();
    error MessageAlreadyProcessed();
    error InvalidRecipient();

    error Unauthorized();

    error NotRelayer();

    error AlreadyNominated();

    error DuplicateSignature();
}
