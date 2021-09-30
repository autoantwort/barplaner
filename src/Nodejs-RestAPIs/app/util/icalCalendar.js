import db from "../config/db.config";
import { Op } from "sequelize";

const ical = require("ical-generator");
const env = require("../config/env");
const BarUtil = require("./addBar");
const Bar = db.Bar;

const cal = ical({
  domain: env.ical.domain,
  prodId: env.ical.prodId,
  name: env.ical.name,
  timezone: "Europe/Berlin",
  url: env.baseURL + env.ical.urlPath,
  method: "PUBLISH",
  ttl: env.ical.ttl,
});

const addBar = (event) => {
  const e = cal.createEvent({
    uid: event.id,
    start: event.start,
    end: event.end,
    summary: event.name,
    description: event.description,
    status: event.canceled ? "CANCELLED" : "CONFIRMED",
  });
  if (event.facebookEventID) {
    e.url("https://www.facebook.com/events/" + event.facebookEventID);
  }
  e.organizer(env.ical.organizer);
  e.geo(env.ical.geo);
  if (env.ical.location && !env.ical.appleLocation) {
    e.location(env.ical.location);
  }
  if (env.ical.appleLocation) {
    e.appleLocation(env.ical.appleLocation);
  }
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
    },
  })
    .then((events) => {
      for (let event of events) {
        addBar(event);
      }
    })
    .catch(console.error);
});

BarUtil.onBarAdded((bar) => {
  addBar(bar);
});

BarUtil.onBarChanged((event) => {
  for (let e of cal.events()) {
    if (e.uid() == event.id) {
      e.start(event.start);
      e.end(event.end);
      e.summary(event.name);
      e.description(event.description);
      e.status(event.canceled ? "CANCELLED" : "CONFIRMED");
      if (event.facebookEventID) {
        e.url("https://www.facebook.com/events/" + event.facebookEventID);
      }
      break;
    }
  }
});

exports.serve = (res) => cal.serve(res);
