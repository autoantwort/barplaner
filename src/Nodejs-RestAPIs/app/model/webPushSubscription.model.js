import { sequelize, Sequelize } from "../config/database";

const WebPushSubscription = sequelize.define('webPushSubscription', {
    endpoint: {
        type: Sequelize.STRING,
        primaryKey: true,
    },
    subscription: {
        type: Sequelize.STRING,
    },
});

export { WebPushSubscription };
