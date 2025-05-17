import { sequelize, Sequelize } from "../config/database";

const TelegramNewsletter = sequelize.define('telegramNewsletter', {
    chatId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
    },
    enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
    },
    sendAt: {
        type: Sequelize.STRING(4),
        defaultValue: "1500",
    },
    sendDaysBefore: {
        type: Sequelize.STRING(64),
        defaultValue: "[0,1,3,8]",
    },
});

export { TelegramNewsletter };
