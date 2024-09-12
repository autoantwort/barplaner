module.exports = (sequelize, Sequelize) => {
    const TelegramMetroPromoSubscription = sequelize.define('telegramMetroPromoSubscription', {
        chatId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
        },
    });

    return TelegramMetroPromoSubscription;
};
