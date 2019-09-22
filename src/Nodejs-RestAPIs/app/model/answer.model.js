module.exports = (sequelize, Sequelize, User, Question) => {
    const Answer = sequelize.define('answer', {
        userId: {
            type: Sequelize.INTEGER,
            references: {
                model: User,
                key: 'id',
            },
            primaryKey: true,
        },
        questionId: {
            type: Sequelize.INTEGER,
            references: {
                model: Question,
                key: 'id',
            },
            primaryKey: true,
        },
        value: {
            type: Sequelize.ENUM,
            values: ['yes', 'no_answer', 'no'],
            defaultValue: 'no_answer',
        },
    });

    User.hasMany(Answer, { onDelete: 'cascade' });
    Answer.belongsTo(User);

    Question.hasMany(Answer, { onDelete: 'cascade' });
    Answer.belongsTo(Question);
    return Answer;
};