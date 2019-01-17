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
    });

    return User;
};