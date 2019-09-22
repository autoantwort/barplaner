const db = require('../config/db.config.js');
const addSurvey = require('../util/survey');
const User = db.User;
const Survey = db.Survey;
const Answer = db.Answer;
const Question = db.Question;
const sequelize = db.sequelize;


// Post a Survey
exports.create = (req, res) => {
    Survey.create({
        question: req.body.question,
        creatorId: req.body.creatorId,
        end: req.body.end,
        allowMultipleAnswers: req.body.allowMultipleAnswers,
    }).then(survey => {
        Question.bulkCreate(req.body.answers.map(a => { return { text: a, surveyId: survey.id }; })).then(questions => {
            User.findAll({
                where: {
                    active: true
                },
                attributes: ['id', 'telegramID'],
                raw: true,
            }).then(users => {
                questions.forEach(question => {
                    Answer.bulkCreate(users.map(user => { return { userId: user.id, questionId: question.id }; })).error(console.error);
                });
                res.status(201).send(survey);
                addSurvey.sendNewSurvey(survey, questions, users);
            }).catch(err => res.status(500).send("Error -> " + err + " : " + err.stack));
        }).catch(err => res.status(500).send("Error -> " + err.stack));
    }).catch(err => res.status(500).send("Error -> " + err));
};

exports.getAll = (req, res) => {
    Survey.findAll({
        order: [
            ['end', 'DESC']
        ],
    }).then(surveys => {
        const surveyMap = {};
        surveys.forEach(survey => {
            surveyMap[survey.id] = survey;
            survey.questions = [];
            survey.answerMap = {};
        });
        Question.findAll({ raw: true }).then(questions => {
            questions.forEach(question => {
                surveyMap[question.surveyId].questions.push(question.text);
            });
            Answer.findAll({
                include: [{
                    model: Question,
                }],
                raw: true,
            }).then(answers => {
                answers.forEach(answer => {
                    const survey = surveyMap[answer['question.surveyId']];
                    let answers = survey.answerMap[answer.userId];
                    if (answers === undefined) {
                        answers = survey.answerMap[answer.userId] = [];
                    }
                    answers.push(answer.value);
                });
                User.findAll({ attributes: ['id', 'name'], raw: true }).then(users =>  {
                    const userMap = {};
                    users.forEach(user => {
                        userMap[user.id] = user.name;
                    });
                    for (let i = 0; i < surveys.length; ++i) {
                        surveys[i].answers = [];
                        for (let userId in surveys[i].answerMap) {
                            surveys[i].answers.push({
                                username: userMap[userId],
                                answers: surveys[i].answerMap[userId],
                            });
                        }
                        delete surveys[i].answerMap;
                        surveys[i].dataValues.answers = surveys[i].answers;
                        surveys[i].dataValues.questions = surveys[i].questions;
                    }
                    res.send(surveys);
                }).catch(err => res.status(500).send("Error -> " + err));
            }).catch(err => res.status(500).send("Error -> " + err));
        }).catch(err => res.status(500).send("Error -> " + err));
    }).catch(err => res.status(500).send("Error -> " + err));
};