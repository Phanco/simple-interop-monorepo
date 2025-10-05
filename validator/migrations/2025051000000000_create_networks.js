"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Networks", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      rpc: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: false,
      },
      chainId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      blockTime: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      lastProcessedBlock: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      senderContractAddress: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      receiverContractAddress: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("Networks");
  },
};
