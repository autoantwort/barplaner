module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define('user', {
        name: {
            type: Sequelize.STRING,
            unique: true,
        },
        password: {
            type: Sequelize.STRING
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
    });

    return User;
};