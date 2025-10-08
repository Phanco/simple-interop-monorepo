"use strict";

module.exports = {
  up: async (queryInterface) => {
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
      name: "Sepolia Testnet",
      rpc: "https://sepolia.drpc.org",
      chainId: 11155111,
      blockTime: 12,
      lastProcessedBlock: 9364777,
      senderContractAddress: "0x1bEF4ff678ADbB41492850b746E1B98058aFB1bC",
    },{
      name: "OP Testnet (Sepolia)",
      rpc: "https://sepolia.optimism.io",
      chainId: 11155420,
      blockTime: 2,
      lastProcessedBlock: 34035930,
      receiverContractAddress: "0x4cbf76b09464125a9ef6638fA50dDF57f994C58a",
    }]

    await queryInterface.bulkInsert("Networks", networks, {});
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("Networks", null, {});
  },
};
