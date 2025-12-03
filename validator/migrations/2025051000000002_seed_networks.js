"use strict";

module.exports = {
  up: async (queryInterface) => {
    const networks = [
      {
        id: 31337,
        name: "Anvil Testnet (Sender)",
        rpc: "http://127.0.0.1:8545",
        blockTime: 2,
        lastProcessedBlock: 0,
        messengerAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      },
      {
        id: 31338,
        name: "Anvil Testnet (Receiver)",
        rpc: "http://127.0.0.1:8546",
        blockTime: 2,
        lastProcessedBlock: 0,
        messengerAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      },
      {
        id: 11155111,
        name: "Sepolia Testnet",
        rpc: "https://sepolia.drpc.org",
        blockTime: 12,
        lastProcessedBlock: 9752154,
        messengerAddress: "0x1bEF4ff678ADbB41492850b746E1B98058aFB1bC",
      },
      {
        id: 11155420,
        name: "OP Testnet (Sepolia)",
        rpc: "https://sepolia.optimism.io",
        blockTime: 2,
        lastProcessedBlock: 36429930,
        messengerAddress: "0x4cbf76b09464125a9ef6638fA50dDF57f994C58a",
      },
    ];

    await queryInterface.bulkInsert("Networks", networks, {});
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("Networks", null, {});
  },
};
