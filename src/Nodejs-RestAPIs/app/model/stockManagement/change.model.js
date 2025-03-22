const reasons = require('../../common/stockChangeReasons.js').reasonNames;

module.exports = (sequelize, Sequelize, Item, User, InvoiceEntry) => {
    const StockChange = sequelize.define('stockChange', {
        date: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            allowNull: false,
        },
        netPrice: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: null,
        },
        brottoPrice: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: null,
        },
        amount: {
            type: Sequelize.DECIMAL(6, 2),
            allowNull: false,
        },
        priceAccuracy: {
            type: Sequelize.ENUM,
            values: ['unknown', 'estimated', 'fromBill', 'researched', 'fromPreviousBill'],
            allowNull: true,
            defaultValue: null,
        },
        reason: {
            type: Sequelize.ENUM,
            values: reasons,
        },
        note: {
            type: Sequelize.STRING(1024),
            allowNull: true,
            defaultValue: null,
        },
    });

    StockChange.belongsTo(Item, { foreignKey: { name: 'itemId', allowNull: false }, targetKey: 'id' });
    Item.hasMany(StockChange, { foreignKey: { name: 'itemId', allowNull: false } });

    StockChange.belongsTo(User);
    User.hasMany(StockChange);

    StockChange.belongsTo(InvoiceEntry);
    InvoiceEntry.hasOne(StockChange);

    return StockChange;
};