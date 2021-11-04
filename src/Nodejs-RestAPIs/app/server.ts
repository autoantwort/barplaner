#!/usr/bin/env node
import * as express from "express";

const app = express();

import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";

import env from "./config/env.js";

import barRoute from "./route/bar.route.js";
import dutyRoute from "./route/duty.route.js";
import settingRoute from "./route/setting.route.js";
import userRoute from "./route/user.route.js";

if (env.staticVue === true) app.use(express.static("../Vue.js-Client/dist"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

import * as cors from "cors";

const corsOptions = {
  //origin: "http://localhost:4200",
  origin: true,
  optionsSuccessStatus: 200,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());

import db from "./config/db.config.js";

import * as bcrypt from "bcrypt";

bcrypt.genSalt(10, function (err, salt) {
  console.log(salt);
  console.log(JSON.stringify(salt));
});

// force: true will drop the table if it already exists
db.sequelize.sync({ force: env.resetDatabase }).then(() => {
  console.log("Sync with db");
  db.callSyncCallbacks();
  //const Util = require('./app/util/adduser');
  //Util.createAdmin("Test", "Test", e => console.log(e));
});

import * as facebookUtil from "./util/facebook.js";

if (
  typeof env.facebookAccessToken === "string" &&
  env.facebookAccessToken.length > 0 &&
  typeof env.symposionPageID === "string" &&
  env.symposionPageID.length > 0
) {
  facebookUtil.runFacebookSync();
}

import * as telegram from "./util/telegram.js";
import * as gitFileBrowser from "./util/gitFileBrowser.js";
import * as telegramNewsletter from "./util/telegramNewsletter.js";
import * as gitlab from "./util/gitlab.js";

import * as remoteVolumeControl from "./util/remoteVolumeControl.js";
remoteVolumeControl.registerClients(app);

import * as remoteControlPane from "./util/remoteControlPane.js";
remoteControlPane.registerClients(app);

import * as ical from "./util/icalCalendar.js";
app.get(env.ical.urlPath, (req, res) => ical.serve(res));

import * as webDavCalendar from "./util/webDavCalendar.js";
import webNotificationsNewsletter from "./util/webNotificationsNewsletter.js";

if (env.webDavCalendars && env.webDavCalendars.length > 0) {
  //require("./util/webDavCalendar");
}
if (
  env.webNotifications &&
  env.webNotifications.vapidKeys.privateKey.length > 0
) {
  webNotificationsNewsletter(app, "/push/");
}

import * as crypto from "crypto";

const User = db.User;

app.post("/api/login", (req, res) => {
  User.findOne({
    where: {
      name: req.body.name,
    },
  }).then((user) => {
    if (user === null) {
      res.status(401).send("User not exists");
    } else {
      let func = (result) => {
        if (result === true) {
          res.cookie("auth", user.sessionID, {
            maxAge: 1892160000000 /*60 years*/,
            httpOnly: true,
            sameSite: false /* TODO */,
            secure: req.secure,
          });
          user
            .getRoles()
            .then((roles) => {
              res.send({ user: user, roles: roles });
            })
            .catch((err) => res.status(500).send(err));
        } else {
          res.status(401).send("Wrong passord");
        }
      };
      // old password hash from old db
      if (user.password.indexOf("$md5$") === 0) {
        const hash = crypto.createHash("md5");
        hash.update(req.body.password);
        // right, but old password hash
        let result = user.password.substr(5) === hash.digest("hex");
        if (result) {
          bcrypt.hash(req.body.password, 10).then(function (hash) {
            user
              .update({ password: hash })
              .then(() => {
                console.log("password hash updated");
              })
              .catch((err) =>
                console.error("Error while updating password hash : " + err)
              );
          });
          if (user.sessionID === null) {
            user
              .update({ sessionID: crypto.randomBytes(32).toString("hex") })
              .then(() => {
                func(true);
              })
              .catch((err) => res.status(500).send("Error -> " + err));
            return;
          }
        }
        func(result);
      } else {
        bcrypt
          .compare(req.body.password, user.password)
          .then((result) => {
            if (result === true && user.sessionID === null) {
              user
                .update({ sessionID: crypto.randomBytes(32).toString("hex") })
                .then(() => {
                  func(true);
                })
                .catch((err) => res.status(500).send("Error -> " + err));
              return;
            }
            func(result);
          })
          .catch((err) => res.status(500).send("Error -> " + err));
      }
    }
  });
});

app.use((req, res, next) => {
  if (req.cookies.auth === undefined) {
    res.status(401).send("not authenticated");
    return;
  }

  User.findOne({ where: { sessionID: req.cookies.auth } })
    .then((user) => {
      if (user === null) {
        res.status(401).send("not authenticated");
      } else {
        const request: any = req;
        request.user = user;
        next();
      }
    })
    .catch((err) => {
      res.status(500).send("Error -> " + err);
    });
});

app.post("/api/logout", (req, res) => {
  res.clearCookie("auth", {
    httpOnly: true,
    sameSite: false /* TODO */,
    secure: req.secure,
  });

  const request: any = req;

  request.user
    .update({ sessionID: null })
    .then(() => res.send("logged out"))
    .catch((err) => res.status(500).send("Error -> " + err));
});

remoteVolumeControl.registerMasters(app);
remoteControlPane.registerMasters(app);

settingRoute(app);
userRoute(app);
barRoute(app);
dutyRoute(app);

// Create a Server
var server = app.listen(8080, function () {
  const address = server.address();
  let host = "";
  let port: string | number = "";

  if (typeof address !== "string") {
    host = address.address;
    port = address.port;
  }

  console.log("App listening at http://%s:%s", host, port);
});
