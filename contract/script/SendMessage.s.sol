// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";

import { Messenger } from "../src/Messenger.sol";

contract SendMessage is Script {
    Messenger public messenger;

    function run() external {
        string memory message = vm.envString("MESSAGE");
        console.log("Sending Message:", message);

        uint256 destinationChainId = vm.envUint("CHAIN_ID");
        console.log("Destination Chain ID:", destinationChainId);

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        console.log("Deployer:", deployer);

        string memory jsonPath = string.concat("./deployment/", vm.toString(block.chainid), "/Messenger.json");
        string memory json = vm.readFile(jsonPath);

        address messengerAddress = vm.parseJsonAddress(json, ".messenger");
        messenger = Messenger(messengerAddress);
        console.log("Messenger Address:", messengerAddress);

        uint256 nextNonce = messenger.outgoingNonces(deployer, destinationChainId);

        vm.startBroadcast(deployerPrivateKey);

        // Send a Message
        messenger.sendMessage(
            destinationChainId, address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8), nextNonce, bytes(message)
        );

        vm.stopBroadcast();
    }
}
