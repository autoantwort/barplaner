import { sequelize, Sequelize } from "../config/database";
import { File } from "./file.model";

const Image = sequelize.define('image', {
    titel: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
    },
}, {
    validate: {
        imageFileMustExists() {
            if ((this.original === null) && (this.compressed === null)) {
                throw new Error('A image must exists. The original and the compressed reference are null.');
            }
        }
    },
    sequelize: sequelize,
});

Image.belongsTo(File, { foreignKey: 'original', targetKey: 'id' });
Image.belongsTo(File, { foreignKey: 'compressed', targetKey: 'id' });
File.hasMany(Image, { as: 'Original', foreignKey: 'original' });
File.hasMany(Image, { as: 'Compressed', foreignKey: 'compressed' });

export { Image };
