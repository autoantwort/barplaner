'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('bars', 'studibarsEventId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('bars', 'studibarsEventPosterURL', {
      type: Sequelize.STRING(512),
      allowNull: true,
      defaultValue: null,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('bars', 'studibarsEventId');
    await queryInterface.removeColumn('bars', 'studibarsEventPosterURL');
  }
};
