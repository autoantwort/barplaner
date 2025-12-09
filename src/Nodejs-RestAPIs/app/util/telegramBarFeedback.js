import db from '../config/db.config.js';
import { CronTime, CronJob } from 'cron';
import { bot, registerResponseSystem } from './telegram';
import { Bar } from '../model/bar.model.js';
import { Barduty } from '../model/barduty.model.js';
import { Setting } from '../model/setting.model.js';
import { Role } from '../model/role.model.js';
import { Op } from 'sequelize';
import { User } from '../model/user.model.js';
const SettingsController = import('../controller/setting.controller');

let SendDaysBefore = null;
let SendAt = null;

const updateSendAtTime = value => {
    sendCronJob.setTime(new CronTime("0 " + value.substring(3, 5) + " " + value.substring(0, 2) + " * * *", "Europe/Berlin"));
    sendCronJob.start();
};

db.addSyncCallback(() => {
    // after 5 seconds the BarAdmin role should be created if the role does not exists
    setTimeout(() => { }, 5000);
    Role.findByPk('BarAdmin').then(role => {
        Setting.findCreateFind({
            where: { name: "telegramBarFeedbackDaysBefore" },
            defaults: {
                name: "telegramBarFeedbackDaysBefore",
                permission: role.name,
                description: "On wich days before the bar the users should get a message where they can say weather they will come. Regex format is: (\d+ *, *)*\d+",
                value: "10, 7, 5, 3, 2, 1, 0",
            }
        }).then(s => {
            SendDaysBefore = s[0];
        }).catch(console.error);
        Setting.findCreateFind({
            where: { name: "telegramBarFeedbackSendAt" },
            defaults: {
                name: "telegramBarFeedbackSendAt",
                permission: role.name,
                description: "When should the messages be sent? Format is: hh:mm   e.g. 08:45",
                value: "15:00",
            }
        }).then(s => {
            SendAt = s[0];
            updateSendAtTime(SendAt.value);
        }).catch(console.error);
    }).catch(console.error);
});

SettingsController.then(controller => controller.addSettingChangeListener("telegramBarFeedbackSendAt", updateSendAtTime));

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

function sendBarInfo(bar, userID) {
    return new Promise((resolve, reject) => {
        let userWhere = {};
        if (userID !== undefined) {
            userWhere.userID = userID;
        }
        Barduty.findAll({
            where: {
                ...userWhere,
                barID: bar.id,
            },
            include: [{
                model: User,
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
                    message += "putzen.\nFalls du nicht putzen kannst, suche dir bitte selbstständig Ersatz. Dies gilt auch wenn du angibst dass du nicht zur Bar kommst.\n";
                } else {
                    message += "Du musst dieses Mal nicht putzen.";
                }

                bot.sendMessage(d.user.telegramID, message).then(() => {
                    const msg = addBarMessageCreator.createMessage(d.user, "Kommst du?");
                    msg.addData('bar', bar.id);
                    msg.addButtonToRow("Ich komme", 'state', 'present');
                    msg.addButtonToRow("Ich komme nicht", 'state', 'absent');
                    msg.sendMessage(bar.start).catch(console.error);
                }).catch((e) => {
                    console.error(d.user.name, JSON.stringify(e), e.response.body);
                    if (e.response.body.error_code === 403) {
                        d.user.update({
                            telegramID: "login pin: " + (Math.random() * 1000000).toFixed(0),
                        }).catch(console.error);
                    }
                });
            });
            resolve();
        }).catch(reject);
    });
}

export { sendBarInfo };

// handle responses to the bar
const addBarMessageCreator = registerResponseSystem("addBar", (message) => {
    let whereObj = {
        where: {
            barID: message.bar,
            userID: message.userId,
        }
    };
    message.addData('bar', message.bar);
    if (message.state === "state") {
        Barduty.update({
            state: message.data
        }, whereObj).then(() => {
            if (message.data === "present") {
                message.newText = "Welche Theke machst du?";
                message.addButtonToRow('Biertheke', 'job', 'Biertheke');
                message.addButtonToRow('Cocktailtheke', 'job', 'Cocktailtheke');
                message.addButtonToRow('mal schauen', 'job', '');
                message.sendUpdatedMessage();
            } else {
                message.newText = "Schade!";
                message.addButtonToRow("Ich komme doch!", 'state', 'present');
                message.sendUpdatedMessage();
            }
        });
    } else if (message.state === "job") {
        Barduty.update({
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
        Barduty.update({
            from: message.data
        }, whereObj).then(() => {
            message.newText = "Bis wann bleibst du?";
            for (let i = 22; i < 24 + 7; ++i) {
                message.addButtonToRow(((i % 24) < 10 ? '0' : '') + (i % 24) + ":00", 'to');
                message.addButtonToRow(((i % 24) < 10 ? '0' : '') + (i % 24) + ":30", 'to');
                message.newRow();
            }
            message.addButtonToRow("Ende", 'to');
            message.sendUpdatedMessage();
        });
    } else if (message.state === "to") {
        Barduty.update({
            to: message.data
        }, whereObj).then(() => {
            message.newText = "Schön, dass du kommst!";
            message.addButtonToRow("Angaben ändern", 'state', 'present');
            message.addButtonToRow("Ich kann doch nicht", 'state', 'absent');
            message.sendUpdatedMessage();
        });
    }
});


const defaultSendDaysBefore = [10, 7, 5, 3, 2, 1, 0];

const checkForEventsAndSend = sendDaysBefore => {
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
            let dayDiff = Math.ceil((barDate - now) / 1000 / 60 / 60 / 24);
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
};

const getSendDaysBefore = async () => {
    if (SendDaysBefore === null) {
        return defaultSendDaysBefore;
    }
    await SendDaysBefore.reload();
    try {
        return JSON.parse('[' + SendDaysBefore.value + ']');
    } catch (e) {
        console.error("The value of the setting telegramBarFeedbackDaysBefore has the wrong format: ", SendDaysBefore.value);
        return defaultSendDaysBefore;
    }
}

// every day at 3 pm
const sendCronJob = new CronJob('00 00 15 * * *', async () => checkForEventsAndSend(await getSendDaysBefore()), null, true, "Europe/Berlin");

export function barAdded(bar) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const barDate = new Date(bar.start);
    barDate.setHours(0, 0, 0, 0);
    let dayDiff = (barDate - today) / 1000 / 60 / 60 / 24;
    getSendDaysBefore().then(daysBefore => {
        if (daysBefore.some(d => d === dayDiff)) {
            sendBarInfo(bar).catch(console.error);
        }
    });
}

export function changeCleaningStatus(barId, userId, newHaveToCleanState) {
    Bar.findByPk(barId).then(bar => {
        const end = bar.start.setHours(bar.start.getHours() + 12);
        // bar is to old
        if (new Date() > end) {
            return;
        }
        // do not change the original date
        const start = new Date(bar.start);
        start.setDate(start.getDate() - SendDaysBefore.reduce((l, r) => Math.max(l, r)));
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
        Barduty.findAll({
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
