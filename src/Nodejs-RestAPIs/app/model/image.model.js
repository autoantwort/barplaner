module.exports = (sequelize, Sequelize, File) => {
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

    return Image;
};