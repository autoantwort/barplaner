import db from "../config/db.config.js";
import Bar from "../model/bar.model.js";
import * as seq from "sequelize";

const Op = seq.Op;

import * as ical from "ical-generator";
import env from "../config/env.js";
import * as BarUtil from "./addBar.js";

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

export const serve = (res) => cal.serve(res);
