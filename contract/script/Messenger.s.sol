// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";

import { Messenger } from "../src/Messenger.sol";

contract DeployMessenger is Script {
    Messenger public messenger;

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

        messenger = new Messenger(owner, relayers, threshold);
        assert(messenger.owner() == owner);
        ensureRelayers(relayers);
        assert(messenger.CONSENSUS_THRESHOLD() == threshold);

        vm.stopBroadcast();

        console.log("Messenger deployed at:", address(messenger));

        // Optionally save deployment info to JSON
        string memory json = vm.serializeAddress("deployment", "messenger", address(messenger));
        string memory outputPath = string.concat("./deployment/", vm.toString(block.chainid));
        vm.createDir(outputPath, true);
        vm.writeJson(json, string.concat(outputPath, "/Messenger.json"));
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

    function ensureRelayers(address[] memory expectRelayers) internal view {
        assert(expectRelayers.length == messenger.relayersLength());
        for (uint256 i; i < expectRelayers.length;) {
            assert(expectRelayers[i] == messenger.relayers(i));
            unchecked {
                i++;
            }
        }
    }
}
