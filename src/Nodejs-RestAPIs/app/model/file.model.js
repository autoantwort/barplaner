const crypto = require('crypto');

module.exports = (sequelize, Sequelize) => {
    const File = sequelize.define('file', {
        id: {
            type: Sequelize.STRING(32),
            primaryKey: true,
            defaultValue: () => {
                // generate random id
                return crypto.randomBytes(32).toString('hex');
            },
        },
        filename: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
        },
        mimeType: {
            type: Sequelize.STRING,
            // defaultValue: "application/octet-stream",
        },
        telegramFileId: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
        }
    });

    return File;
};