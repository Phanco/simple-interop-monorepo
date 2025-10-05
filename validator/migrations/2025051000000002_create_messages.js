"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Messages", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      messageId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      fromNetworkId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Networks",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      toNetworkId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Networks",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      sender: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      nonce: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      recipient: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      payload: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      globalNonce: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      signature: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.INTEGER,
        allowNull: false,
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
    await queryInterface.dropTable("Messages");
  },
};
