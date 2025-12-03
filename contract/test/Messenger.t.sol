// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { Test } from "forge-std/Test.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { Messenger } from "../src/Messenger.sol";

contract MessengerTest is Test {
    using ECDSA for bytes32;

    Messenger public messenger;

    address public owner;
    address[] public relayers;
    uint256[] public relayerKeys;

    function setUp() public {
        owner = makeAddr("owner");

        relayers = new address[](3);
        relayerKeys = new uint256[](3);
        (relayers[0], relayerKeys[0]) = makeAddrAndKey("relayer0");
        (relayers[1], relayerKeys[1]) = makeAddrAndKey("relayer1");
        (relayers[2], relayerKeys[2]) = makeAddrAndKey("relayer2");

        messenger = new Messenger(owner, relayers, 2);
    }

    function sign(uint256 privateKey, bytes32 digest) public pure returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    // ==================== MESSAGE SENDER TESTS ====================

    function testRevert_sendMessage_InvalidDestinationChain() public {
        address recipient = makeAddr("recipient");
        bytes memory payload = "test message";

        // Test 1: Destination chain ID = 0 should revert
        vm.expectRevert(Messenger.InvalidDestinationChain.selector);
        messenger.sendMessage(0, recipient, 0, payload);

        // Test 2: Destination chain ID = current chain should revert
        vm.expectRevert(Messenger.InvalidDestinationChain.selector);
        messenger.sendMessage(block.chainid, recipient, 0, payload);
    }

    function testRevert_sendMessage_EmptyPayload() public {
        uint256 destinationChainId = 123;
        address recipient = makeAddr("recipient");
        bytes memory emptyPayload = "";

        vm.expectRevert(Messenger.EmptyPayload.selector);
        messenger.sendMessage(destinationChainId, recipient, 0, emptyPayload);
    }

    function testRevert_sendMessage_InvalidNonce() public {
        uint256 destinationChainId = 123;
        address recipient = makeAddr("recipient");
        bytes memory payload = "test message";

        // Test 1: Try to send with nonce = 1 when expecting 0
        vm.expectRevert(Messenger.InvalidNonce.selector);
        messenger.sendMessage(destinationChainId, recipient, 1, payload);

        // Test 2: Send successfully with nonce 0
        messenger.sendMessage(destinationChainId, recipient, 0, payload);

        // Test 3: Try to replay with nonce 0 (should fail, expecting nonce 1 now)
        vm.expectRevert(Messenger.InvalidNonce.selector);
        messenger.sendMessage(destinationChainId, recipient, 0, payload);
    }

    function test_sendMessage() public {
        uint256 destinationChainId = 123;
        address recipient = makeAddr("recipient");
        bytes memory payload = "test message";

        // Test 1: Send first message to destination chain
        vm.expectEmit(true, true, true, true);
        emit Messenger.MessageSent(destinationChainId, address(this), 0, recipient, payload, 0);
        messenger.sendMessage(destinationChainId, recipient, 0, payload);

        // Verify nonce incremented for this sender and destination
        assertEq(messenger.outgoingNonces(address(this), destinationChainId), 1);
        // Verify global nonce incremented
        assertEq(messenger.globalNonce(), 1);

        // Test 2: Send second message to same destination
        vm.expectEmit(true, true, true, true);
        emit Messenger.MessageSent(destinationChainId, address(this), 1, recipient, payload, 1);
        messenger.sendMessage(destinationChainId, recipient, 1, payload);

        assertEq(messenger.outgoingNonces(address(this), destinationChainId), 2);
        assertEq(messenger.globalNonce(), 2);

        // Test 3: Send message to different destination (nonce should be independent)
        uint256 destinationChainId2 = 321;
        vm.expectEmit(true, true, true, true);
        emit Messenger.MessageSent(destinationChainId2, address(this), 0, recipient, payload, 2);
        messenger.sendMessage(destinationChainId2, recipient, 0, payload);

        // Verify independent nonce tracking
        assertEq(messenger.outgoingNonces(address(this), destinationChainId2), 1);
        assertEq(messenger.outgoingNonces(address(this), destinationChainId), 2); // First destination unchanged
        assertEq(messenger.globalNonce(), 3);
    }

    // ==================== MESSAGE RECEIVER TESTS ====================

    function test_receiveMessage_OversuppliedSignatures() public {
        uint256 sourceChainId = 123;
        uint256 nonce = 0;
        address sender = makeAddr("sender");
        address recipient = makeAddr("recipient");
        bytes memory payload = "foobar";
        bytes[] memory signatures = new bytes[](3);

        bytes32 digest = messenger.getMessageHash(sourceChainId, block.chainid, nonce, sender, recipient, payload);
        signatures[0] = sign(relayerKeys[0], digest);
        signatures[1] = sign(relayerKeys[1], digest);
        signatures[2] = sign(relayerKeys[2], digest);

        vm.expectEmit();
        emit Messenger.MessageReceived(sourceChainId, nonce, sender, recipient, payload);

        messenger.receiveMessage(sourceChainId, nonce, sender, recipient, payload, signatures);
    }

    function testRevert_receiveMessage_InsufficientSignatures() public {
        uint256 sourceChainId = 123;
        uint256 nonce = 0;
        address sender = makeAddr("sender");
        address recipient = makeAddr("recipient");
        bytes memory payload = "foobar";
        bytes[] memory signatures = new bytes[](1);

        bytes32 digest = messenger.getMessageHash(sourceChainId, block.chainid, nonce, sender, recipient, payload);
        signatures[0] = sign(relayerKeys[0], digest);

        vm.expectRevert();
        messenger.receiveMessage(sourceChainId, nonce, sender, recipient, payload, signatures);
    }

    function testRevert_receiveMessage_DuplicateRelayerInSignature() public {
        uint256 sourceChainId = 123;
        uint256 nonce = 0;
        address sender = makeAddr("sender");
        address recipient = makeAddr("recipient");
        bytes memory payload = "foobar";
        bytes[] memory signatures = new bytes[](2);

        bytes32 digest = messenger.getMessageHash(sourceChainId, block.chainid, nonce, sender, recipient, payload);
        signatures[0] = sign(relayerKeys[0], digest);
        signatures[1] = sign(relayerKeys[0], digest);

        vm.expectRevert();
        messenger.receiveMessage(sourceChainId, nonce, sender, recipient, payload, signatures);
    }

    function test_receiveMessage_success() public {
        uint256 sourceChainId = 123;
        uint256 nonce = 0;
        address sender = makeAddr("sender");
        address recipient = makeAddr("recipient");
        bytes memory payload = "foobar";
        bytes[] memory signatures = new bytes[](2);

        bytes32 digest = messenger.getMessageHash(sourceChainId, block.chainid, nonce, sender, recipient, payload);
        signatures[0] = sign(relayerKeys[0], digest);
        signatures[1] = sign(relayerKeys[1], digest);

        vm.expectEmit();
        emit Messenger.MessageReceived(sourceChainId, nonce, sender, recipient, payload);

        messenger.receiveMessage(sourceChainId, nonce, sender, recipient, payload, signatures);
    }

    function testRevert_receiveMessage_MessageReplayed() public {
        uint256 sourceChainId = 123;
        uint256 nonce = 0;
        address sender = makeAddr("sender");
        address recipient = makeAddr("recipient");
        bytes memory payload = "foobar";
        bytes[] memory signatures = new bytes[](2);

        bytes32 digest = messenger.getMessageHash(sourceChainId, block.chainid, nonce, sender, recipient, payload);
        signatures[0] = sign(relayerKeys[0], digest);
        signatures[1] = sign(relayerKeys[1], digest);

        vm.expectEmit();
        emit Messenger.MessageReceived(sourceChainId, nonce, sender, recipient, payload);

        messenger.receiveMessage(sourceChainId, nonce, sender, recipient, payload, signatures);

        vm.expectRevert();
        messenger.receiveMessage(sourceChainId, nonce, sender, recipient, payload, signatures);
    }

    // ==================== ACK TESTS ====================

    function test_receiveAck_success() public {
        uint256 destinationChainId = 123;
        uint256 nonce = 0;
        address sender = address(this);
        address recipient = makeAddr("recipient");
        bytes memory payload = "test message";

        // First send a message
        messenger.sendMessage(destinationChainId, recipient, nonce, payload);

        // Compute the message hash for the ACK
        bytes32 messageHash =
            messenger.getMessageHash(block.chainid, destinationChainId, nonce, sender, recipient, payload);

        // Create signatures for the ACK
        bytes[] memory signatures = new bytes[](2);
        signatures[0] = sign(relayerKeys[0], messageHash);
        signatures[1] = sign(relayerKeys[1], messageHash);

        vm.expectEmit();
        emit Messenger.AckReceived(messageHash);

        messenger.receiveAck(destinationChainId, nonce, sender, recipient, payload, signatures);

        // Verify ACK was recorded
        assertTrue(messenger.ackHashes(messageHash));
    }

    function testRevert_receiveAck_AlreadyProcessed() public {
        uint256 destinationChainId = 123;
        uint256 nonce = 0;
        address sender = address(this);
        address recipient = makeAddr("recipient");
        bytes memory payload = "test message";

        // First send a message
        messenger.sendMessage(destinationChainId, recipient, nonce, payload);

        // Compute the message hash for the ACK
        bytes32 messageHash =
            messenger.getMessageHash(block.chainid, destinationChainId, nonce, sender, recipient, payload);

        // Create signatures for the ACK
        bytes[] memory signatures = new bytes[](2);
        signatures[0] = sign(relayerKeys[0], messageHash);
        signatures[1] = sign(relayerKeys[1], messageHash);

        // First ACK succeeds
        messenger.receiveAck(destinationChainId, nonce, sender, recipient, payload, signatures);

        // Second ACK should fail
        vm.expectRevert(Messenger.AckAlreadyProcessed.selector);
        messenger.receiveAck(destinationChainId, nonce, sender, recipient, payload, signatures);
    }

    function testRevert_receiveAck_InsufficientSignatures() public {
        uint256 destinationChainId = 123;
        uint256 nonce = 0;
        address sender = address(this);
        address recipient = makeAddr("recipient");
        bytes memory payload = "test message";

        // First send a message
        messenger.sendMessage(destinationChainId, recipient, nonce, payload);

        // Compute the message hash for the ACK
        bytes32 messageHash =
            messenger.getMessageHash(block.chainid, destinationChainId, nonce, sender, recipient, payload);

        // Create only 1 signature (insufficient)
        bytes[] memory signatures = new bytes[](1);
        signatures[0] = sign(relayerKeys[0], messageHash);

        vm.expectRevert();
        messenger.receiveAck(destinationChainId, nonce, sender, recipient, payload, signatures);
    }

    // ==================== RELAYER MANAGEMENT TESTS ====================

    function testRevert_getRelayerIndex_NotRelayer() public {
        address nobody = makeAddr("nobody");

        vm.expectRevert();
        messenger.getRelayerIndex(nobody);
    }

    function test_getRelayerIndex() public view {
        assertEq(messenger.getRelayerIndex(relayers[0]), 0);
        assertEq(messenger.getRelayerIndex(relayers[1]), 1);
        assertEq(messenger.getRelayerIndex(relayers[2]), 2);
    }

    function test_relayersLength() public view {
        assertEq(messenger.relayersLength(), 3);
    }

    // updateRelayer - Nobody updates relayer (Failed)
    function testRevert_updateRelayer_NotRelayer() public {
        address nobody = makeAddr("nobody");
        address newRelayer = makeAddr("newRelayer");

        vm.startPrank(nobody);
        vm.expectRevert();
        messenger.updateRelayer(relayers[0], newRelayer);
        vm.stopPrank();
    }

    // updateRelayer - Owner can update relayer (Success)
    function test_updateRelayer_OwnerUpdateRelayer() public {
        address newRelayer = makeAddr("newRelayer");

        vm.startPrank(owner);

        vm.expectEmit();
        emit Messenger.RelayerUpdated(relayers[0], newRelayer);

        messenger.updateRelayer(relayers[0], newRelayer);

        vm.stopPrank();

        assertEq(messenger.getRelayerIndex(newRelayer), 0);
        assertEq(messenger.getRelayerIndex(relayers[1]), 1);
        assertEq(messenger.getRelayerIndex(relayers[2]), 2);

        vm.expectRevert();
        messenger.getRelayerIndex(relayers[0]);
    }

    // updateRelayer - Relayer updates relayer, when owner not 0 (Fail)
    function testRevert_updateRelayer_RelayerUpdateRelayerOwnerNotZero() public {
        address newRelayer = makeAddr("newRelayer");

        vm.startPrank(relayers[0]);
        vm.expectRevert();
        messenger.updateRelayer(relayers[1], newRelayer);
        vm.stopPrank();
    }

    // updateRelayer - Relayer updates relayer, when owner 0 (Success)
    function test_updateRelayer_RelayerUpdateRelayerOwnerIsZero() public {
        address newRelayer = makeAddr("newRelayer");

        // Owner revoke Ownership
        vm.startPrank(owner);
        messenger.renounceOwnership();
        vm.stopPrank();

        // First Vote
        vm.startPrank(relayers[0]);
        messenger.updateRelayer(relayers[2], newRelayer);
        vm.stopPrank();

        // Second Vote - Threshold Reached
        vm.startPrank(relayers[1]);
        vm.expectEmit();
        emit Messenger.RelayerUpdated(relayers[2], newRelayer);

        messenger.updateRelayer(relayers[2], newRelayer);
        vm.stopPrank();

        assertEq(messenger.getRelayerIndex(newRelayer), 2);

        vm.expectRevert();
        messenger.getRelayerIndex(relayers[2]);
    }

    function test_updateRelayer_RelayerUpdateRelayerOwnerIsZero_ReplaceOldVote() public {
        address newRelayer = makeAddr("newRelayer");
        address newRelayer1 = makeAddr("newRelayer1");

        // Owner revoke Ownership
        vm.startPrank(owner);
        messenger.renounceOwnership();
        vm.stopPrank();

        uint256 currentProposalNonce = messenger.proposalNonce();

        vm.startPrank(relayers[0]);
        bytes32 oldProposal = keccak256(abi.encodePacked(relayers[2], newRelayer, currentProposalNonce));
        messenger.updateRelayer(relayers[2], newRelayer);
        assertEq(messenger.currentProposals(relayers[0]), oldProposal);
        assertEq(messenger.votes(oldProposal), 1);

        bytes32 newProposal = keccak256(abi.encodePacked(relayers[2], newRelayer1, currentProposalNonce));
        messenger.updateRelayer(relayers[2], newRelayer1);
        assertEq(messenger.currentProposals(relayers[0]), newProposal);
        assertEq(messenger.votes(oldProposal), 0);
        assertEq(messenger.votes(newProposal), 1);
        vm.stopPrank();
    }

    // updateRelayer - Relayer replaces with current relayer (Failed)
    function testRevert_updateRelayer_NewRelayerExists() public {
        // Owner revoke Ownership
        vm.startPrank(owner);
        messenger.renounceOwnership();
        vm.stopPrank();

        vm.startPrank(relayers[0]);
        vm.expectRevert();
        messenger.updateRelayer(relayers[1], relayers[2]);
        vm.stopPrank();
    }
}
