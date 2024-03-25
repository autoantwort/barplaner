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
            unique: 'uniqueBarcodeAtSeller'
        },
        barcodePack: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
            unique: true
        },
        articleNumber: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
        },
        seller: {
            type: Sequelize.ENUM,
            values: ['Amazon', 'Metro', 'Aldi', 'Conalco', 'Rewe', 'Netto', 'Donation', 'Other'],
            unique: 'uniqueBarcodeAtSeller'
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
        internalNote: {
            type: Sequelize.TEXT,
        },
        website: {
            type: Sequelize.STRING(1024),
        },
        alcoholByVolume:  {
            type: Sequelize.DECIMAL(2, 2),
        }
    }, {
        hooks: {
            beforeSave: (item, options) => {
                if (item._changed.has("name")) {
                    item.nameColognePhonetics = colognePhonetics.convert(item.name);
                }
            },
            beforeBulkUpdate: (options) => {
                if (options.fields.indexOf('name') !== -1)
                    options.individualHooks = true;
            },
        },
        sequelize
    });

    Item.belongsTo(ItemGroup);
    ItemGroup.hasMany(Item);

    Item.belongsTo(Position);
    Position.hasMany(Item);

    Item.belongsTo(Image);
    Image.hasMany(Item);

    return Item;
};