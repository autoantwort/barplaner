const crypto = require('crypto');

module.exports = (sequelize, Sequelize) => {
    const File = sequelize.define('file', {
        id: {
            // should / must be the md5 file hash
            type: Sequelize.STRING(32),
            primaryKey: true,
            allowNull: false,
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