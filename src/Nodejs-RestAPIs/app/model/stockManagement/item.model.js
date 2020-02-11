const colognePhonetics = require('./../../util/colognePhonetics');

module.exports = (sequelize, Sequelize, Image, ItemGroup, Position) => {
    const Item = sequelize.define('stockItem', {
        name: {
            type: Sequelize.STRING,
        },
        nameColognePhonetics: {
            type: Sequelize.STRING,
        },
        barcode: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
        },
        articleNumber: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
        },
        image: {
            type: Sequelize.INTEGER,
            references: {
                model: Image,
                key: 'id',
            },
            allowNull: true,
            defaultValue: null,
        },
        seller: {
            type: Sequelize.ENUM,
            values: ['Amazon', 'Metro', 'Aldi', 'Conalco', 'Rewe', 'Netto', 'Donation', 'Other'],
            defaultValue: 'other',
        },
        amount: {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        unit: {
            type: Sequelize.ENUM,
            values: ['ml', 'gramm'],
            allowNull: true,
            defaultValue: null,
        },
    }, {
        hooks: {
            beforeSave: (item, options) => {
                if (item._changed.name === true) {
                    item.nameColognePhonetics = colognePhonetics.convert(item.name);
                }
            },
        },
        sequelize
    });

    Item.belongsTo(ItemGroup);
    ItemGroup.hasMany(Item);

    Item.belongsTo(Position);
    Position.hasMany(Item);

    return Item;
};