module.exports = (sequelize, Sequelize, Invoice, Item) => {
    const InvoiceEntry = sequelize.define('invoiceEntry', {
        itemDescription: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        articleNumber: { // the article number from the seller / producer
            type: Sequelize.STRING,
        },
        gtin: { // Global Trade Item Number formerly European Article Number (EAN)
            type: Sequelize.STRING,
        },
        gtinPack: { // gtin of the pack
            type: Sequelize.STRING,
        },
        quantity: { // how often was the item bought
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        amount: { // content of the item if possible (e.g. for beverages)
            type: Sequelize.INTEGER,
        },
        unit: { // the unit to measure the content of the item if possible (e.g. for beverages)
            type: Sequelize.ENUM,
            values: ['ml', 'gramm'],
        },
        netPrice: {
            type: Sequelize.DECIMAL(10, 2),
        },
        brottoPrice: {
            type: Sequelize.DECIMAL(10, 2),
        },
        images: {
            type: Sequelize.STRING(2048),
        },
        productSite: { // the website for this product
            type: Sequelize.STRING,
        },
        alcoholByVolume:  {
            type: Sequelize.DECIMAL(2, 2),
        },
    });

    InvoiceEntry.belongsTo(Invoice);
    Invoice.hasMany(InvoiceEntry);

    InvoiceEntry.belongsTo(Item);
    Item.hasMany(InvoiceEntry);

    return InvoiceEntry;
};