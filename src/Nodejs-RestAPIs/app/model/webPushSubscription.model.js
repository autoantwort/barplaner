module.exports = (sequelize, Sequelize) => {
    const WebPushSubscription = sequelize.define('webPushSubscription', {
        endpoint: {
            type: Sequelize.STRING,
            primaryKey: true,
        },
        subscription: {
            type: Sequelize.STRING,
        },
    });

    return WebPushSubscription;
};