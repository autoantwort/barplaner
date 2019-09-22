module.exports = (sequelize, Sequelize, Survey) => {
    const Question = sequelize.define('question', {
        text: {
            type: Sequelize.STRING(64),
        },
        surveyId: {
            type: Sequelize.INTEGER,
            references: {
                model: Survey,
                key: 'id',
            },
        },
    });

    Survey.hasMany(Question, { onDelete: 'cascade' });
    Question.belongsTo(Survey);
    return Question;
};