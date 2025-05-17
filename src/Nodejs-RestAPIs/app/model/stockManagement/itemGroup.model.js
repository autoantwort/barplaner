import { Sequelize, sequelize } from '../../config/database';
import { convert } from './../../util/colognePhonetics';
import { Position } from './position.model';

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
            if (item._changed.has("name")) {
                item.nameColognePhonetics = convert(item.name);
            }
        },
        beforeBulkUpdate: (options) => {
            if (options.fields.indexOf('name') !== -1)
                options.individualHooks = true;
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

export { ItemGroup };
