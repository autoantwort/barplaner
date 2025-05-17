import { sequelize, Sequelize } from "../config/database";

const TelegramMetroPromoSubscription = sequelize.define('telegramMetroPromoSubscription', {
    chatId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
    },
});

export { TelegramMetroPromoSubscription };
