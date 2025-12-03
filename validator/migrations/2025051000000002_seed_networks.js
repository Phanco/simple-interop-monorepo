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
        lastProcessedBlock: 9759091,
        messengerAddress: "0x581591a4E67a57c315Ee68CB5F6Ab1e8A5F83553",
      },
      {
        id: 11155420,
        name: "OP Testnet (Sepolia)",
        rpc: "https://sepolia.optimism.io",
        blockTime: 2,
        lastProcessedBlock: 36475108,
        messengerAddress: "0xA26EE2631d15729430E2F44f60ef3D6788C06571",
      },
    ];

    await queryInterface.bulkInsert("Networks", networks, {});
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("Networks", null, {});
  },
};
