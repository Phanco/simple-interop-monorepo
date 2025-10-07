// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { Test } from "forge-std/Test.sol";
import { MessageSender } from "../src/sender/MessageSender.sol";

contract MessageSenderTest is Test {
    MessageSender public messageSender;

    function setUp() public {
        messageSender = new MessageSender();
    }

    function testRevert_sendMessage_InvalidDestinationChain() public {
        address recipient = makeAddr("recipient");
        bytes memory payload = "test message";

        // Test 1: Destination chain ID = 0 should revert
        vm.expectRevert(MessageSender.InvalidDestinationChain.selector);
        messageSender.sendMessage(0, recipient, 0, payload);

        // Test 2: Destination chain ID = current chain should revert
        vm.expectRevert(MessageSender.InvalidDestinationChain.selector);
        messageSender.sendMessage(block.chainid, recipient, 0, payload);
    }

    function testRevert_sendMessage_EmptyPayload() public {
        uint256 destinationChainId = 123;
        address recipient = makeAddr("recipient");
        bytes memory emptyPayload = "";

        vm.expectRevert(MessageSender.EmptyPayload.selector);
        messageSender.sendMessage(destinationChainId, recipient, 0, emptyPayload);
    }

    function testRevert_sendMessage_InvalidNonce() public {
        uint256 destinationChainId = 123;
        address recipient = makeAddr("recipient");
        bytes memory payload = "test message";

        // Test 1: Try to send with nonce = 1 when expecting 0
        vm.expectRevert(MessageSender.InvalidNonce.selector);
        messageSender.sendMessage(destinationChainId, recipient, 1, payload);

        // Test 2: Send successfully with nonce 0
        messageSender.sendMessage(destinationChainId, recipient, 0, payload);

        // Test 3: Try to replay with nonce 0 (should fail, expecting nonce 1 now)
        vm.expectRevert(MessageSender.InvalidNonce.selector);
        messageSender.sendMessage(destinationChainId, recipient, 0, payload);
    }

    function test_sendMessage() public {
        uint256 destinationChainId = 123;
        address recipient = makeAddr("recipient");
        bytes memory payload = "test message";

        // Test 1: Send first message to destination chain
        vm.expectEmit(true, true, true, true);
        emit MessageSender.MessageSent(destinationChainId, address(this), 0, recipient, payload, 0);
        messageSender.sendMessage(destinationChainId, recipient, 0, payload);

        // Verify nonce incremented for this sender and destination
        assertEq(messageSender.nonces(address(this), destinationChainId), 1);
        // Verify global nonce incremented
        assertEq(messageSender.globalNonce(), 1);

        // Test 2: Send second message to same destination
        vm.expectEmit(true, true, true, true);
        emit MessageSender.MessageSent(destinationChainId, address(this), 1, recipient, payload, 1);
        messageSender.sendMessage(destinationChainId, recipient, 1, payload);

        assertEq(messageSender.nonces(address(this), destinationChainId), 2);
        assertEq(messageSender.globalNonce(), 2);

        // Test 3: Send message to different destination (nonce should be independent)
        uint256 destinationChainId2 = 321;
        vm.expectEmit(true, true, true, true);
        emit MessageSender.MessageSent(destinationChainId2, address(this), 0, recipient, payload, 2);
        messageSender.sendMessage(destinationChainId2, recipient, 0, payload);

        // Verify independent nonce tracking
        assertEq(messageSender.nonces(address(this), destinationChainId2), 1);
        assertEq(messageSender.nonces(address(this), destinationChainId), 2); // First destination unchanged
        assertEq(messageSender.globalNonce(), 3);
    }
}
