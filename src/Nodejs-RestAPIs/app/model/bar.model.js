module.exports = (sequelize, Sequelize) => {
    const Bar = sequelize.define('bar', {
        name: {
            type: Sequelize.STRING
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        public: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
        },
        canceled: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        },
        start: {
            type: Sequelize.DATE
        },
        end: {
            type: Sequelize.DATE,
            allowNull: true,
            defaultValue: null,
        },
        facebookEventID: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
        },
        facebookCoverImageURL: {
            type: Sequelize.STRING(512),
            allowNull: true,
            defaultValue: null,
        },
    });
    return Bar;
};