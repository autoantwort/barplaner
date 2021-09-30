const db = require('../config/db.config.js');
const Wordpress = db.Wordpress;
const Bar = db.Bar;
const Role = db.Role;
const Setting = db.Setting;

let NewsletterAdminRole = null;
let SendDaysBefore = null;
let SendTime = null;
let DefaultImageURL = null;
let TemplateNewsletterId = null;

db.addSyncCallback(() => {
    Role.findCreateFind({
        where: { name: "NewsletterAdmin" },
        defaults: {
            name: "NewsletterAdmin",
            description: "You can change settings that have something to do with the newsletter.",
        }
    }).then(role =>  {
        NewsletterAdminRole = role[0];
        Setting.findCreateFind({
            where: {
                name: "sendDaysBeforeBar",
            },
            defaults: {
                name: "sendDaysBeforeBar",
                description: "The number of days before the bar at which the newsletter is sent. Example: The bar on 15.10 and this value is 2, the newsletter will be sent on 13.10.",
                value: "2",
                permission: NewsletterAdminRole.name
            }
        }).then(sendDaysBefore => {
            SendDaysBefore = sendDaysBefore[0];
        }).catch(console.error);

        Setting.findCreateFind({
            where: {
                name: "newsletterSendTime",
            },
            defaults: {
                name: "newsletterSendTime",
                description: "At what time should the newsletter be sent?",
                value: "15",
                permission: NewsletterAdminRole.name
            }
        }).then(newsletterSendTime => {
            SendTime = newsletterSendTime[0];
        }).catch(console.error);

        Setting.findCreateFind({
            where: {
                name: "templateNewsletterId",
            },
            defaults: {
                name: "templateNewsletterId",
                description: "The id of the newsletter that should be used as template.",
                value: "-1",
                permission: NewsletterAdminRole.name
            }
        }).then(templateNewsletterId => {
            TemplateNewsletterId = templateNewsletterId[0];
        }).catch(console.error);

        Setting.findCreateFind({
            where: {
                name: "DefaultImageURL",
            },
            defaults: {
                name: "DefaultImageURL",
                description: "The url to the image that should be used, if a bar has no cover image (created in the orga system and not on facebook).",
                value: "https://www.hilton.rwth-aachen.de/wordpress/symposion/wp-content/uploads/sites/2/2019/08/67976531_2499717063420882_1963470524436709376_o.jpg",
                permission: NewsletterAdminRole.name
            }
        }).then(defaultImageURL => {
            DefaultImageURL = defaultImageURL[0];
        }).catch(console.error);
    }).catch(console.error);
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
 * replaces the $... variables in the given text. The values are taken from the barObject. If the barObject has no facebookCoverImageURL, the defaultImageURL will be used
 * @param {string} text the text with the $... variables in it
 * @param {Bar} barObject the bar object
 * @param {string} defaultImageURL the default image URL, when the bar object has no facebookCoverImageURL
 * @returns {string} the text where all variables are replaced by values
 */
function replacePlaceholders(text, barObject, defaultImageURL) {
    const barname = barObject.name;
    const date = barObject.start.getDate() + "." + (barObject.start.getMonth() + 1);
    const time = barObject.start.getHours();
    const content = barObject.description.replace(/\n/g, "<br>");
    const facebookEventId = barObject.facebookEventID;
    // image url https://www.hilton.rwth-aachen.de/wordpress/symposion/wp-content/uploads/sites/2/2019/10/coverImageURL.png => facebookCoverImageURL:
    const coverImageURL = barObject.facebookCoverImageURL ? barObject.facebookCoverImageURL : defaultImageURL;
    text = text.replace(/\$barname/g, barname);
    text = text.replace(/\$date/g, date);
    text = text.replace(/\$time/g, time);
    text = text.replace(/\$content/g, content);
    text = text.replace(/\$facebookEventId/g, facebookEventId);
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
    Wordpress.query("Select * from wp_2_newsletter_emails where id = ?", { replacements: [newsletterId], type: Wordpress.QueryTypes.SELECT }).then(rows => {
        if (rows.length === 1) {
            const template = rows[0];
            // only create one newsletter per bar, update old one
            Wordpress.query("Select id from wp_2_newsletter_emails where barId = ?", { replacements: [barObject.id], type: Wordpress.QueryTypes.SELECT }).then(bars => {
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
                        Wordpress.query(sql, { replacements: template, type: Wordpress.QueryTypes.INSERT }).catch(console.error);
                    } else {
                        // update existing newsletters
                        for (let newsletter of bars) {
                            // we don't want to change newsletters that are already sent
                            if (newsletter.status !== "sent") {
                                if (barObject.canceled) {
                                    // delete existing newsletter
                                    let sql = "Delete from wp_2_newsletter_emails WHERE id = ?";
                                    Wordpress.query(sql, { replacements: [newsletter.id], type: Wordpress.QueryTypes.DELETE }).catch(console.error);
                                    return;
                                }
                                let update = {
                                    id: newsletter.id,
                                    message:  replacePlaceholders(template.message, barObject, DefaultImageURL.value),
                                    subject: replacePlaceholders(template.subject, barObject, DefaultImageURL.value),
                                    send_on: Number((sendTime / 1000).toFixed(0)),
                                };

                                const now = new Date();
                                now.setMinutes(now.getMinutes() + now.getTimezoneOffset());
                                let sql = "Update wp_2_newsletter_emails SET ";
                                sql += Object.getOwnPropertyNames(update).map(p => p + " = :" + p).join(', '); /* message = :message, ... */
                                sql += " WHERE id = :id";
                                
                                Wordpress.query(sql, { replacements: update, type: Wordpress.QueryTypes.UPDATE }).catch(console.error);
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
exports.sendEmailForBar = (barData) => {
    TemplateNewsletterId.reload().then(id => {
        computeSendTime(barData.start).then(time => {
            sendNewsletter(barData, id.value, time);
        }).catch(console.error);
    }).catch(console.error);
};