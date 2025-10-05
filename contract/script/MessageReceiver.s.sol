// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";

import { MessageReceiver } from "../src/receiver/MessageReceiver.sol";

contract DeployMessageReceiver is Script {
    MessageReceiver public messageReceiver;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        console.log("Deployer:", deployer);

        address owner = vm.envAddress("OWNER");
        console.log("Owner:", owner);

        address[] memory relayers = vm.envAddress("RELAYERS", ",");
        printRelayers(relayers);

        uint256 threshold = vm.envUint("THRESHOLD");
        console.log("Threshold:", threshold);

        vm.startBroadcast(deployerPrivateKey);

        messageReceiver = new MessageReceiver(owner, relayers, 2);
        assert(messageReceiver.owner() == owner);
        ensureRelayers(relayers, messageReceiver);
        assert(messageReceiver.CONSENSUS_THRESHOLD() == threshold);

        vm.stopBroadcast();

        console.log("MessageSender deployed at:", address(messageReceiver));
    }

    function printRelayers(address[] memory relayers) internal pure {
        console.log("Relayers:");
        for (uint256 i; i < relayers.length;) {
            console.log(i, ":", relayers[i]);
            unchecked {
                i++;
            }
        }
    }

    function ensureRelayers(address[] memory expectRelayers, MessageReceiver messageReceiver) internal view {
        assert(expectRelayers.length == messageReceiver.relayersLength());
        for (uint256 i; i < expectRelayers.length;) {
            assert(expectRelayers[i] == messageReceiver.relayers(i));
            unchecked {
                i++;
            }
        }
    }
}
