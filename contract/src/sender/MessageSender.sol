// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/**
 * @title MessageSender
 * @notice Sends cross-chain messages to destination chains for relayer processing
 * @dev This contract emits events that off-chain relayers monitor and relay to destination chains.
 *      Uses per-sender, per-destination nonces to ensure message ordering and prevent replay attacks.
 */
contract MessageSender {
    /// @notice Global counter used for work distribution among relayers
    /// @dev Incremented with each message sent, regardless of sender or destination
    uint256 public globalNonce;

    /// @notice Tracks the next nonce for each sender to each destination chain
    /// @dev Maps sender address => destination chain ID => next expected nonce
    mapping(address => mapping(uint256 => uint256)) public nonces;

    /**
     * @notice Emitted when a new cross-chain message is sent
     * @param destinationChainId The target chain ID where the message should be delivered
     * @param sender The address that sent the message
     * @param nonce The sequential nonce for this sender to this destination
     * @param recipient The address on the destination chain that should receive the message
     * @param payload The message data being transmitted
     * @param globalNonce The global nonce used for relayer work distribution
     */
    event MessageSent(
        uint256 indexed destinationChainId,
        address indexed sender,
        uint256 indexed nonce,
        address recipient,
        bytes payload,
        uint256 globalNonce
    );

    /**
     * @notice Sends a cross-chain message to a destination chain
     * @param destinationChainId The chain ID of the destination chain
     * @param recipient The address that should receive the message on the destination chain
     * @param nonce The sequential nonce for this message (must match the current nonce)
     * @param payload The message data to transmit
     * @dev Validates the destination chain, ensures payload is not empty, and verifies nonce ordering.
     *      Emits MessageSent event for off-chain relayers to process.
     */
    function sendMessage(uint256 destinationChainId, address recipient, uint256 nonce, bytes calldata payload) public {
        // Ensure destination is valid (not zero and not the current chain)
        require(destinationChainId != 0 && destinationChainId != block.chainid, InvalidDestinationChain());
        // Ensure message contains data
        require(payload.length > 0, EmptyPayload());
        // Verify nonce matches expected value to maintain ordering
        require(nonces[msg.sender][destinationChainId] == nonce, InvalidNonce());

        // Increment sender's nonce for this destination
        nonces[msg.sender][destinationChainId]++;

        // Emit event for relayers to observe and process
        emit MessageSent(destinationChainId, msg.sender, nonce, recipient, payload, globalNonce++);
    }

    /// @notice Thrown when the destination chain ID is invalid (zero or same as current chain)
    error InvalidDestinationChain();

    /// @notice Thrown when attempting to send a message with empty payload
    error EmptyPayload();

    /// @notice Thrown when the provided nonce doesn't match the expected next nonce
    error InvalidNonce();
}
