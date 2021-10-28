import db from "../config/db.config.js";
import { Op } from "sequelize";
import Bar from "../model/bar.model.js";

const Telegram = require("./telegram.js");
const cron = require("cron");
const CronJob = cron.CronJob;
const CronTime = cron.CronTime;

const TelegramNewsletter = db.TelegramNewsletter;

const helpText =
  "*Sende* `/newsletter off` um den Newsletter zu deabonnieren.  \n" +
  "*Sende* `/newsletter hh:mm` (`:` optional) um die Uhrzeit einzustellen, an welcher der Newsletter gesendet wird. Z.b. `/newsletter 0845` für 08:45  \n" +
  "*Sende* `/newsletter x y z` (Leerzeichen + Komma + Semikolon als Trennzeichen erlaubt, beliebig viele Zahlen), damit der Newsletter x, y, z Tage vorher gesendet wird gesendet wird. Z.b. `/newsletter 0 1 4 9` Hier wird der Newsletter 0, 1, 4, 9 Tage vorher gesendet.  \n" +
  "*Sende* `/newsletter` um den Newsletter wieder zu abonnieren, falls du ihn deabonniert hast oder um diese Nachricht anzuzeigen.  \n";

// a mapping from chatIds to cron jobs
const cronJobs = {};

const clockRegex = /(\d{2}):?((\d){2})/;

const daysBeforeRegex = /(\d+)[ ,;.]*/gy;

const createCronJob = (value) => {
  cronJobs[value.chatId] = new CronJob(
    "00 " +
      value.sendAt.substring(2, 4) +
      " " +
      value.sendAt.substring(0, 2) +
      " * * *",
    function () {
      TelegramNewsletter.findByPk(value.chatId)
        .then((value) => {
          const sendDaysBefore = JSON.parse(value.sendDaysBefore);
          Bar.findAll({
            where: {
              start: {
                [Op.gt]: new Date(),
              },
              public: true,
              canceled: false,
            },
          }).then((bars) => {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            // check if we should send a message for a bar
            bars
              .filter(
                (b) =>
                  b.description /* send only when the bar has a description*/
              )
              .filter((b) => {
                const barDate = new Date(b.start);
                barDate.setHours(0, 0, 0, 0);
                let dayDiff =
                  (barDate.getMilliseconds() - now.getMilliseconds()) /
                  1000 /
                  60 /
                  60 /
                  24;
                return sendDaysBefore.some((v) => v === dayDiff);
              })
              .forEach((bar) => {
                // send photo for the bar with description
                const imageURL = bar.facebookCoverImageURL
                  ? bar.facebookCoverImageURL
                  : "https://www.hilton.rwth-aachen.de/wordpress/symposion/wp-content/uploads/sites/2/2019/08/67976531_2499717063420882_1963470524436709376_o.jpg";
                if (bar.description.length > 1024) {
                  Telegram.bot.sendPhoto(value.chatId, imageURL);
                  Telegram.bot.sendMessage(value.chatId, bar.description);
                } else {
                  Telegram.bot.sendPhoto(value.chatId, imageURL, {
                    caption: bar.description,
                  });
                }
              });
          });
        })
        .catch(console.error);
    },
    null,
    value.enabled,
    "Europe/Berlin"
  );
};

TelegramNewsletter.findAll().then((values) => {
  values.forEach((value) => createCronJob(value));
});

Telegram.bot.onText(/\/newsletter/, (msg) => {
  const text = msg.text
    .substring(msg.text.indexOf(" ", msg.text.indexOf("/newsletter")))
    .trim();
  const chatId = msg.chat.id;
  if (text === "off") {
    TelegramNewsletter.findByPk(chatId)
      .then((value) => {
        if (value) {
          value.enabled = false;
          value
            .save()
            .then(() =>
              Telegram.bot.sendMessage(
                chatId,
                "Newsletter erfolgreich deabonniert. Nutze /newsletter um ihn wieder zu aktivieren"
              )
            )
            .catch(() =>
              Telegram.bot.sendMessage(
                chatId,
                "Error while disabling the newsletter :("
              )
            );
          cronJobs[value.chatId].stop();
        }
      })
      .catch(console.error);
  } else if (clockRegex.test(text)) {
    const wasRunning = cronJobs[chatId].running;
    const extraText = wasRunning
      ? ""
      : " Du hast den Newsletter jedoch deabonniert, deswegen werden keine Nachrichten versendet. Sende /newsletter um ihn wieder zu aktivieren.";
    const result = clockRegex.exec(text);
    const hours = result[1];
    const minutes = result[2];
    TelegramNewsletter.update(
      {
        sendAt: hours + minutes,
      },
      {
        where: {
          chatId: chatId,
        },
      }
    )
      .then(() =>
        Telegram.bot.sendMessage(
          chatId,
          "Newsletter werden ab jetzt immer um " +
            hours +
            ":" +
            minutes +
            " gesendet." +
            extraText
        )
      )
      .catch(() =>
        Telegram.bot.sendMessage(
          chatId,
          "Fehler beim Speichern der aktualisierten der Sendezeit :("
        )
      );

    cronJobs[chatId].setTime(
      new CronTime("00 " + minutes + " " + hours + " * * *", "Europe/Berlin")
    );
    if (wasRunning) {
      cronJobs[chatId].start();
    }
  } else if (daysBeforeRegex.test(text)) {
    let newDaysBefore = [];
    let match;
    daysBeforeRegex.lastIndex = 0;
    while ((match = daysBeforeRegex.exec(text)) !== null) {
      newDaysBefore.push(Number(match[1]));
    }

    const wasRunning = cronJobs[chatId].running;
    const extraText = wasRunning
      ? ""
      : " Du hast den Newsletter jedoch deabonniert, deswegen werden keine Nachrichten versendet. Sende /newsletter um ihn wieder zu aktivieren.";
    TelegramNewsletter.update(
      {
        sendDaysBefore: JSON.stringify(newDaysBefore),
      },
      {
        where: {
          chatId: chatId,
        },
      }
    )
      .then(() =>
        Telegram.bot.sendMessage(
          chatId,
          "Newsletter werden ab jetzt immer " +
            JSON.stringify(newDaysBefore).slice(1, -1) +
            " Tage vorher gesendet." +
            extraText
        )
      )
      .catch(() =>
        Telegram.bot.sendMessage(
          chatId,
          "Fehler beim Aktualisieren der Sendezeit :("
        )
      );
  } else {
    TelegramNewsletter.findByPk(chatId)
      .then((value) => {
        if (value) {
          if (!value.enabled) {
            value.enabled = true;
            value
              .save()
              .then(() =>
                Telegram.bot.sendMessage(
                  chatId,
                  "Newsletter erfolgreich abonniert."
                )
              )
              .catch(() =>
                Telegram.bot.sendMessage(
                  chatId,
                  "Error while disabling the newsletter :("
                )
              );
            cronJobs[value.chatId].start();
          } else {
            Telegram.bot.sendMessage(chatId, helpText, {
              parse_mode: "Markdown",
            });
          }
        } else {
          TelegramNewsletter.create({
            chatId: chatId,
          })
            .then((value) => {
              Telegram.bot.sendMessage(
                chatId,
                "Newsletter erfolgreich abonniert.  \n" + helpText,
                { parse_mode: "Markdown" }
              );
              createCronJob(value);
            })
            .catch((e) => {
              Telegram.bot.sendMessage(
                chatId,
                "Interner Fehler beim Abonnieren des Newsletters."
              );
              console.error(
                "Konnte kein TelegramNewsletter objekt erstellen: ",
                e
              );
            });
        }
      })
      .catch(console.error);
  }
});
