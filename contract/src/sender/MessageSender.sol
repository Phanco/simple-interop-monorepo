// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MessageSender {
    uint256 public globalNonce;

    mapping(address => mapping(uint256 => uint256)) public nonces; // sender-chainId-nonce

    /// @notice Emitted when a new message is sent
    /// @param destinationChainId Target chain ID for the message
    /// @param sender Address that sent the message
    /// @param nonce Unique message identifier
    /// @param recipient Address on destination chain to receive the message
    /// @param payload Message data
    event MessageSent(
        uint256 indexed destinationChainId,
        address indexed sender,
        uint256 indexed nonce,
        address recipient,
        bytes payload,
        uint256 globalNonce
    );

    function sendMessage(uint256 destinationChainId, address recipient, uint256 nonce, bytes calldata payload) public {
        require(destinationChainId != 0 || destinationChainId != block.chainid, InvalidDestinationChain());
        require(payload.length > 0, EmptyPayload());
        require(nonces[msg.sender][destinationChainId] == nonce, InvalidNonce());

        nonces[msg.sender][destinationChainId]++;

        emit MessageSent(destinationChainId, msg.sender, nonce, recipient, payload, globalNonce++);
    }

    error InvalidDestinationChain();
    error InvalidRecipient();
    error EmptyPayload();
    error InvalidNonce();
}
