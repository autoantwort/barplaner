const db = require('../config/db.config.js');
const env = require('../config/env');


const Bar = db.Bar;
const User = db.User;
const UserRoles = db.UserRoles;
const BarDuty = db.BarDuty;
const Role = db.Role;
const Setting = db.Setting;
const Op = db.Sequelize.Op;



const TOKEN = env.telegramAccessToken;
const TelegramBot = require('node-telegram-bot-api');
const options = {
    polling: {
        autoStart: typeof env.telegramAccessToken === "string" && env.telegramAccessToken.length > 0
    }
};
const bot = new TelegramBot(TOKEN, options);



console.log("## start bot, polling : ", bot.isPolling());

bot.on('polling_error', (error) => {
    console.log(error);
});

// Matches /login
bot.onText(/\/login/, msg => {
    if (msg.text.substr(6).trim().length === 0) {
        bot.sendMessage(msg.chat.id, "Du hast den Pin vergessen!");
        return;
    }
    User.findOne({
        where: {
            telegramID: "login pin: " + msg.text.substr(6).trim()
        }
    }).then(user => {
        if (user === null) {
            bot.sendMessage(msg.chat.id, "Der Pin ist leider falsch, es gibt keinen Nutzer mit diesen Pin.");
        } else {
            user.update({
                telegramID: msg.chat.id,
            }).then(() => {
                bot.sendMessage(msg.chat.id, "Du hast dich erfolgreich eingeloggt! Hier wirst du über anstehende Bars informiert und ob du z.B. putzten musst.");
            }).catch(err => {
                console.error(err);
                bot.sendMessage(msg.chat.id, "Fehler :( \n" + JSON.stringify(err));
            });
            // send the newest bars:
            let daysAhead = new Date();
            daysAhead.setDate(daysAhead.getDate() + 7);
            Bar.findAll({
                where: {
                    start: {
                        [Op.and]: {
                            [Op.gt]: new Date(),
                            [Op.lt]: daysAhead
                        }
                    }

                }
            }).then(bars => {
                if (bars.length !== 0) {
                    let index = 0;
                    let sendInfo = () => {
                        sendBarInfo(bars[index], user.id)
                            .then(() => {
                                ++index;
                                if (index < bars.length) {
                                    sendInfo();
                                }
                            })
                            .catch(console.error)
                    };
                    sendInfo();
                }
            }).catch(console.error);
        }
    });
});

bot.onText(/\/start/, msg => {
    bot.sendMessage(msg.chat.id, "Hallo " + msg.from.first_name + ", gehe auf [Account](" + env.baseURL + "/#/account) und logge dich mittels /login <pin> ein.", { parse_mode: "Markdown" });
});







function sendBarInfo(bar, userID) {
    return new Promise((resolve, reject) => {
        let userWhere = {};
        if (userID !== undefined) {
            userWhere.userID = userID;
        }
        BarDuty.findAll({
            where: {
                ...userWhere,
                barID: bar.id,
            },
            include:  [{
                model: User
            }]
        }).then(duties => {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const barDate = new Date(bar.start);
            barDate.setHours(0, 0, 0, 0);
            let dayDiff = (now - barDate) / 1000 / 60 / 60 / 24;
            if (dayDiff === 0) {
                var dayText = "heute";
            } else if (dayDiff === 1) {
                var dayText = "morgen";
            } else if (dayDiff === 2) {
                var dayText = "übermorgen";
            } else {
                var dayText = "am " + bar.start.getDate() + '.' + (bar.start.getMonth() + 1) + '.' + bar.start.getFullYear();
            }
            duties.filter(d => d.user.telegramID.indexOf("login") === -1 && d.state === 'no_info').forEach(d => {
                let message = "Hallo " + d.user.name + ",\n" +
                    dayText + " ist " + bar.name + "!\n";
                if (d.have_to_clean) {
                    let haveToClean = [];
                    duties.filter(duty => duty.user.name !== d.user.name && duty.have_to_clean).forEach(duty => haveToClean.push(duty.user.name));
                    message += "Du musst dieses Mal ";
                    if (haveToClean.length === 0) {
                        message += "alleine ";
                    } else {
                        message += "mit ";
                        for (let i = 0; i < haveToClean.length - 2; ++i) {
                            message += haveToClean[i] + ", ";
                        }
                        if (haveToClean.length > 1) {
                            message += haveToClean[haveToClean.length - 2] + " und ";
                        }
                        message += haveToClean[haveToClean.length - 1] + " ";
                    }
                    message += "putzten.";
                } else {
                    message += "Du musst dieses Mal nicht putzten.";
                }

                bot.sendMessage(d.user.telegramID, message).then(() => {
                    bot.sendMessage(d.user.telegramID, "Kommst du?", {
                        reply_markup: {
                            inline_keyboard: [
                                [{
                                    text: 'Ich komme',
                                    callback_data: JSON.stringify({
                                        id: "state",
                                        data: "present",
                                        barID: d.barID,
                                        userID: d.userID,
                                    })
                                }, {
                                    text: 'Ich komme nicht',
                                    callback_data: JSON.stringify({
                                        id: "state",
                                        data: "absent",
                                        barID: d.barID,
                                        userID: d.userID,
                                    })
                                }]
                            ]
                        }
                    });
                });
            });
            resolve();
        }).catch(reject);
    });
}





// Handle callback queries
bot.on('callback_query', function onCallbackQuery(callbackQuery) {
    const data = JSON.parse(callbackQuery.data);
    const msg = callbackQuery.message;
    const opts = {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
    };
    let reply = null;
    let whereObj = {
        where: {
            barID: data.barID,
            userID: data.userID,
        }
    };
    let button = (id, text, data_) => {
        if (data_ === undefined)
            data_ = text;
        return {
            text: text,
            callback_data: JSON.stringify({
                id: id,
                data: data_,
                barID: data.barID,
                userID: data.userID,
            })
        };
    };
    if (data.id === "state") {
        BarDuty.update({
            state: data.data
        }, whereObj).then(() => {
            if (data.data === "present") {
                bot.editMessageText("Welche Theke machst du?", {
                    ...opts,
                    reply_markup: {
                        inline_keyboard: [
                            [button("job", 'Biertheke'), button("job", 'Cocktailtheke')]
                        ]
                    }
                });
            } else {
                bot.editMessageText("Schade!", {
                    ...opts,
                    reply_markup: {
                        inline_keyboard: [
                            [button("state", 'Ich komme doch!', 'present')]
                        ]
                    }
                });
            }
        });
    } else if (data.id === "job") {
        BarDuty.update({
            job: data.data
        }, whereObj).then(() => {
            let buttons = [];
            for (let i = 20; i < 26; ++i) {
                buttons.push([button("from", ((i % 24) < 10 ? '0' : '') + (i % 24) + ":00"), button("from", ((i % 24) < 10 ? '0' : '') + (i % 24) + ":30")]);
            }
            bot.editMessageText("Wann fängst du an?", {
                ...opts,
                reply_markup: {
                    inline_keyboard: buttons
                }
            });
        });
    } else if (data.id === "from") {
        BarDuty.update({
            from: data.data
        }, whereObj).then(() => {
            let buttons = [];
            for (let i = 22; i < 24 + 7; ++i) {
                buttons.push([button("to", ((i % 24) < 10 ? '0' : '') + (i % 24) + ":00"), button("to", ((i % 24) < 10 ? '0' : '') + (i % 24) + ":30")]);
            }
            buttons.push([button("to", "Ende")]);
            bot.editMessageText("Bis wann bleibst du?", {
                ...opts,
                reply_markup: {
                    inline_keyboard: buttons
                }
            });
        });
    } else if (data.id === "to") {
        BarDuty.update({
            to: data.data
        }, whereObj).then(() => {
            bot.editMessageText("Schön, dass du kommst!", opts);
        });
    }

});
let lastSentDate;
let sendDaysBefore = [14, 6, 2, 1, 0];
// check for bars, only start when the DB is in sync, so that in the setIntervall call the Bar.find will work directly 
db.addSyncCallback(() => {
    let checkForEventsAndSend = () => {
        let daysAhead = new Date();
        daysAhead.setDate(daysAhead.getDate() + 15);
        Bar.findAll({
            where: {
                start: {
                    [Op.and]: {
                        [Op.gt]: new Date(),
                        [Op.lt]: daysAhead
                    }
                }
            }
        }).then(bars => {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            bars = bars.filter(b => {
                const barDate = new Date(b.start);
                barDate.setHours(0, 0, 0, 0);
                let dayDiff = (barDate - now) / 1000 / 60 / 60 / 24;
                return sendDaysBefore.some(v => v === dayDiff);
            })
            if (bars.length !== 0) {
                let index = 0;
                let sendInfo = () => {
                    sendBarInfo(bars[index])
                        .then(() => {
                            ++index;
                            if (index < bars.length) {
                                sendInfo();
                            }
                        })
                        .catch(console.error)
                };
                sendInfo();
            }
        });
        lastSentDate = new Date();
    };
    setInterval(() => {
        checkForEventsAndSend();
    }, 1000 * 60 * 60 * 24); //every day
    // dont wait a day if we start the server
    checkForEventsAndSend();
});

exports.barAdded = (bar) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const barDate = new Date(bar.start);
    barDate.setHours(0, 0, 0, 0);
    let dayDiff = (barDate - today) / 1000 / 60 / 60 / 24;
    // when last send Day was today, wo should send messages
    const day = new Date(lastSentDate);
    day.setHours(0, 0, 0, 0);
    console.log(sendDaysBefore.reduce((l, r) => Math.max(l, r)));
    console.log(dayDiff);
    if ((day === today || !sendDaysBefore.some(d => d === dayDiff)) && dayDiff <= sendDaysBefore.reduce((l, r) => Math.max(l, r))) {
        sendBarInfo(bar);
    }
}

exports.sendMessage = (user, message) => {
    bot.sendMessage(user.telegramID, message, { parse_mode: "Markdown", disable_web_page_preview: true }).catch(error => console.error("Error while sending telegram message: ", error));
};