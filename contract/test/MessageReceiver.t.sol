// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { Test } from "forge-std/Test.sol";
import { console } from "forge-std/console.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { MessageReceiver } from "../src/receiver/MessageReceiver.sol";

contract MessageReceiverTest is Test {
    using ECDSA for bytes32;

    MessageReceiver public messageReceiver;

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

        messageReceiver = new MessageReceiver(owner, relayers, 2);
    }

    function sign(uint256 privateKey, bytes32 digest) public pure returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function test_receiveMessage_OversuppliedSignatures() public {
        uint256 sourceChainId = 123;
        uint256 nonce = 0;
        address sender = makeAddr("sender");
        address recipient = makeAddr("recipient");
        bytes memory payload = "foobar";
        bytes[] memory signatures = new bytes[](3);

        bytes32 digest = messageReceiver.getMessageHash(sourceChainId, nonce, sender, recipient, payload);
        signatures[0] = sign(relayerKeys[0], digest);
        signatures[1] = sign(relayerKeys[1], digest);
        signatures[2] = sign(relayerKeys[2], digest);

        vm.expectEmit();
        emit MessageReceiver.MessageReceived(sourceChainId, nonce, sender, recipient, payload);

        messageReceiver.receiveMessage(sourceChainId, nonce, sender, recipient, payload, signatures);
    }

    function testRevert_receiveMessage_InsufficientSignatures() public {
        uint256 sourceChainId = 123;
        uint256 nonce = 0;
        address sender = makeAddr("sender");
        address recipient = makeAddr("recipient");
        bytes memory payload = "foobar";
        bytes[] memory signatures = new bytes[](1);

        bytes32 digest = messageReceiver.getMessageHash(sourceChainId, nonce, sender, recipient, payload);
        signatures[0] = sign(relayerKeys[0], digest);

        vm.expectRevert();
        messageReceiver.receiveMessage(sourceChainId, nonce, sender, recipient, payload, signatures);
    }

    function testRevert_receiveMessage_DuplicateRelayerInSignature() public {
        uint256 sourceChainId = 123;
        uint256 nonce = 0;
        address sender = makeAddr("sender");
        address recipient = makeAddr("recipient");
        bytes memory payload = "foobar";
        bytes[] memory signatures = new bytes[](2);

        bytes32 digest = messageReceiver.getMessageHash(sourceChainId, nonce, sender, recipient, payload);
        signatures[0] = sign(relayerKeys[0], digest);
        signatures[1] = sign(relayerKeys[0], digest);

        vm.expectRevert();
        messageReceiver.receiveMessage(sourceChainId, nonce, sender, recipient, payload, signatures);
    }

    function test_receiveMessage_success() public {
        uint256 sourceChainId = 123;
        uint256 nonce = 0;
        address sender = makeAddr("sender");
        address recipient = makeAddr("recipient");
        bytes memory payload = "foobar";
        bytes[] memory signatures = new bytes[](2);

        bytes32 digest = messageReceiver.getMessageHash(sourceChainId, nonce, sender, recipient, payload);
        signatures[0] = sign(relayerKeys[0], digest);
        signatures[1] = sign(relayerKeys[1], digest);

        vm.expectEmit();
        emit MessageReceiver.MessageReceived(sourceChainId, nonce, sender, recipient, payload);

        messageReceiver.receiveMessage(sourceChainId, nonce, sender, recipient, payload, signatures);
    }

    function testRevert_receiveMessage_MessageReplayed() public {
        uint256 sourceChainId = 123;
        uint256 nonce = 0;
        address sender = makeAddr("sender");
        address recipient = makeAddr("recipient");
        bytes memory payload = "foobar";
        bytes[] memory signatures = new bytes[](2);

        bytes32 digest = messageReceiver.getMessageHash(sourceChainId, nonce, sender, recipient, payload);
        signatures[0] = sign(relayerKeys[0], digest);
        signatures[1] = sign(relayerKeys[1], digest);

        vm.expectEmit();
        emit MessageReceiver.MessageReceived(sourceChainId, nonce, sender, recipient, payload);

        messageReceiver.receiveMessage(sourceChainId, nonce, sender, recipient, payload, signatures);

        vm.expectRevert();
        messageReceiver.receiveMessage(sourceChainId, nonce, sender, recipient, payload, signatures);
    }

    function testRevert_getRelayerIndex_NotRelayer() public {
        address nobody = makeAddr("nobody");

        vm.expectRevert();
        messageReceiver.getRelayerIndex(nobody);
    }

    function test_getRelayerIndex() public view {
        assertEq(messageReceiver.getRelayerIndex(relayers[0]), 0);
        assertEq(messageReceiver.getRelayerIndex(relayers[1]), 1);
        assertEq(messageReceiver.getRelayerIndex(relayers[2]), 2);
    }

    // updateRelayer - Nobody updates relayer (Failed)
    function testRevert_updateRelayer_NotRelayer() public {
        address nobody = makeAddr("nobody");
        address newRelayer = makeAddr("newRelayer");

        vm.startPrank(nobody);
        vm.expectRevert();
        messageReceiver.updateRelayer(relayers[0], newRelayer);
        vm.stopPrank();
    }

    // updateRelayer - Owner can update relayer (Success)
    function test_updateRelayer_OwnerUpdateRelayer() public {
        address newRelayer = makeAddr("newRelayer");

        vm.startPrank(owner);

        vm.expectEmit();
        emit MessageReceiver.RelayerUpdated(relayers[0], newRelayer);

        messageReceiver.updateRelayer(relayers[0], newRelayer);

        vm.stopPrank();

        assertEq(messageReceiver.getRelayerIndex(newRelayer), 0);
        assertEq(messageReceiver.getRelayerIndex(relayers[1]), 1);
        assertEq(messageReceiver.getRelayerIndex(relayers[2]), 2);

        vm.expectRevert();
        messageReceiver.getRelayerIndex(relayers[0]);
    }

    // updateRelayer - Relayer updates relayer, when owner not 0 (Fail)
    function testRevert_updateRelayer_RelayerUpdateRelayerOwnerNotZero() public {
        address newRelayer = makeAddr("newRelayer");

        vm.startPrank(relayers[0]);
        vm.expectRevert();
        messageReceiver.updateRelayer(relayers[1], newRelayer);
        vm.stopPrank();
    }

    // updateRelayer - Relayer updates relayer, when owner 0 (Success)
    function test_updateRelayer_RelayerUpdateRelayerOwnerIsZero() public {
        address newRelayer = makeAddr("newRelayer");

        // Owner revoke Ownership
        vm.startPrank(owner);
        messageReceiver.renounceOwnership();
        vm.stopPrank();

        // First Vote
        vm.startPrank(relayers[0]);
        messageReceiver.updateRelayer(relayers[2], newRelayer);
        vm.stopPrank();

        // Second Vote - Threshold Reached
        vm.startPrank(relayers[1]);
        vm.expectEmit();
        emit MessageReceiver.RelayerUpdated(relayers[2], newRelayer);

        messageReceiver.updateRelayer(relayers[2], newRelayer);
        vm.stopPrank();

        assertEq(messageReceiver.getRelayerIndex(newRelayer), 2);

        vm.expectRevert();
        messageReceiver.getRelayerIndex(relayers[2]);
    }

    function test_updateRelayer_RelayerUpdateRelayerOwnerIsZero_ReplaceOldVote() public {
        address newRelayer = makeAddr("newRelayer");
        address newRelayer1 = makeAddr("newRelayer1");

        // Owner revoke Ownership
        vm.startPrank(owner);
        messageReceiver.renounceOwnership();
        vm.stopPrank();

        uint256 currentProposalNonce = messageReceiver.proposalNonce();

        vm.startPrank(relayers[0]);
        bytes32 oldProposal = keccak256(abi.encodePacked(relayers[2], newRelayer, currentProposalNonce));
        messageReceiver.updateRelayer(relayers[2], newRelayer);
        assertEq(messageReceiver.currentProposals(relayers[0]), oldProposal);
        assertEq(messageReceiver.votes(oldProposal), 1);

        bytes32 newProposal = keccak256(abi.encodePacked(relayers[2], newRelayer1, currentProposalNonce));
        messageReceiver.updateRelayer(relayers[2], newRelayer1);
        assertEq(messageReceiver.currentProposals(relayers[0]), newProposal);
        assertEq(messageReceiver.votes(oldProposal), 0);
        assertEq(messageReceiver.votes(newProposal), 1);
        vm.stopPrank();
    }

    // updateRelayer - Relayer replaces with current relayer (Failed)
    function testRevert_updateRelayer_NewRelayerExists() public {
        // Owner revoke Ownership
        vm.startPrank(owner);
        messageReceiver.renounceOwnership();
        vm.stopPrank();

        vm.startPrank(relayers[0]);
        vm.expectRevert();
        messageReceiver.updateRelayer(relayers[1], relayers[2]);
        vm.stopPrank();
    }
}
