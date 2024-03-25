'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add the column
    return queryInterface.addColumn("invoiceEntries", "gtinPack", {
      type: Sequelize.STRING,
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("invoiceEntries", "gtinPack");
  }
};