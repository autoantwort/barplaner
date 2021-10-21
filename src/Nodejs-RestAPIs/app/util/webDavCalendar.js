const ICal = require('ical-generator');
const env = require('../config/env');
const db = require('../config/db.config');
const BarUtil = require('./addBar');
const Bar = db.Bar;
const Op = db.Sequelize.Op;

// see https://www.npmjs.com/package/dav for the api
// the api feels often like a C api (you have the client and pass 
// the objects to the methods of the client to create/update them)

const toICalString = event => ICal({
    domain: env.ical.domain,
    prodId: env.ical.prodId,
    name: env.ical.name,
    timezone: 'Europe/Berlin',
    events: [event],
}).toString();

const createEvent = event => {
    const e = {
        uid: event.id,
        start: event.start,
        end: event.end,
        summary: event.name,
        description: event.description,
        status: event.canceled ? "cancelled" : "confirmed",
    };
    if (event.facebookEventID) {
        e.url = "https://www.facebook.com/events/" + event.facebookEventID;
    }
    e.organizer = env.ical.organizer;
    e.geo = env.ical.geo;
    if (env.ical.location && !env.ical.appleLocation) {
        e.location = env.ical.location;
    }
    if (env.ical.appleLocation) {
        e.appleLocation = env.ical.appleLocation;
    }
    return toICalString(e);
};

const dav = require("dav");

const clients = [];
for (const config of env.webDavCalendars) {
    const client = new dav.Client(new dav.transport.Basic(new dav.Credentials(config.auth)));
    clients.push(client);
    client.createAccount({
        server: config.url,
        accountType: 'caldav',
        loadCollections: true,
        loadObjects: true,
    }).then(acc => {
        if (acc.calendars.length === 0) {
            console.error("There is no calendar for " + config.url);
            return;
        }
        let calendar = null;
        for (let c of acc.calendars) {
            if (c.displayName === config.calendarName || c.url === config.url) {
                calendar = c;
                break;
            }
        }
        if (calendar === null) {
            console.error("No calendar found for url " + config.url + " and calendar name " + config.calendarName);
            console.log("The calendars are:");
            for (let c of acc.calendars) {
                console.log(c.url + " or name " + c.displayName);
            }
            return;
        }
        client.saveBar = bar => {
            const data = createEvent(bar);
            // first look if the event already exists and we have to update it
            for (const e of calendar.objects) {
                if (e.url.endsWith("bar" + bar.id)) {
                    e.calendarData = data;
                    client.updateCalendarObject(e).catch(e => console.error("Can not update Calendar object: ", e));
                    return;
                }
            }
            // no existing calendar/event object found, create one
            client.createCalendarObject(calendar, { data, filename: "bar" + bar.id }).then(co => calendar.objects.push(co)).catch(e => console.error("Can not create Calendar object: ", e, data, bar));
        };
        db.addSyncCallback(() => {
            const oldest = new Date();
            oldest.setDate(oldest.getDate() - env.ical.oldestEvent);
            Bar.findAll({
                where: {
                    start: {
                        [Op.gt]: oldest,
                    },
                    public: true,
                }
            }).then(bars => {
                for (const bar of bars) {
                    client.saveBar(bar);
                }
            }).catch(console.error);
        });
    });
}

BarUtil.onBarAdded(bar => {
    for (const c of clients) {
        c.saveBar(bar);
    }
});

BarUtil.onBarChanged(bar => {
    for (const c of clients) {
        c.saveBar(bar);
    }
});