'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.addColumn("bars", "facebookCoverImageURL", { type: Sequelize.STRING(512), allowNull: true, defaultValue: null });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.removeColumn("bars", "facebookCoverImageURL");
    }
};