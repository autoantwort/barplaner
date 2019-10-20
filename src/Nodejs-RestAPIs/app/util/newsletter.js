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
 * creates a newsletter in the wp_2_newsletter_emails table based on the newsletter wth the given id
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
    // only create one newsletter per bar
    Wordpress.query("Select id from wp_2_newsletter_emails where barId = ?", { replacements: [barObject.id], type: Wordpress.QueryTypes.SELECT }).then(bars => {
        // when there is no newsletter for the bar
        if (bars.length === 0) {
            // get template newsletter
            Wordpress.query("Select * from wp_2_newsletter_emails where id = 61", { replacements: [newsletterId], type: Wordpress.QueryTypes.SELECT }).then(rows => {
                if (rows.length === 1) {
                    DefaultImageURL.reload().then(() => {
                        const nl = rows[0];
                        nl.message = replacePlaceholders(nl.message, barObject, DefaultImageURL.value);
                        nl.subject = replacePlaceholders(nl.subject, barObject, DefaultImageURL.value);
                        const now = new Date();
                        now.setMinutes(now.getMinutes() + now.getTimezoneOffset());
                        nl.send_on = Number((sendTime / 1000).toFixed(0));
                        nl.created = now;
                        nl.status = 'sending';
                        nl.barId = barObject.id;
                        delete nl.id;
                        let sql = "Insert into wp_2_newsletter_emails ";
                        sql += '(' + Object.getOwnPropertyNames(nl).join(', ') + ')';
                        sql += " VALUES ";
                        sql += '(' + Object.getOwnPropertyNames(nl).map(n => ":" + n).join(', ') + ')';
                        Wordpress.query(sql, { replacements: nl, type: Wordpress.QueryTypes.INSERT }).catch(console.error);
                    }).catch(console.error);
                } else {
                    console.error("The newsletterId " + newsletterId + " is not a valid newsletterId");
                }
            }).catch(console.error);
        }
    }).catch(console.error);
}

/**
 * creates a newsletter in the wordpress database, you can only create one newsletter per bar
 * 
 * @param {Bar} barData the bar model object 
 */
exports.sendEmailForBar = (barData) => {
    TemplateNewsletterId.reload().then(id => {
        computeSendTime(barData.start).then(time => {
            sendNewsletter(barData, id, time);
        }).catch(console.error);
    }).catch(console.error);
};