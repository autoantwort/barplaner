import { Sequelize, sequelize } from "../config/database";

const ShouldDelete = sequelize.define('shouldDelete', {
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
});

export { ShouldDelete };
