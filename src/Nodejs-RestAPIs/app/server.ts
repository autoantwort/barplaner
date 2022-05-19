#!/usr/bin/env node
import express from "express";

const app = express();

import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

import env from "./config/env.js";

import barRoute from "./route/bar.route.js";
import dutyRoute from "./route/duty.route.js";
import settingRoute from "./route/setting.route.js";
import userRoute from "./route/user.route.js";

import { prisma } from "./config/prisma.js";
import { User, UserRole } from "@prisma/client";

if (env.staticVue === true) app.use(express.static("../Vue.js-Client/dist"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

import cors from "cors";

const corsOptions = {
  //origin: "http://localhost:4200",
  origin: true,
  optionsSuccessStatus: 200,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());

import * as bcrypt from "bcrypt";

bcrypt.genSalt(10, function (err, salt) {
  console.log(salt);
  console.log(JSON.stringify(salt));
});

// force: true will drop the table if it already exists
// db.sequelize.sync({ force: env.resetDatabase }).then(() => {
//   console.log("Sync with db");
//   db.callSyncCallbacks();
//   //const Util = require('./app/util/adduser');
//   //Util.createAdmin("Test", "Test", e => console.log(e));
// });

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
import { isError } from "util";
import { where } from "sequelize/types";

app.post("/api/login", async (req, res) => {
  let user: User;
  
  try {
    user = await prisma.user.findUnique({ where: { name: req.body.name } });
  } catch (e) {
    res.status(500).send('Error querying user.');
    
    return;
  }

  if (user === null) {
    res.status(401).send("User not exists");
  } else {
    let func = async (result: boolean) => {
      if (result === true) {
        res.cookie("auth", user.sessionID, {
          maxAge: 1892160000000 /*60 years*/,
          httpOnly: true,
          sameSite: false /* TODO */,
          secure: req.secure,
        });

        let userRoles: UserRole[];

        try {
          userRoles = (await prisma.user.findUnique({ where: { name: req.body.name }, include: { user_roles: true } })).user_roles;
        } catch (e) {
          res.status(500).send(e);

          return;
        }

        if (userRoles === null) {
          res.status(500).send('User roles not found')
        } else {
          res.send({ user: user, roles: userRoles });
        }
      } else {
        res.status(401).send("Wrong passord");
      }
    };

    if (user.password.indexOf("$md5$") === 0) {
      const hash = crypto.createHash("md5");
      hash.update(req.body.password);
      // right, but old password hash
      let result = user.password.substring(5) === hash.digest("hex");
      if (result) {
        const newHash = await bcrypt.hash(req.body.password, 10);
        
        try {
          await prisma.user.update({ where: { name: req.body.name }, data: { password: newHash } });

          console.log("password hash updated");
        } catch (e) {
          console.error("Error while updating password hash : " + e);
        }

        if (user.sessionID === null) {
          try {
            await prisma.user.update({ where: { name: req.body.name }, data: { sessionID: crypto.randomBytes(32).toString("hex") } });
          } catch (e) {
            res.status(500).send("Error -> " + e);
          }

          return;
        }
      }
      
      func(result);
    } else {
      const result = await bcrypt.compare(req.body.password, user.password);

      if (result && user.sessionID === null) {
        try {
          await prisma.user.update({ where: { name: req.body.name }, data: { sessionID: crypto.randomBytes(32).toString("hex") } });
          
          func(true);
        } catch (e) {
          res.status(500).send("Error -> " + e);
        }

        return;
      }

      func(result);
    }
  }
});

app.use(async (req, res, next) => {
  if (req.cookies.auth === undefined) {
    res.status(401).send("not authenticated");
    return;
  }

  let user: User;

  try {
    user = await prisma.user.findUnique({ where: { sessionID: req.cookies.auth } });

    if (user === null) {
      res.status(401).send("not authenticated");
    } else {
      const request: any = req;
      request.user = user;
      next();
    }
  } catch (e) {
    res.status(500).send("Error -> " + e);
  }
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
