'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add the column
    await queryInterface.addColumn("stockItems", "barcodePack", { 
      type: Sequelize.STRING, 
      allowNull: true, 
      defaultValue: null 
    });

    // Add the unique index
    return queryInterface.addIndex('stockItems', ['barcodePack'], {
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the index first
    await queryInterface.removeIndex('stockItems', ['barcodePack']);

    // Then remove the column
    return queryInterface.removeColumn("stockItems", "barcodePack");
  }
};