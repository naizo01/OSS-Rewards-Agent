// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";

contract DeployBase is Script {
    string constant directory = "./deployments/";

    function writeDeployedAddress(address proxyAddress, string memory fileName) internal {
        // chainIdを取得
        string memory chainId = vm.toString(block.chainid);

        // ファイルにデプロイしたアドレスを書き出す
        string memory path = string(abi.encodePacked(directory, chainId, "/", fileName));
        vm.writeFile(path, vm.toString(proxyAddress));

        // コンソールにアドレスとファイルパスを出力
        // console.log("Deployed address:", proxyAddress);
        // console.log("Written to file:", path);
    }
    
        function writeDeployedBytes32(bytes32 proxyAddress, string memory fileName) internal {
        // chainIdを取得
        string memory chainId = vm.toString(block.chainid);

        // ファイルにデプロイしたアドレスを書き出す
        string memory path = string(abi.encodePacked(directory, chainId, "/", fileName));
        vm.writeFile(path, vm.toString(proxyAddress));

        // コンソールにアドレスとファイルパスを出力
        // console.log("Deployed address:", proxyAddress);
        // console.log("Written to file:", path);
    }

    function readDeployedAddress(string memory fileName) internal view returns (address) {
        // chainIdを取得
        string memory chainId = vm.toString(block.chainid);

        // ファイルからデプロイしたアドレスを読み出す
        string memory path = string(abi.encodePacked(directory, chainId, "/", fileName));
        string memory addressStr = vm.readFile(path);
        return vm.parseAddress(addressStr);
    }

    // 環境変数からuint256を読み込む関数
    function getEnvUint(string memory key) internal view returns (uint256) {
        uint256 value = vm.envUint(key);
        require(value != 0, string(abi.encodePacked(key, " is not set")));
        return value;
    }

    // 環境変数からaddressを読み込む関数
    function getEnvAddress(string memory key) internal view returns (address) {
        address value = vm.envAddress(key);
        require(value != address(0), string(abi.encodePacked(key, " is not set")));
        return value;
    }
}
