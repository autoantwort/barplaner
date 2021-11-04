import db from "../config/db.config.js";
import * as seq from "sequelize";

const Op = seq.Op;
const col = seq.col;

import * as TelegramBot from "node-telegram-bot-api";
import * as SettingsController from "../controller/setting.controller.js";
import Bar from "../model/bar.model.js";
import Role from "../model/role.model.js";

import env from "../config/env.js";

import * as cron from "cron";

const User = db.User;
const BarDuty = db.BarDuty;
const Setting = db.Setting;
const ShouldDelete = db.ShouldDelete;

const TOKEN = env.telegramAccessToken;
const options = {
  polling: {
    autoStart:
      typeof env.telegramAccessToken === "string" &&
      env.telegramAccessToken.length > 0,
  },
};

export const bot = new TelegramBot(TOKEN, options);

console.log("## start bot, polling : ", bot.isPolling());

bot.on("polling_error", (error) => {
  console.log(error);
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Hallo " +
      msg.from.first_name +
      ", gehe auf [Account](" +
      env.baseURL +
      "/#/account) und logge dich mittels /login <pin> ein.",
    { parse_mode: "Markdown" }
  );
});

bot.on("text", (message) => {
  // check if the message only contains a number
  if (Number(message.text) != NaN) {
    // it is maybe a login pin
    login(message, message.text);
  } else {
    if (
      message.chat.type === "private" &&
      !/\/(files?|datei(en)?|pdfs?|git|gitlab|newsletter|login|start)/.test(
        message.text
      )
    ) {
      bot.sendMessage(
        message.chat.id,
        "Dieser Nachricht konnte kein Befehl zugeordnet werden. Sie wurde deswegen ignoriert.",
        { reply_to_message_id: message.message_id }
      );
    }
  }
});

// Handle callback queries
bot.on("callback_query", function onCallbackQuery(callbackQuery) {
  const callbackDataToObject = (string): any => {
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

export const registerResponseSystem = (systemId, responseCallback) => {
  if (registeredResponseSystems[systemId] !== undefined) {
    throw new Error(
      "A response system with id " + systemId + " is already registered."
    );
  }
  const callbackDataToString = (
    chatId,
    userId,
    systemId,
    state,
    data,
    additionalData
  ) => {
    const array = JSON.stringify(
      [chatId, userId, systemId, state, data].concat(additionalData)
    );
    if (array.length > 64) {
      console.error(
        "callback_data is to long : " + array + " length : " + array.length
      );
      throw new Error(
        "callback_data is to long : " + array + " length : " + array.length
      );
    }

    return array;
  };
  const button = (
    chatId,
    userId,
    systemId,
    state,
    text,
    data,
    additionalData
  ) => {
    const callbackData = callbackDataToString(
      chatId,
      userId,
      systemId,
      state,
      data === undefined ? text : data,
      additionalData
    );
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
        buttons: [[]],
        _additionalData: [],
        addData: function (key, value) {
          this._additionalData.push(key);
          this._additionalData.push(value);
        },
        addButtonToRow: function (text, newState, data) {
          this.buttons[this.buttons.length - 1].push(
            button(
              user.telegramID,
              user.id,
              systemId,
              newState,
              text,
              data,
              this._additionalData
            )
          );
        },
        newRow: function () {
          this.buttons.push([]);
        },
        sendMessage: async function (deleteAfter?, textAfterDelete?: string) {
          const message = await bot.sendMessage(user.telegramID, this.text, {
            reply_markup: {
              inline_keyboard: this.buttons,
            },
          });
          if (deleteAfter !== undefined) {
            deleteTelegramMessage(
              user.telegramID,
              message.message_id,
              deleteAfter,
              textAfterDelete
            );
          }
        },
      };
    },
  };
  registeredResponseSystems[systemId] = (data) => {
    const message = {
      ...data,
      newText: null,
      buttons: [[]],
      _additionalData: [],
      addData: function (key, value) {
        this._additionalData.push(key);
        this._additionalData.push(value);
      },
      addButtonToRow: function (text, newState, data) {
        this.buttons[this.buttons.length - 1].push(
          button(
            this.chatId,
            this.userId,
            systemId,
            newState,
            text,
            data,
            this._additionalData
          )
        );
      },
      newRow: function () {
        this.buttons.push([]);
      },
      sendUpdatedMessage: function () {
        if (this.newText === null && this.buttons[0].length === 0) {
          // There is nothing to update
          return;
        }
        if (this.newText === null) {
          return bot.editMessageReplyMarkup(
            { inline_keyboard: this.buttons },
            {
              chat_id: this.chatId,
              message_id: this.messageId,
            }
          );
        } else {
          return bot.editMessageText(this.newText, {
            chat_id: this.chatId,
            message_id: this.messageId,
            reply_markup: { inline_keyboard: this.buttons },
          });
        }
      },
      sendNewMessage: async function (deleteAfter, textAfterDelete?: string) {
        const message = await bot.sendMessage(this.chatId, this.newText, {
          reply_markup: {
            inline_keyboard: this.buttons,
          },
        });
        if (deleteAfter !== undefined) {
          deleteTelegramMessage(
            this.chatId,
            message.message_id,
            deleteAfter,
            textAfterDelete
          );
        }
      },
    };
    responseCallback(message);
  };
  return messageCreator;
};

export const sendMessage = (
  user,
  message,
  deleteAfter?: any,
  afterDeleteText?: string
) => {
  if (user.telegramID.indexOf("login") === -1) {
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
        let lastIndex = message.lastIndexOf("\n", startIndex + 4096);
        // if new message is 'too short' or no new line found
        if (lastIndex - startIndex < 2500) {
          // break message at space
          lastIndex = message.lastIndexOf(" ", startIndex + 4096);
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
        bot
          .sendMessage(user.telegramID, messages.shift(), {
            parse_mode: "Markdown",
            disable_web_page_preview: true,
          })
          .then((message) => {
            sendMessage();
            if (deleteAfter instanceof Date) {
              exports.deleteTelegramMessage(
                user.telegramID,
                message.message_id,
                deleteAfter,
                afterDeleteText
              );
            } else if (deleteAfter !== null && deleteAfter !== undefined) {
              console.error(
                deleteAfter + " is not a date at Telegram.sendMessage(...)"
              );
            }
          })
          .catch((error) =>
            console.error("Error while sending telegram message: ", error)
          );
      }
    };
    sendMessage();
    return true;
  } else {
    return false;
  }
};

//////////////////////////////////////////////////////
///////////////// Delete Messages ////////////////////
//////////////////////////////////////////////////////

const runMessageDeletion = () => {
  const query = {
    where: {
      deleteAfter: {
        [Op.lte]: new Date(),
      },
    },
  };
  ShouldDelete.findAll(query)
    .then((messages) => {
      messages.forEach((message) => {
        const should_delete =
          message.newText === null &&
          Date.now() - message.createdAt < 1000 * 60 * 60 * 48;
        if (should_delete) {
          bot
            .deleteMessage(message.chatID, message.messageID)
            .catch(console.error);
        } else {
          const newText =
            message.newText === null ? "Deleted" : message.newText;
          bot
            .editMessageText(newText, {
              chat_id: message.chatID,
              message_id: message.messageID,
            })
            .catch(console.error);
        }
      });
      ShouldDelete.destroy(query).catch(console.error);
      computeNewNextTimeout();
    })
    .catch(console.error);
};

let deleteTimeout = null;
let nextDeleteExecution = null;

const computeNewNextTimeout = () => {
  ShouldDelete.findOne({ order: col("deleteAfter") })
    .then((message) => {
      if (message !== null) {
        nextDeleteExecution = message.deleteAfter;
        //deleteTimeout = setTimeout(runMessageDeletion, nextDeleteExecution - Date.now());
      } else {
        nextDeleteExecution = null;
        deleteTimeout = null;
      }
    })
    .catch(console.error);
};

db.addSyncCallback(() => {
  computeNewNextTimeout();
});

export const deleteTelegramMessage = (
  chatID,
  messageID,
  deleteAfter,
  newText?
) => {
  if (deleteAfter === undefined) {
    throw new Error("Minimum 3 arguments are required!");
  }

  if (typeof newText !== "string") {
    newText = null;
  }

  ShouldDelete.create({
    chatID: chatID,
    messageID: messageID,
    deleteAfter: deleteAfter,
  }).catch(console.error);

  if (nextDeleteExecution === null || nextDeleteExecution > deleteAfter) {
    if (deleteTimeout !== null) {
      clearTimeout(deleteTimeout);
    }
    nextDeleteExecution = deleteAfter;
    deleteTimeout = setTimeout(
      runMessageDeletion,
      nextDeleteExecution - Date.now()
    );
  }
};

let SendDaysBefore = null;
let SendAt = null;

const updateSendAtTime = (value) => {
  sendCronJob.setTime(
    new cron.CronTime(
      "0 " + value.substring(3, 5) + " " + value.substring(0, 2) + " * * *",
      "Europe/Berlin"
    )
  );
  sendCronJob.start();
};

db.addSyncCallback(() => {
  // after 5 seconds the BarAdmin role should be created if the role does not exists
  setTimeout(() => {}, 5000);
  Role.findByPk("BarAdmin")
    .then((role) => {
      Setting.findCreateFind({
        where: { name: "telegramBarFeedbackDaysBefore" },
        defaults: {
          name: "telegramBarFeedbackDaysBefore",
          permission: role.name,
          description:
            "On wich days before the bar the users should get a message where they can say weather they will come. Regex format is: (d+ *, *)*d+",
          value: "10, 7, 5, 3, 2, 1, 0",
        },
      })
        .then((s) => {
          SendDaysBefore = s[0];
        })
        .catch(console.error);
      Setting.findCreateFind({
        where: { name: "telegramBarFeedbackSendAt" },
        defaults: {
          name: "telegramBarFeedbackSendAt",
          permission: role.name,
          description:
            "When should the messages be sent? Format is: hh:mm   e.g. 08:45",
          value: "15:00",
        },
      })
        .then((s) => {
          SendAt = s[0];
          updateSendAtTime(SendAt.value);
        })
        .catch(console.error);
    })
    .catch(console.error);
});

SettingsController.addSettingChangeListener(
  "telegramBarFeedbackSendAt",
  updateSendAtTime
);

export function login(msg, pin) {
  User.findOne({
    where: {
      telegramID: "login pin: " + pin.trim(),
    },
  }).then((user) => {
    if (user === null) {
      bot.sendMessage(
        msg.chat.id,
        "Der Pin ist leider falsch. Es existiert kein Nutzer mit diesem Login-Pin."
      );
    } else {
      user
        .update({
          telegramID: msg.chat.id,
        })
        .then(() => {
          bot.sendMessage(
            msg.chat.id,
            "Du hast dich erfolgreich eingeloggt! Hier wirst du über anstehende Bars informiert und ob du z.B. putzen musst."
          );
        })
        .catch((err) => {
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
              [Op.lt]: daysAhead,
            },
          },
        },
      })
        .then((bars) => {
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
                .catch(console.error);
            };
            sendInfo();
          }
        })
        .catch(console.error);
    }
  });
}

// Matches /login
bot.onText(/\/login/, (msg) => {
  if (msg.text.substr(6).trim().length === 0) {
    bot.sendMessage(msg.chat.id, "Du hast den Pin vergessen!");
    return;
  }
  login(msg, msg.text.substr(6));
});

function sendBarInfo(bar, userID?): Promise<void> {
  return new Promise((resolve, reject) => {
    let userWhere: any = {};
    if (userID !== undefined) {
      userWhere.userID = userID;
    }
    BarDuty.findAll({
      where: {
        ...userWhere,
        barID: bar.id,
      },
      include: [
        {
          model: User,
        },
      ],
    })
      .then((duties) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const barDate = new Date(bar.start);
        barDate.setHours(0, 0, 0, 0);
        let dayDiff =
          (now.getMilliseconds() - barDate.getMilliseconds()) /
          1000 /
          60 /
          60 /
          24;
        if (dayDiff === 0) {
          var dayText = "heute";
        } else if (dayDiff === 1) {
          var dayText = "morgen";
        } else if (dayDiff === 2) {
          var dayText = "übermorgen";
        } else {
          var dayText =
            "am " +
            bar.start.getDate() +
            "." +
            (bar.start.getMonth() + 1) +
            "." +
            bar.start.getFullYear();
        }
        duties
          .filter(
            (d) =>
              d.user.telegramID.indexOf("login") === -1 && d.state === "no_info"
          )
          .forEach((d) => {
            let message =
              "Hallo " +
              d.user.name +
              ",\n" +
              dayText +
              " ist " +
              bar.name +
              "!\n";
            if (d.have_to_clean) {
              let haveToClean = [];
              duties
                .filter(
                  (duty) => duty.user.name !== d.user.name && duty.have_to_clean
                )
                .forEach((duty) => haveToClean.push(duty.user.name));
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
              const msg = addBarMessageCreator.createMessage(
                d.user,
                "Kommst du?"
              );
              msg.addData("bar", bar.id);
              msg.addButtonToRow("Ich komme", "state", "present");
              msg.addButtonToRow("Ich komme nicht", "state", "absent");
              msg.sendMessage(bar.start).catch(console.error);
            });
          });
        resolve();
      })
      .catch(reject);
  });
}

// handle responses to the bar
const addBarMessageCreator = registerResponseSystem("addBar", (message) => {
  let whereObj = {
    where: {
      barID: message.bar,
      userID: message.userId,
    },
  };
  message.addData("bar", message.bar);
  if (message.state === "state") {
    BarDuty.update(
      {
        state: message.data,
      },
      whereObj
    ).then(() => {
      if (message.data === "present") {
        message.newText = "Welche Theke machst du?";
        message.addButtonToRow("Biertheke", "job", "Biertheke");
        message.addButtonToRow("Cocktailtheke", "job", "Cocktailtheke");
        message.sendUpdatedMessage();
      } else {
        message.newText = "Schade!";
        message.addButtonToRow("Ich komme doch!", "state", "present");
        message.sendUpdatedMessage();
      }
    });
  } else if (message.state === "job") {
    BarDuty.update(
      {
        job: message.data,
      },
      whereObj
    ).then(() => {
      message.newText = "Wann fängst du an?";
      for (let i = 20; i < 26; ++i) {
        message.addButtonToRow(
          (i % 24 < 10 ? "0" : "") + (i % 24) + ":00",
          "from"
        );
        message.addButtonToRow(
          (i % 24 < 10 ? "0" : "") + (i % 24) + ":30",
          "from"
        );
        message.newRow();
      }
      message.sendUpdatedMessage();
    });
  } else if (message.state === "from") {
    BarDuty.update(
      {
        from: message.data,
      },
      whereObj
    ).then(() => {
      message.newText = "Bis wann bleibst du?";
      for (let i = 22; i < 24 + 7; ++i) {
        message.addButtonToRow(
          (i % 24 < 10 ? "0" : "") + (i % 24) + ":00",
          "to"
        );
        message.addButtonToRow(
          (i % 24 < 10 ? "0" : "") + (i % 24) + ":30",
          "to"
        );
        message.newRow();
      }
      message.addButtonToRow("Ende", "to");
      message.sendUpdatedMessage();
    });
  } else if (message.state === "to") {
    BarDuty.update(
      {
        to: message.data,
      },
      whereObj
    ).then(() => {
      message.newText = "Schön, dass du kommst!";
      message.addButtonToRow("Angaben ändern", "state", "present");
      message.addButtonToRow("Ich kann doch nicht", "state", "absent");
      message.sendUpdatedMessage();
    });
  }
});

const defaultSendDaysBefore = [10, 7, 5, 3, 2, 1, 0];

const checkForEventsAndSend = (sendDaysBefore) => {
  let daysAhead = new Date();
  daysAhead.setDate(daysAhead.getDate() + 15);
  Bar.findAll({
    where: {
      start: {
        [Op.and]: {
          [Op.gt]: new Date(),
          [Op.lt]: daysAhead,
        },
      },
    },
  }).then((bars) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    bars = bars.filter((b) => {
      const barDate = new Date(b.start);
      barDate.setHours(0, 0, 0, 0);
      let dayDiff =
        (barDate.getMilliseconds() - now.getMilliseconds()) /
        1000 /
        60 /
        60 /
        24;
      return sendDaysBefore.some((v) => v === dayDiff);
    });
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
          .catch(console.error);
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
    return JSON.parse("[" + SendDaysBefore.value + "]");
  } catch (e) {
    console.error(
      "The value of the setting telegramBarFeedbackDaysBefore has the wrong format: ",
      SendDaysBefore.value
    );
    return defaultSendDaysBefore;
  }
};

// every day at 3 pm
const sendCronJob = new cron.CronJob(
  "00 00 15 * * *",
  async () => checkForEventsAndSend(await getSendDaysBefore()),
  null,
  true,
  "Europe/Berlin"
);

export const barAdded = (bar) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const barDate = new Date(bar.start);
  barDate.setHours(0, 0, 0, 0);
  let dayDiff =
    (barDate.getMilliseconds() - today.getMilliseconds()) / 1000 / 60 / 60 / 24;
  getSendDaysBefore().then((daysBefore) => {
    if (daysBefore.some((d) => d === dayDiff)) {
      sendBarInfo(bar).catch(console.error);
    }
  });
};

export const changeCleaningStatus = (barId, userId, newHaveToCleanState) => {
  Bar.findByPk(barId)
    .then((bar) => {
      const end = new Date(bar.start.setHours(bar.start.getHours() + 12));
      // bar is to old
      if (new Date() > end) {
        return;
      }
      // do not change the original date
      const start = new Date(bar.start);
      start.setDate(
        start.getDate() - SendDaysBefore.reduce((l, r) => Math.max(l, r))
      );
      // bar is to new
      if (start > new Date()) {
        return;
      }
      const startText =
        "Du musst bei der " +
        bar.name +
        " am " +
        bar.start.getDate() +
        "." +
        (bar.start.getMonth() + 1) +
        "." +
        bar.start.getFullYear();
      if (!newHaveToCleanState) {
        User.findByPk(userId)
          .then((user) => {
            sendMessage(user, startText + " doch nicht mehr putzen.");
          })
          .catch(console.error);
      }
      BarDuty.findAll({
        where: {
          barID: barId,
          have_to_clean: true,
        },
        include: [
          {
            model: User,
            attributes: ["id", "name", "telegramID"],
          },
        ],
      })
        .then((duties) => {
          if (duties.length === 1) {
            sendMessage(duties[0].user, startText + " aktuell alleine putzen.");
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
              sendMessage(duties[i].user, message);
            }
          }
        })
        .catch(console.error);
    })
    .catch(console.error);
};
