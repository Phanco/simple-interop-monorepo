// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";

import { MessageSender } from "../src/sender/MessageSender.sol";

contract SendMessage is Script {
    MessageSender public messageSender;

    function run() external {
        string memory message = vm.envString("MESSAGE");
        console.log("Sending Message:", message);

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        console.log("Deployer:", deployer);

        uint256 destinationChainId = 31338;
        string memory jsonPath = string.concat("./deployment/", vm.toString(block.chainid), "/Sender.json");
        string memory json = vm.readFile(jsonPath);

        address messageSenderAddress = vm.parseJsonAddress(json, ".messageSender");
        messageSender = MessageSender(messageSenderAddress);

        uint256 nextNonce = messageSender.nonces(deployer, destinationChainId);

        vm.startBroadcast(deployerPrivateKey);

        // Send a Message
        messageSender.sendMessage(
            destinationChainId, address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8), nextNonce, bytes(message)
        );

        vm.stopBroadcast();
    }
}
