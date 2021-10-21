const db = require('../config/db.config.js');
const env = require('../config/env');

const User = db.User;
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

bot.onText(/\/start/, msg => {
    bot.sendMessage(msg.chat.id, "Hallo " + msg.from.first_name + ", gehe auf [Account](" + env.baseURL + "/#/account) und logge dich mittels /login <pin> ein.", { parse_mode: "Markdown" });
});

bot.on('text', message => {
    // check if the message only contains a number
    if (!isNaN(message.text)) {
        // it is maybe a login pin
        login(message, message.text);
    } else {
        if (message.chat.type === "private" && !/\/(files?|datei(en)?|pdfs?|git|gitlab|newsletter|login|start)/.test(message.text)) {
            bot.sendMessage(message.chat.id, "Dieser Nachricht konnte kein Befehl zugeordnet werden. Sie wurde deswegen ignoriert.", { reply_to_message_id: message.message_id });
        }
    }
});

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
        };
        for (let i = 5; i < array.length; i += 2) {
            obj[array[i]] = array[i + 1];
        }
        return obj;
    };
    const data = callbackDataToObject(callbackQuery.data);
    const callback = registeredResponseSystems[data.systemId];
    if (callback !== undefined) {
        data.messageId = callbackQuery.message.message_id;
        callback(data);
    }
});


const registeredResponseSystems = {};

exports.registerResponseSystem = (systemId, responseCallback) => {
    if (registeredResponseSystems[systemId] !== undefined) {
        throw new Error("A response system with id " + systemId + " is already registered.");
    }
    const callbackDataToString = (chatId, userId, systemId, state, data, additionalData) => {
        const array = JSON.stringify([chatId, userId, systemId, state, data].concat(additionalData));
        if (array > 64) {
            console.error("callback_data is to long : " + array + " length : " + array.length);
            throw new Error("callback_data is to long : " + array + " length : " + array.length);
        }
        return array;
    };
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

exports.sendMessage = (user, message, deleteAfter, afterDeleteText) => {
    if (user.telegramID.indexOf('login') === -1) {
        let startIndex = 0;
        let messages = [];
        // we have to split the message if the message have more than 4096 'visible' chars.
        // E.g. The markdown string "[test](www.google.com)" results in a length of 4, but for simplicity we ignore this circumstance.
        while (startIndex < message.length) {
            let currentMsg = "";
            if (message.length - startIndex < 4096) {
                currentMsg = message.substring(startIndex);
                startIndex = message.length;
            } else {
                // break message at new line
                let lastIndex = message.lastIndexOf('\n', startIndex + 4096);
                // if new message is 'too short' or no new line found
                if (lastIndex - startIndex < 2500) {
                    // break message at space
                    lastIndex = message.lastIndexOf(' ', startIndex + 4096);
                }
                // if new message is 'too short' or no space found
                if (lastIndex - startIndex < 2500) {
                    // make the message as long as possible and break words or links
                    lastIndex = startIndex + 4096;
                }
                currentMsg = message.substring(startIndex, lastIndex);
                startIndex = lastIndex;
            }
            messages.push(currentMsg);
        }
        const sendMessage = () => {
            if (messages.length > 0) {
                bot.sendMessage(user.telegramID, messages.shift(), { parse_mode: "Markdown", disable_web_page_preview: true }).then(message => {
                    sendMessage();
                    if (deleteAfter instanceof Date) {
                        exports.deleteTelegramMessage(user.telegramID, message.message_id, deleteAfter, afterDeleteText);
                    } else if (deleteAfter !== null && deleteAfter !== undefined) {
                        console.error(deleteAfter + " is not a date at Telegram.sendMessage(...)");
                    }
                }).catch(error => console.error("Error while sending telegram message: ", error));
            }
        }
        sendMessage();
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