const db = require('../config/db.config.js');
const Telegram = require('./telegram');
const CronJob = require('cron').CronJob;

const User = db.User;
const Survey = db.Survey;
const Question = db.Question;
const Answer = db.Answer;
const Op = db.Sequelize.Op;

const sendSurvey = new CronJob('0 0 * * * *', function() {
    // send notifications when a user has not completed a 'allowMultipleAnswers' survey
    Answer.findAll({
        where: {
            value: 'no_answer',
        },
        include: [{
            model: Question,
            required: true,
            include: [{
                model: Survey,
                where: {
                    end: {
                        [Op.gt]: new Date(),
                    },
                    allowMultipleAnswers: true,
                },
                required: true,
            }],
        }, {
            model: User,
        }],
        group: ['userId'],
        order: [
            [Question, { model: Survey }, 'end', 'asc']
        ],
    }).then(answers => {
        const now = new Date();
        answers.forEach(answer => {
            const hoursBefore = Math.floor((answer.question.survey.end - now) / 1000 / 60 / 60);
            let modulus = 1;
            if (hoursBefore >= 24 * 6) {
                modulus = 24;
            } else if (hoursBefore >= 24 * 3) {
                modulus = 12;
            } else if (hoursBefore >= 24) {
                modulus = 4;
            } else if (hoursBefore >= 16) {
                modulus = 2;
            } else {
                modulus = 1;
            }
            if (hoursBefore % modulus === 0) {
                Telegram.sendMessage(answer.user, "Du hast manche Umfragen noch nicht beantwortet :(", new Date(now.setHours(now.getHours() + modulus)));
            }
        });

    }).catch(console.error);
}, null, true);

exports.sendNewSurvey = (survey, questions, users) => {
    try {

        users.forEach(user => {
            const message = addSurveyMessageCreator.createMessage(user, survey.question + "\n" + (survey.allowMultipleAnswers ? "Mehrere Antworten sind möglich." : "Es ist nur eine Antwort möglich."));
            // save the survey id
            message.addData('s', survey.id);
            // save if multiple answers are allowed
            message.addData('m', survey.allowMultipleAnswers);
            questions.forEach(question => {
                message.addButtonToRow(question.text, 'yes', question.id);
                message.newRow();
            });
            if (survey.allowMultipleAnswers) {
                message.addButtonToRow("Alle 👍", 'yes', -1);
                message.addButtonToRow("Alle 👎", 'no', -1);
            }
            message.sendMessage(survey.end).catch(console.error);
        });
    } catch (error) {
        console.log(error);
    }
};

// handle responses to the bar
const addSurveyMessageCreator = Telegram.registerResponseSystem("survey", (message) => {
    // save the survey id
    message.addData('s', message.s);
    // save if multiple answers are allowed
    message.addData('m', message.m);
    // message.last is there, if m is true and there is a last selected question
    // if the last selected question the same as the current clicked, do nothing
    if (message.last === message.data) {
        return;
    }
    // the last selected question and 'allowMultipleAnswers' is false
    if (message.last !== undefined) {
        Answer.findOne({
            where: {
                questionId: message.last,
                userId: message.userId,
            }
        }).then(answer => {
            answer.update({
                value: 'no_answer',
            }).catch(console.error);
        }).catch(console.error);
    }
    if (message.m === false) {
        // if only one answer is allowed, save the last selected one
        message.addData('last', message.data);
    }

    // set the new selected question to state
    if (message.data >= 0) {
        Answer.findOne({
            where: {
                questionId: message.data,
                userId: message.userId,
            }
        }).then(answer => {
            answer.update({
                value: message.state,
            }).then(() => {
                // Now update the message
                Answer.findAll({
                    where: {
                        userId: message.userId,
                    },
                    include: [{
                        model: Question,
                        where: {
                            surveyId: message.s,
                        },
                        required: true,
                    }],
                    raw: true,
                }).then(answers => {
                    answers.forEach(answer => {
                        const state = answer.value === 'no_answer' ? 'yes' : answer.value === 'yes' ? 'no' : 'yes';
                        const symbol = answer.value === 'no_answer' ? '' : (answer.value === 'yes' ? ': 👍' : (message.m ? ': 👎' : ''));
                        message.addButtonToRow(answer['question.text'] + symbol, state, answer.questionId);
                        message.newRow();
                    });
                    if (message.m) {
                        message.addButtonToRow("Alle 👍", 'yes', -1);
                        message.addButtonToRow("Alle 👎", 'no', -1);
                    }
                    message.sendUpdatedMessage().catch(console.error);
                }).catch(console.error);
            }).catch(console.error);
        }).catch(console.error);
    } else {
        // set all option
        Answer.findAll({
            where: {
                userId: message.userId,
            },
            include: [{
                model: Question,
                where: {
                    surveyId: message.s,
                },
                required: true,
            }],
        }).then(answers => {
            answers.forEach(answer => {
                answer.update({
                    value: message.state,
                }).catch(console.error);

                const state = message.state === 'yes' ? 'no' : 'yes';
                const symbol = message.state === 'yes' ? ': 👍' : ': 👎';
                message.addButtonToRow(answer.question.text + symbol, state, answer.questionId);
                message.newRow();

            });
            message.addButtonToRow("Alle 👍", 'yes', -1);
            message.addButtonToRow("Alle 👎", 'no', -1);
            message.sendUpdatedMessage().catch(console.error);
        });
    }
});