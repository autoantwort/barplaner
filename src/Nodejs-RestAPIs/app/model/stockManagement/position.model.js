const colognePhonetics = require('./../../util/colognePhonetics');

module.exports = (sequelize, Sequelize, Image) => {
    const Position = sequelize.define('stockPosition', {
        name: {
            type: Sequelize.STRING(64),
            unique: true,
        },
        nameColognePhonetics: {
            type: Sequelize.STRING,
        },
        description: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
        },
        xPositionOnImage: {
            type: Sequelize.FLOAT,
            allowNull: true,
            defaultValue: null,
        },
        yPositionOnImage: {
            type: Sequelize.FLOAT,
            allowNull: true,
            defaultValue: null,
        },
        room: {
            type: Sequelize.ENUM,
            values: ['K14', 'K6', 'K2', 'Cocktaillager', 'Techniklager', 'Cocktailtheke', 'Biertheke', 'Anderer'],
        }
    }, {
        validate: {
            imagePosition() {
                if (!(this.xPositionOnImage === null && this.yPositionOnImage === null && this.imageId === null ||
                        this.xPositionOnImage !== null && this.yPositionOnImage !== null && this.imageId !== null)) {
                    throw new Error('xPositionOnImage, yPositionOnImageA and imageId must be "null" or "not null"');
                }
            }
        },
        hooks: {
            beforeSave: (item, options) => {
                if (item._changed.name === true) {
                    item.nameColognePhonetics = colognePhonetics.convert(item.name);
                }
            },
            beforeBulkUpdate: (options) => {
                if (options.fields.indexOf('name') !== -1)
                    options.individualHooks = true;
            },
        },
        sequelize: sequelize,
    });

    Position.belongsTo(Image);
    Image.hasMany(Position);

    return Position;
};