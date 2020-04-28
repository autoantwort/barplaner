module.exports = (sequelize, Sequelize, File) => {
    const Invoice = sequelize.define('invoice', {
        deliveryDate: {
            type: Sequelize.DATE,
        },
        invoiceDate: {
            type: Sequelize.DATE,
        },
        seller: {
            type: Sequelize.STRING,
        },
        extraCostsDescription: { // something like delivery costs
            type: Sequelize.STRING(1024),
        },
        extraCostsAmount: {
            type: Sequelize.Sequelize.DECIMAL(6, 2),
        },
    });

    Invoice.belongsTo(File);
    File.hasMany(Invoice);

    return Invoice;
};