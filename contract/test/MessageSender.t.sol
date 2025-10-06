// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { Test } from "forge-std/Test.sol";
import { MessageSender } from "../src/sender/MessageSender.sol";

contract MessageSenderTest is Test {
    MessageSender public messageSender;

    function setUp() public {
        messageSender = new MessageSender();
    }

    function testRevert_sendMessage_InvalidDestinationChain() public { }

    function testRevert_sendMessage_EmptyPayload() public { }

    function testRevert_sendMessage_InvalidNonce() public { }

    function test_sendMessage() public { }
}
