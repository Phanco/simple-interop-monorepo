// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";

import { MessageSender } from "../src/sender/MessageSender.sol";

contract DeployMessageSender is Script {
    MessageSender public messageSender;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy contracts
        messageSender = new MessageSender();

        string memory json = vm.serializeAddress("deployment", "messageSender", address(messageSender));
        string memory outputPath = string.concat("./deployment/", vm.toString(block.chainid));
        vm.createDir(outputPath, true);
        vm.writeJson(json, string.concat(outputPath, "/Sender.json"));
        console.log("MessageSender deployed at:", address(messageSender));
    }
}
