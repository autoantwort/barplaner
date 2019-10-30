const db = require('../config/db.config.js');
const env = require('../config/env');
const CronJob = require('cron').CronJob;


const Bar = db.Bar;
const User = db.User;
const UserRoles = db.UserRoles;
const BarDuty = db.BarDuty;
const Role = db.Role;
const Setting = db.Setting;
const Op = db.Sequelize.Op;
const ShouldDelete = db.ShouldDelete;



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

function login(msg, pin) {
    User.findOne({
        where: {
            telegramID: "login pin: " + pin.trim()
        }
    }).then(user => {
        if (user === null) {
            bot.sendMessage(msg.chat.id, "Der Pin ist leider falsch. Es existiert kein Nutzer mit diesem Login-Pin.");
        } else {
            user.update({
                telegramID: msg.chat.id,
            }).then(() => {
                bot.sendMessage(msg.chat.id, "Du hast dich erfolgreich eingeloggt! Hier wirst du über anstehende Bars informiert und ob du z.B. putzen musst.");
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
}

// Matches /login
bot.onText(/\/login/, msg => {
    if (msg.text.substr(6).trim().length === 0) {
        bot.sendMessage(msg.chat.id, "Du hast den Pin vergessen!");
        return;
    }
    login(msg, msg.text.substr(6));
});

bot.onText(/\/start/, msg => {
    bot.sendMessage(msg.chat.id, "Hallo " + msg.from.first_name + ", gehe auf [Account](" + env.baseURL + "/#/account) und logge dich mittels /login <pin> ein.", { parse_mode: "Markdown" });
});

bot.on('text', message => {
    // check if the message only contains a number
    if (!isNaN(message.text)) {
        // it is maybe a login pin
        login(message, message.text);
    } else {
        bot.sendMessage(message.chat.id, "Dieser Nachricht konnte kein Befehl zugeordnet werden. Sie wurde deswegen ignoriert.", { reply_to_message_id: message.message_id });
    }
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
                    message += "putzen.";
                } else {
                    message += "Du musst dieses Mal nicht putzen.";
                }

                bot.sendMessage(d.user.telegramID, message).then(() => {
                    const msg = addBarMessageCreator.createMessage(d.user, "Kommst du?");
                    msg.addData('bar', bar.id);
                    msg.addButtonToRow("Ich komme", 'state', 'present');
                    msg.addButtonToRow("Ich komme nicht", 'state', 'absent');
                    msg.sendMessage(bar.start).catch(console.error);
                });
            });
            resolve();
        }).catch(reject);
    });
}

// Handle callback queries
bot.on('callback_query', function onCallbackQuery(callbackQuery) {
    const callbackDataToObject = (string) => {
        const array = JSON.parse(string);
        const obj = {
            chatId: array[0],
            userId: array[1],
            systemId: array[2],
            state: array[3],
            data: array[4],
        }
        for (let i = 5; i < array.length; i += 2) {
            obj[array[i]] = array[i + 1]
        }
        return obj;
    }
    const data = callbackDataToObject(callbackQuery.data);
    const callback = registeredResponseSystems[data.systemId];
    if (callback !== undefined) {
        data.messageId = callbackQuery.message.message_id;
        callback(data);
    }
});

const registeredResponseSystems = {};
exports.registerResponseSystem = (systemId, responseCallback) => {
    if (registeredResponseSystems['systemId'] !== undefined) {
        throw new Error("A response system with id " + systemId + " is already registered.");
    }
    const callbackDataToString = (chatId, userId, systemId, state, data, additionalData) => {
        const array = JSON.stringify([chatId, userId, systemId, state, data].concat(additionalData));
        if (array > 64) {
            console.error("callback_data is to long : " + array + " length : " + array.length);
            throw new Error("callback_data is to long : " + array + " length : " + array.length);
        }
        return array;
    }
    const button = (chatId, userId, systemId, state, text, data, additionalData) => {
        const callbackData = callbackDataToString(chatId, userId, systemId, state, data === undefined ? text : data, additionalData);
        return {
            text: text,
            callback_data: callbackData,
        };
    };
    const messageCreator = {
        createMessage: (user, text) => {
            if (user.telegramID.indexOf("login") !== -1) {
                throw new Error("The user has no telegramID!");
            }
            return {
                text: text,
                buttons: [
                    []
                ],
                _additionalData: [],
                addData: function(key, value) {
                    this._additionalData.push(key);
                    this._additionalData.push(value);
                },
                addButtonToRow: function(text, newState, data) {
                    this.buttons[this.buttons.length - 1].push(button(user.telegramID, user.id, systemId, newState, text, data, this._additionalData));
                },
                newRow: function() {
                    this.buttons.push([]);
                },
                sendMessage: async function(deleteAfter, textAfterDelete) {
                    const message = await bot.sendMessage(user.telegramID, this.text, {
                        reply_markup: {
                            inline_keyboard: this.buttons,
                        }
                    });
                    if (deleteAfter !== undefined) {
                        exports.deleteTelegramMessage(user.telegramID, message.message_id, deleteAfter, textAfterDelete);
                    }
                },
            };
        }
    };
    registeredResponseSystems[systemId] = (data) => {
        const message = {
            ...data,
            newText: null,
            buttons: [
                []
            ],
            _additionalData: [],
            addData: function(key, value) {
                this._additionalData.push(key);
                this._additionalData.push(value);
            },
            addButtonToRow: function(text, newState, data) {
                this.buttons[this.buttons.length - 1].push(button(this.chatId, this.userId, systemId, newState, text, data, this._additionalData));
            },
            newRow: function() {
                this.buttons.push([]);
            },
            sendUpdatedMessage: function() {
                if (this.newText === null && this.buttons[0].length === 0) {
                    // There is nothing to update
                    return;
                }
                if (this.newText === null) {
                    return bot.editMessageReplyMarkup({ inline_keyboard: this.buttons }, {
                        chat_id: this.chatId,
                        message_id: this.messageId,
                    });
                } else {
                    return bot.editMessageText(this.newText, {
                        chat_id: this.chatId,
                        message_id: this.messageId,
                        reply_markup: { inline_keyboard: this.buttons },
                    });
                }
            },
            sendNewMessage: async function(deleteAfter, textAfterDelete) {
                const message = await bot.sendMessage(chatId, newText, {
                    reply_markup: {
                        inline_keyboard: buttons,
                    }
                });
                if (deleteAfter !== undefined) {
                    exports.deleteTelegramMessage(chatId, message.message_id, deleteAfter, textAfterDelete);
                }
            },
        }
        responseCallback(message);
    }
    return messageCreator;
}

// handle responses to the bar
const addBarMessageCreator = exports.registerResponseSystem("addBar", (message) => {
    let whereObj = {
        where: {
            barID: message.bar,
            userID: message.userId,
        }
    };
    message.addData('bar', message.bar);
    if (message.state === "state") {
        BarDuty.update({
            state: message.data
        }, whereObj).then(() => {
            if (message.data === "present") {
                message.newText = "Welche Theke machst du?";
                message.addButtonToRow('Biertheke', 'job', 'Biertheke');
                message.addButtonToRow('Cocktailtheke', 'job', 'Cocktailtheke');
                message.sendUpdatedMessage();
            } else {
                message.newText = "Schade!";
                message.addButtonToRow("Ich komme doch!", 'state', 'present');
                message.sendUpdatedMessage();
            }
        });
    } else if (message.state === "job") {
        BarDuty.update({
            job: message.data
        }, whereObj).then(() => {
            message.newText = "Wann fängst du an?";
            for (let i = 20; i < 26; ++i) {
                message.addButtonToRow(((i % 24) < 10 ? '0' : '') + (i % 24) + ":00", 'from');
                message.addButtonToRow(((i % 24) < 10 ? '0' : '') + (i % 24) + ":30", 'from');
                message.newRow();
            }
            message.sendUpdatedMessage();
        });
    } else if (message.state === "from") {
        BarDuty.update({
            from: message.data
        }, whereObj).then(() => {
            message.newText = "Bis wann bleibst du?";
            for (let i = 22; i < 24 + 7; ++i) {
                message.addButtonToRow(((i % 24) < 10 ? '0' : '') + (i % 24) + ":00", 'to');
                message.addButtonToRow(((i % 24) < 10 ? '0' : '') + (i % 24) + ":30", 'to');
                message.newRow();
            }
            message.sendUpdatedMessage();
        });
    } else if (message.state === "to") {
        BarDuty.update({
            to: message.data
        }, whereObj).then(() => {
            message.newText = "Schön, dass du kommst!";
            message.addButtonToRow("Angaben ändern", 'state', 'present');
            message.addButtonToRow("Ich kann doch nicht", 'state', 'absent');
            message.sendUpdatedMessage();
        });
    }
});


let lastSentDate;
let sendDaysBefore = [10, 7, 5, 3, 2, 1, 0];
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
    // every day at 3 pm
    const issueCronJob = new CronJob('00 00 15 * * *', function() {
        checkForEventsAndSend();
    }, null, true);
});

exports.barAdded = (bar) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const barDate = new Date(bar.start);
    barDate.setHours(0, 0, 0, 0);
    let dayDiff = (barDate - today) / 1000 / 60 / 60 / 24;
    if (sendDaysBefore.some(d => d === dayDiff)) {
        sendBarInfo(bar).catch(console.error);
    }
}

exports.changeCleaningStatus = (barId, userId, newHaveToCleanState) => {
    Bar.findByPk(barId).then(bar => {
        const end = bar.start.setHours(bar.start.getHours() + 12);
        // bar is to old
        if (new Date() > end) {
            return;
        }
        // do not change the original date
        const start = new Date(bar.start);
        start.setDate(start.getDate() - sendDaysBefore.reduce((l, r) => Math.max(l, r)));
        // bar is to new
        if (start > new Date()) {
            return;
        }
        const startText = "Du musst bei der " + bar.name + " am " + bar.start.getDate() + '.' + (bar.start.getMonth() + 1) + '.' + bar.start.getFullYear();
        if (!newHaveToCleanState) {
            User.findByPk(userId).then(user => {
                this.sendMessage(user, startText + " doch nicht mehr putzen.");
            }).catch(console.error);
        }
        BarDuty.findAll({
            where: {
                barID: barId,
                have_to_clean: true,
            },
            include: [{
                model: User,
                attributes: ['id', 'name', 'telegramID'],
            }],
        }).then(duties => {
            if (duties.length === 1) {
                this.sendMessage(duties[0].user, startText + " aktuell alleine putzen.");
            } else {
                for (let i = 0; i < duties.length; ++i) {
                    let message = startText + " nun mit ";
                    let count = duties.length;
                    for (let ii = 0; ii < duties.length; ++ii) {
                        --count;
                        if (ii !== i) {
                            message += duties[ii].user.name;
                            if (count === 0) {
                                message += " ";
                            } else if (count === 1) {
                                message += " und ";
                            } else {
                                message += ", ";
                            }
                        }
                    }
                    message += "putzen.";
                    this.sendMessage(duties[i].user, message);
                }
            }
        }).catch(console.error);
    }).catch(console.error);
}

exports.sendMessage = (user, message, deleteAfter, afterDeleteText) => {
    if (user.telegramID.indexOf('login') === -1) {
        bot.sendMessage(user.telegramID, message, { parse_mode: "Markdown", disable_web_page_preview: true }).then(message => {
            if (deleteAfter instanceof Date) {
                exports.deleteTelegramMessage(user.telegramID, message.message_id, deleteAfter, afterDeleteText);
            } else if (deleteAfter !== null && deleteAfter !== undefined) {
                console.error(deleteAfter + " is not a date at Telegram.sendMessage(...)");
            }
        }).catch(error => console.error("Error while sending telegram message: ", error));
        return true;
    } else {
        return false;
    }
};

exports.bot = bot;

//////////////////////////////////////////////////////
///////////////// Delete Messages ////////////////////
//////////////////////////////////////////////////////

const runMessageDeletion = () => {
    const query = {
        where: {
            deleteAfter: {
                [Op.lte]: new Date()
            }
        }
    }
    ShouldDelete.findAll(query).then(messages => {
        messages.forEach(message => {
            const should_delete = message.newText === null && (Date.now() - message.createdAt < 1000 * 60 * 60 * 48);
            if (should_delete) {
                bot.deleteMessage(message.chatID, message.messageID).catch(console.error);
            } else {
                const newText = message.newText === null ? "Deleted" : message.newText;
                bot.editMessageText(newText, { chat_id: message.chatID, message_id: message.messageID }).catch(console.error);
            }
        });
        ShouldDelete.destroy(query).catch(console.error);
        computeNewNextTimeout();
    }).catch(console.error);
}

let deleteTimeout = null;
let nextDeleteExecution = null;

const computeNewNextTimeout = () => {
    ShouldDelete.findOne({ order: db.Sequelize.col('deleteAfter') }).then(message => {
        if (message !== null) {
            nextDeleteExecution = message.deleteAfter;
            //deleteTimeout = setTimeout(runMessageDeletion, nextDeleteExecution - Date.now());
        } else {
            nextDeleteExecution = null;
            deleteTimeout = null;
        }
    }).catch(console.error);
}

db.addSyncCallback(() => {
    computeNewNextTimeout();
});

exports.deleteTelegramMessage = (chatID, messageID, deleteAfter, newText) => {
    if (deleteAfter === undefined) {
        throw new Error("Minimum 3 arguments are required!");
    }
    if (typeof newText !== "string") {
        newText = null;
    }
    ShouldDelete.create({ chatID: chatID, messageID: messageID, deleteAfter: deleteAfter }).catch(console.error);
    if (nextDeleteExecution === null || nextDeleteExecution > deleteAfter) {
        if (deleteTimeout !== null) {
            clearTimeout(deleteTimeout);
        }
        nextDeleteExecution = deleteAfter;
        deleteTimeout = setTimeout(runMessageDeletion, nextDeleteExecution - Date.now());
    }
}