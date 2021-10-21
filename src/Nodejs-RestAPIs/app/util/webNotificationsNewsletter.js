import db from '../config/db.config';
import { Op } from 'sequelize';

const webPush = require('web-push');
const env = require('../config/env');

const BarUtil = require('./addBar');
const CronJob = require('cron').CronJob;
const Bar = db.Bar;
const WebPushSubs = db.WebPushSubscription;

// see https://serviceworke.rs/web-push.html for good examples

webPush.setVapidDetails(
    env.webNotifications.contact,
    env.webNotifications.vapidKeys.publicKey,
    env.webNotifications.vapidKeys.privateKey
);

function getDayDiff(now, bar) {
    bar.start.setHours(0, 0, 0, 0);
    return (bar.start - now) / 1000 / 60 / 60 / 24;
}

const sendCronJob = new CronJob('00 * ' + env.webNotifications.sendTime + ' * * *', function() {
    const now = new Date();
    Bar.findAll({
        where: {
            start: {
                [Op.gte]: now,
            },
        },
    }).then(bars => {
        for (const bar of bars) {
            if (env.webNotifications.sendDaysBefore.indexOf(getDayDiff(now, bar)) !== -1) {
                sendNotificationForBar(bar);
            }
        }
    }).catch(console.error);
}, null, true);

function sendNotification(data) {
    WebPushSubs.findAll().then(subs => {
        for (const sub of subs) {
            webPush.sendNotification(JSON.parse(sub.subscription), data)
                .catch(() => {
                    // da hat wohl jemand unsubscribed
                    sub.destroy().catch(console.error);
                });
        }
    }).catch(console.error);
}

function sendNotificationForBar(bar) {
    sendNotification(JSON.stringify({
        titel: bar.name,
        description: bar.description,
        facebookEventID: bar.facebookEventID,
        facebookCoverImageURL: bar.facebookCoverImageURL,
    }));
}

module.exports = function(app, route) {
    app.get(route + 'vapidPublicKey', function(req, res) {
        res.send(env.webNotifications.vapidKeys.publicKey);
    });

    app.post(route + 'register', function(req, res) {
        const subscription = req.body.subscription;
        WebPushSubs.findOrCreate({
            where: {
                endpoint: subscription.endpoint,
            },
            defaults: {
                endpoint: subscription.endpoint,
                subscription: JSON.stringify(subscription),
            },
        }).then((subs, created) => {
            if (!created) {
                const sub = subs[0];
                sub.subscription = JSON.stringify(subscription);
                sub.save().catch(console.error);
            }
            res.sendStatus(201);
        }).catch(e => {
            console.error(e);
            res.status(500).send(e);
        });
    });

    app.post(route + 'unregister', function(req, res) {
        const subscription = req.body.subscription;
        WebPushSubs.destroy({
            where: {
                endpoint: subscription.endpoint,
            }
        }).catch(console.error);
        res.sendStatus(201);
    });
};

BarUtil.onBarAdded(bar => {
    if (!bar.public && !bar.canceled)
        return;
    // check if the bar is very soon    
    const today = Math.floor(Date.now() / 1000 / 60 / 60 / 24);
    const barDay = Math.floor(bar.start / 1000 / 60 / 60 / 24);
    if (barDay == today) {
        sendNotificationForBar(bar);
    } else if (barDay == today - 1) {
        if (new Date().getHours() >= env.webNotifications.sendTime) {
            sendNotificationForBar(bar);
        }
    }
});

BarUtil.onBarChanged(bar => {
    if (bar.canceled) {
        sendNotification({
            titel: "Die Bar " + bar.name + " wurde abgesagt!",
            facebookEventID: bar.facebookEventID,
        });
    }
});