import ICal from 'ical-generator';
import env from '../config/env';
import db from '../config/db.config';
import { onBarAdded, onBarChanged } from './addBar';
import { Bar } from '../model/bar.model';
import { Op } from 'sequelize';
import { Client, transport, Credentials } from "dav";

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
    if (event.studibarsEventId) {
        e.url = `https://studibars-ac.de/symposion/${event.name}--${event.studibarsEventId}/`;
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

const clients = [];
for (const config of env.webDavCalendars) {
    const client = new Client(new transport.Basic(new Credentials(config.auth)));
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
                if (e.url && e.url.endsWith("bar" + bar.id)) {
                    e.calendarData = data;
                    client.updateCalendarObject(e).catch(err => console.error("Can not update Calendar object: ", err, e, bar.dataValues));
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
                    ...(config.publishPrivateEvents || { public: true }),
                }
            }).then(bars => {
                for (const bar of bars) {
                    client.saveBar(bar);
                }
            }).catch(console.error);
        });
    });
}

onBarAdded(bar => {
    for (const c of clients) {
        c.saveBar(bar);
    }
});

onBarChanged(bar => {
    for (const c of clients) {
        c.saveBar(bar);
    }
});
