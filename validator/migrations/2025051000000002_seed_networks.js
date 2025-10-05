"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const networks = [{
      name: "Anvil Testnet (Sender)",
      rpc: "http://127.0.0.1:8545",
      chainId: 31337,
      blockTime: 2,
      lastProcessedBlock: 0,
      senderContractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    },{
      name: "Anvil Testnet (Receiver)",
      rpc: "http://127.0.0.1:8546",
      chainId: 31338,
      blockTime: 2,
      lastProcessedBlock: 0,
      receiverContractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    },{
      name: "Base Testnet (Sepolia)",
      rpc: "https://sepolia.base.org",
      chainId: 84532,
      blockTime: 2,
      lastProcessedBlock: 31925457,
    },{
      name: "OP Testnet (Sepolia)",
      rpc: "https://sepolia.optimism.io",
      chainId: 11155420,
      blockTime: 2,
      lastProcessedBlock: 33908864,
    }]

    await queryInterface.bulkInsert("Networks", networks, {});
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("Networks", null, {});
  },
};
