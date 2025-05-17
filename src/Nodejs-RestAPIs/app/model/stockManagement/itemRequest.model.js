const { sequelize, Sequelize } = require("../../config/database");
const { Item } = require("./item.model");

const ItemRequest = sequelize.define('stockItemRequest', {
    amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    chatId: {
        type: Sequelize.INTEGER(64),
    },
    messageId: {
        type: Sequelize.INTEGER(64),
    },
});

ItemRequest.belongsTo(Item, {
    foreignKey: {
        name: 'itemId',
        allowNull: false,
        unique: true,
    }
});
Item.hasOne(ItemRequest);

export { ItemRequest };
