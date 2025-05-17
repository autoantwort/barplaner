import { sequelize, Sequelize } from "../config/database";

const User = sequelize.define('user', {
    name: {
        type: Sequelize.STRING,
        unique: true,
    },
    password: {
        type: Sequelize.STRING
    },
    passwordResetKey: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
    },
    email: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
    },
    phone: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
    },
    telegramID: {
        type: Sequelize.STRING,
        defaultValue: () => {
            // generate first login pin 
            return "login pin: " + (Math.random() * 1000000).toFixed(0);
        },
    },
    gitLabID: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
    },
    active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    sessionID: {
        type: Sequelize.STRING,
        unique: true
    },
    experienced_cleaner: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    birthday: {
        type: Sequelize.STRING(10),
        defaultValue: null,
        allowNull: true,
    },
    only_show_gitlab_notifications_if_assigned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
});

export {User};