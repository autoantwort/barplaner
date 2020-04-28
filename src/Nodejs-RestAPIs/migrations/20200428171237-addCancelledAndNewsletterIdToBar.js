'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.addColumn("bars", "canceled", { type: Sequelize.BOOLEAN, defaultValue: false });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.removeColumn("bars", "canceled");
    }
};