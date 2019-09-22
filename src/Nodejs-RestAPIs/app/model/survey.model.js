module.exports = (sequelize, Sequelize, User) => {
    const Survey = sequelize.define('survey', {
        question: {
            type: Sequelize.STRING(1024),
        },
        creatorId: {
            type: Sequelize.INTEGER,
            references: {
                model: User,
                key: 'id',
            },
            allowNull: true,
        },
        end: {
            type: Sequelize.DATE,
        },
        allowMultipleAnswers: {
            type: Sequelize.BOOLEAN,
        },
    });

    User.hasMany(Survey, { foreignKey: 'creatorId' });
    Survey.belongsTo(User, { foreignKey: 'creatorId' });
    return Survey;
};