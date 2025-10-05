"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [networks] = await queryInterface.sequelize.query('SELECT * FROM "Networks"');

    const fromNetwork = networks.find(network => network.chainId === 31337);
    const toNetwork = networks.find(network => network.chainId === 31338);

    const peers = [{
      fromNetworkId: fromNetwork.id,
      toNetworkId: toNetwork.id,
      name: "Melchior-0",
      uri: "http://127.0.0.1:3000",
      enabled: true,
    },{
      fromNetworkId: fromNetwork.id,
      toNetworkId: toNetwork.id,
      name: "Balthasar-1",
      uri: "http://127.0.0.1:3001",
      enabled: true,
    },{
      fromNetworkId: fromNetwork.id,
      toNetworkId: toNetwork.id,
      name: "Casper-2",
      uri: "http://127.0.0.1:3002",
      enabled: true,
    }]

    await queryInterface.bulkInsert("Peers", peers, {});

  },

  down: async (queryInterface) => {
    await queryInterface.bulkInsert("Peers", peers, {});
  },
};
