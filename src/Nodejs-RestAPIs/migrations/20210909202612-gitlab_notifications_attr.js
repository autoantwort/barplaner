'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn("users", "only_show_gitlab_notifications_if_assigned", { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("users", "only_show_gitlab_notifications_if_assigned");
  }
};
