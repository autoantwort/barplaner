import { Sequelize } from 'sequelize';
import { NewsletterAdminRoleName } from './rolesNames.js';
import env from '../config/env.js';
import { Setting } from '../model/setting.model.js';

const wordpressDB = new Sequelize(env.wordpress.database, env.wordpress.username, env.wordpress.password, {
    host: env.wordpress.host,
    dialect: env.wordpress.dialect,
    logging: (e, t) => {}, 
});

wordpressDB
    .authenticate()
    .then(() => {
        console.log('Connection to the wordpress database has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the wordpress database:', err);
    });

const [SendDaysBefore, _1] = await Setting.findCreateFind({
    where: {
        name: "sendDaysBeforeBar",
    },
    defaults: {
        name: "sendDaysBeforeBar",
        description: "The number of days before the bar at which the newsletter is sent. Example: The bar on 15.10 and this value is 2, the newsletter will be sent on 13.10.",
        value: "2",
        permission: NewsletterAdminRoleName
    }
});

const [SendTime, _2] = await Setting.findCreateFind({
    where: {
        name: "newsletterSendTime",
    },
    defaults: {
        name: "newsletterSendTime",
        description: "At what time should the newsletter be sent?",
        value: "15",
        permission: NewsletterAdminRoleName
    }
});

const [TemplateNewsletterId, _3] = await Setting.findCreateFind({
    where: {
        name: "templateNewsletterId",
    },
    defaults: {
        name: "templateNewsletterId",
        description: "The id of the newsletter that should be used as template.",
        value: "-1",
        permission: NewsletterAdminRoleName
    }
});

const [DefaultImageURL, _4] = await Setting.findCreateFind({
    where: {
        name: "DefaultImageURL",
    },
    defaults: {
        name: "DefaultImageURL",
        description: "The url to the image that should be used, if a bar has no cover image (created in the orga system and not on studibars.de).",
        value: "https://symposion.hilton.rwth-aachen.de/wp-content/uploads/2019/08/67976531_2499717063420882_1963470524436709376_o.jpg",
        permission: NewsletterAdminRoleName
    }
});

/**
 * computes the time, when the newsletter should be sended
 * 
 * @param {Date} start the start datetime of the bar
 * @returns {Promise<Date>} return the date, when the newsletter should be sended
 */
function computeSendTime(start) {
    return new Promise((resolve, reject) => {
        SendDaysBefore.reload().then(days => {
            SendTime.reload().then(() => {
                const result = /^(\d{1,2})(:(\d\d))?$/.exec(SendTime.value);
                if (result === null) {
                    reject("Setting newsletterSendTime: Not a valid value: " + SendTime.value);
                } else {
                    if (result[3] === undefined) {
                        result[3] = "00";
                    }
                    const d = new Date(start);
                    d.setDate(d.getDate() - Number(SendDaysBefore.value));
                    d.setHours(Number(result[1]));
                    d.setMinutes(Number(result[3]));
                    resolve(d);
                }
            }).catch(reject);
        }).catch(reject);
    });
}

/**
 * replaces the $... variables in the given text. The values are taken from the barObject. If the barObject has no studibarsEventPosterURL, the defaultImageURL will be used
 * @param {string} text the text with the $... variables in it
 * @param {Bar} barObject the bar object
 * @param {string} defaultImageURL the default image URL, when the bar object has no studibarsEventPosterURL
 * @returns {string} the text where all variables are replaced by values
 */
function replacePlaceholders(text, barObject, defaultImageURL) {
    const barname = barObject.name;
    const date = barObject.start.getDate() + "." + (barObject.start.getMonth() + 1);
    const time = barObject.start.getHours();
    const content = barObject.description.replace(/\n/g, "<br>");
    const studibarsEventPosterURL = barObject.studibarsEventPosterURL;
    // image url https://symposion.hilton.rwth-aachen.de/wp-content/uploads/2019/08/67976531_2499717063420882_1963470524436709376_o.jpg => studibarsEventPosterURL:
    const coverImageURL = barObject.studibarsEventPosterURL ? barObject.studibarsEventPosterURL : defaultImageURL;
    text = text.replace(/\$barname/g, barname);
    text = text.replace(/\$date/g, date);
    text = text.replace(/\$time/g, time);
    text = text.replace(/\$content/g, content);
    text = text.replace(/\$facebookEventId/g, studibarsEventPosterURL);
    text = text.replace(/\$studibarsEventPosterURL/g, studibarsEventPosterURL);
    text = text.replace(/https:\/\/www\.hilton\.rwth-aachen\.de\/.+\/coverImageURL\.png/g, coverImageURL);
    return text;
}

/**
 * creates a newsletter in the wp_2_newsletter_emails table based on the newsletter wth the given id.
 * if a newsletter for the bar already exists, the newsletter gets updated
 * 
 * @param {Bar} barObject the bar object with all nessesary information
 * @param {Number} newsletterId the id of the template newsletter
 * @param {Date} sendTime when should the newsletter be sent
 */
function sendNewsletter(barObject, newsletterId, sendTime) {
    // dont send newsletters without text
    if (barObject.description.length === 0) {
        return;
    }
    // get template newsletter
    wordpressDB.query("Select * from wp_2_newsletter_emails where id = ?", { replacements: [newsletterId], type: wordpressDB.QueryTypes.SELECT }).then(rows => {
        if (rows.length === 1) {
            const template = rows[0];
            // only create one newsletter per bar, update old one
            wordpressDB.query("Select id from wp_2_newsletter_emails where barId = ?", { replacements: [barObject.id], type: wordpressDB.QueryTypes.SELECT }).then(bars => {
                DefaultImageURL.reload().then(() => {
                    // when there is no newsletter for the bar
                    if (bars.length === 0) {
                        if (barObject.canceled) {
                            // don't create a newsletter if event is cancelled
                            return;
                        }
                        template.message = replacePlaceholders(template.message, barObject, DefaultImageURL.value);
                        template.subject = replacePlaceholders(template.subject, barObject, DefaultImageURL.value);
                        const now = new Date();
                        now.setMinutes(now.getMinutes() + now.getTimezoneOffset());
                        template.send_on = Number((sendTime / 1000).toFixed(0));
                        template.created = now;
                        template.status = 'sending';
                        template.barId = barObject.id;
                        delete template.id;
                        let sql = "Insert into wp_2_newsletter_emails ";
                        sql += '(' + Object.getOwnPropertyNames(template).join(', ') + ')';
                        sql += " VALUES ";
                        sql += '(' + Object.getOwnPropertyNames(template).map(n => ":" + n).join(', ') + ')';
                        wordpressDB.query(sql, { replacements: template, type: wordpressDB.QueryTypes.INSERT }).catch(console.error);
                    } else {
                        // update existing newsletters
                        for (let newsletter of bars) {
                            // we don't want to change newsletters that are already sent
                            if (newsletter.status !== "sent") {
                                if (barObject.canceled) {
                                    // delete existing newsletter
                                    let sql = "Delete from wp_2_newsletter_emails WHERE id = ?";
                                    wordpressDB.query(sql, { replacements: [newsletter.id], type: wordpressDB.QueryTypes.DELETE }).catch(console.error);
                                    return;
                                }
                                let update = {};
                                update.message = replacePlaceholders(template.message, barObject, DefaultImageURL.value);
                                update.subject = replacePlaceholders(template.subject, barObject, DefaultImageURL.value);
                                const now = new Date();
                                now.setMinutes(now.getMinutes() + now.getTimezoneOffset());
                                update.send_on = Number((sendTime / 1000).toFixed(0));
                                let sql = "Update wp_2_newsletter_emails SET ";
                                sql += Object.getOwnPropertyNames(update).map(p => p + " = :" + p).join(', '); /* message = :message, ... */
                                sql += " WHERE id = :id";
                                update.id = newsletter.id;
                                wordpressDB.query(sql, { replacements: update, type: wordpressDB.QueryTypes.UPDATE }).catch(console.error);
                            }
                        }
                    }
                }).catch(console.error);
            }).catch(console.error);
        } else {
            console.error("There is no newsletter for the given template newsletter id ", newsletterId);
        }
    }).catch(console.error);
}

/**
 * creates a newsletter in the wordpress database, you can only create one newsletter per bar.
 * if a newsletter for the bar already exists, the newsletter gets updated
 * 
 * @param {Bar} barData the bar model object 
 */
export function sendEmailForBar(barData) {
    TemplateNewsletterId.reload().then(id => {
        computeSendTime(barData.start).then(time => {
            sendNewsletter(barData, id.value, time);
        }).catch(console.error);
    }).catch(console.error);
}