'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('customers');
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.createTable(
            'customers', {
                name: {
                    type: Sequelize.STRING
                },
                age: {
                    type: Sequelize.INTEGER
                },
                active: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false
                },
                createdAt: {
                    type: Sequelize.DATE
                },
                updatedAt: {
                    type: Sequelize.DATE
                },
            }
        );
    }
};