'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.addColumn("users", "gitLabID", { type: Sequelize.INTEGER, allowNull: true, defaultValue: null });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.removeColumn("users", "gitLabID");
    }
};