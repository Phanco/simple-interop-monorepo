"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const supportedNetworkIds =
      process.env.SUPPORTED_CHAIN_IDS.split(",").map(Number);

    // Generate all distinct pairs of network IDs
    // For [1, 2, 3] -> [[1,2], [1,3], [2,3]]
    const networkPairs = [];
    for (let i = 0; i < supportedNetworkIds.length; i++) {
      for (let j = i + 1; j < supportedNetworkIds.length; j++) {
        const fromNetworkId = Math.min(
          supportedNetworkIds[i],
          supportedNetworkIds[j],
        );
        const toNetworkId = Math.max(
          supportedNetworkIds[i],
          supportedNetworkIds[j],
        );
        networkPairs.push({ fromNetworkId, toNetworkId });
      }
    }

    // Define base peers (these will be created for each network pair)
    const basePeers = [
      {
        name: "Melchior-0",
        uri: "http://127.0.0.1:3000",
        enabled: true,
      },
      {
        name: "Balthasar-1",
        uri: "http://127.0.0.1:3001",
        enabled: true,
      },
      {
        name: "Casper-2",
        uri: "http://127.0.0.1:3002",
        enabled: true,
      },
    ];

    // Create peers for each network pair
    const peers = [];
    for (const pair of networkPairs) {
      for (const basePeer of basePeers) {
        peers.push({
          fromNetworkId: pair.fromNetworkId,
          toNetworkId: pair.toNetworkId,
          ...basePeer,
        });
      }
    }

    if (peers.length > 0) {
      await queryInterface.bulkInsert("Peers", peers, {});
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("Peers", null, {});
  },
};
