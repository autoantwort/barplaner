const colognePhonetics = require('./../../util/colognePhonetics');

module.exports = (sequelize, Sequelize, Position) => {
    const ItemGroup = sequelize.define('itemGroup', {
        name: {
            type: Sequelize.STRING(64),
            unique: true,
        },
        nameColognePhonetics: {
            type: Sequelize.STRING,
        },
        minimumCount: {
            type: Sequelize.DECIMAL(4, 2),
            defaultValue: 0,
        },
        idealCount: {
            type: Sequelize.DECIMAL(4, 2),
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
        validate: {
            idealSmallerThanMinimum() {
                if (!(this.xPositionOnImage === null && this.yPositionOnImage === null && this.imageId === null ||
                        this.xPositionOnImage !== null && this.yPositionOnImage !== null && this.imageId !== null)) {
                    throw new Error('xPositionOnImage, yPositionOnImageA and imageId must be "null" or "not null"');
                }
            }
        },
        sequelize
    });

    ItemGroup.belongsTo(Position);
    Position.hasMany(ItemGroup);

    return ItemGroup;
};