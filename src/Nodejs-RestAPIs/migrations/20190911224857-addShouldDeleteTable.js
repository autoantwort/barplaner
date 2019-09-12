'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable(
            'shouldDeletes', {
                chatID: {
                    type: Sequelize.INTEGER(64),
                    primaryKey: true,
                },
                messageID: {
                    type: Sequelize.INTEGER(64),
                    primaryKey: true,
                },
                deleteAfter: {
                    type: Sequelize.DATE,
                },
                newText: {
                    type: Sequelize.STRING(512),
                    allowNull: true,
                    defaultValue: null,
                },
                createdAt: {
                    type: Sequelize.DATE
                },
                updatedAt: {
                    type: Sequelize.DATE
                },
            });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable("shouldDeletes");
    }
};