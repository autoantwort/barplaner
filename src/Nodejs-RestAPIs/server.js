#!/usr/bin/env node

import express from 'express';
import expressWs from 'express-ws';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import fileUpload from 'express-fileupload';
import env from './app/config/env.js';
import { Sequelize, sequelize } from "./app/config/database.js";
import db from './app/config/db.config.js';

const app = express();
const wsApp = expressWs(app);

if (env.staticVue === true)
    app.use(express.static("../Vue.js-Client/dist"));

app.use(fileUpload({ useTempFiles: false, }));
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({ extended: true }));

const corsOptions = {
    //origin: "http://localhost:4200",
    origin: true,
    optionsSuccessStatus: 200,
    credentials: true,
};
app.use(cors(corsOptions));
app.use(cookieParser());

bcrypt.genSalt(10, function (err, salt) {
    console.log(salt);
    console.log(JSON.stringify(salt));
});

// force: true will drop the table if it already exists
await sequelize.sync({ force: env.resetDatabase });
console.log('Sync with db');
db.callSyncCallbacks();

if (env.loadOldData === true) {
    const { loadOldData } = await import("./app/old_data/loadOldData.js");
    loadOldData();
}

import "./app/util/telegram.js";
import "./app/util/gitFileBrowser.js";
import "./app/util/telegramNewsletter.js";
import "./app/util/gitlab.js";
import "./app/util/studibars.js";
import "./app/util/metro.js";
import * as remoteVolumeControl from "./app/util/remoteVolumeControl.js";
import * as remoteControlPane from "./app/util/remoteControlPane.js";
import "./app/util/scanner.js";
import * as shoppingListState from "./app/util/shoppingListState.js";
import * as shoppingListText from "./app/util/shoppingListText.js";
import "./app/util/itemRequestScanner.js";
import * as ical from "./app/util/icalCalendar.js";
import { User } from './app/model/user.model.js';
import { File } from './app/model/file.model.js';

remoteVolumeControl.registerClients(app);
remoteControlPane.registerClients(app);
shoppingListState.registerWebSocketListener(app);
shoppingListText.registerWebSocketListener(app);

app.get(env.ical.urlPath, (req, res) => ical.serve(res));

if (env.webDavCalendars && env.webDavCalendars.length > 0) {
    import("./app/util/webDavCalendar.js");
}

if (env.webNotifications && env.webNotifications.vapidKeys.privateKey.length > 0) {
    const { default: webNotificationsNewsletter } = await import("./app/util/webNotificationsNewsletter.js");
    webNotificationsNewsletter(app, "/push/"); // we do not use webPush because that would be blocked by uBlock
}

app.post('/api/login', (req, res) => {
    User.findOne({
        where: Sequelize.where(Sequelize.fn('lower', Sequelize.col('name')), Sequelize.fn('lower', req.body.name)),
    }).then(user => {
        if (user === null) {
            res.status(401).send("User not exists");
        } else {
            let func = (result) => {
                if (result === true) {
                    res.cookie('auth', user.sessionID, env.authCookie ?? { maxAge: 1892160000000 /*60 years*/, httpOnly: true, sameSite: false /* TODO */, secure: req.secure });
                    user.getRoles().then(roles => {
                        res.send({ user: user, roles: roles });
                    }).catch(err => res.status(500).send(err));
                } else {
                    res.status(401).send("Wrong password");
                }
            };
            
            // old password hash from old db
            if (user.password.indexOf('$md5$') === 0) {
                const hash = crypto.createHash('md5');
                hash.update(req.body.password);
                // right, but old password hash
                let result = user.password.substr(5) === hash.digest('hex');
                if (result) {
                    bcrypt.hash(req.body.password, 10).then(function (hash) {
                        user.update({ password: hash })
                            .then(() => { console.log("password hash updated") })
                            .catch(err => console.error("Error while updating password hash : " + err));
                    });
                    if (user.sessionID === null) {
                        user.update({ sessionID: crypto.randomBytes(32).toString('hex') })
                            .then(() => { func(true) })
                            .catch(err => res.status(500).send("Error -> " + err));
                        return;
                    }
                }
                func(result);
            } else {
                bcrypt.compare(req.body.password, user.password).then(result => {
                    if (result === true && user.sessionID === null) {
                        user.update({ sessionID: crypto.randomBytes(32).toString('hex') })
                            .then(() => { func(true) })
                            .catch(err => res.status(500).send("Error -> " + err));
                        return;
                    }
                    func(result);
                }).catch(err => res.status(500).send("Error -> " + err));
            }
        }
    });
});

const user = await import('./app/controller/user.controller.js');
app.post('/api/users/sendPasswordResetLink', user.sendPasswordResetLink);
app.post('/api/users/validPasswortResetKey', user.validPasswordResetKey);
app.post('/api/users/resetPasswort', user.resetPasswort);

app.use(async (req, res, next) => {
    if (req.cookies.auth === undefined) {
        return res.status(401).send("not authenticated");
    }
    
    try {
        const user = await User.findOne({ where: { sessionID: req.cookies.auth } });
        
        if (user === null) {
            return res.status(401).send("not authenticated");
        }
        
        req.user = user;
        next();
    } catch (err) {
        res.status(500).send("Error -> " + err);
    }
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('auth', { httpOnly: true, sameSite: false /* TODO */, secure: req.secure });
    req.user.update({ sessionID: null })
        .then(() => res.send("logged out"))
        .catch(err => res.status(500).send("Error -> " + err));
});

remoteVolumeControl.registerMasters(app);
remoteControlPane.registerMasters(app);

const userRoute = await import('./app/route/user.route.js');
userRoute.default(app);

const barRoute = await import('./app/route/bar.route.js');
barRoute.default(app);

const dutyRoute = await import('./app/route/duty.route.js');
dutyRoute.default(app);

const settingRoute = await import('./app/route/setting.route.js');
settingRoute.default(app);

const positionRoute = await import('./app/route/position.route.js');
positionRoute.default(app);

const fileRoute = await import('./app/route/file.route.js');
fileRoute.default(app);

const itemRoute = await import('./app/route/item.route.js');
itemRoute.default(app);

const itemGroupRoute = await import('./app/route/itemGroup.route.js');
itemGroupRoute.default(app);

const stockChangesRoute = await import('./app/route/stockChanges.route.js');
stockChangesRoute.default(app);

const invoiceRoute = await import('./app/route/invoice.route.js');
invoiceRoute.default(app);

const itemRequestRoute = await import('./app/route/itemRequest.route.js');
itemRequestRoute.registerItemRequestsRoutes(app);

// distribute files from file db
console.log("Store at and load files from: ", env.fileStoragePath);
app.use('/api/file/:fileId', (req, res, next) => {
    // set the Content-Type header, we have this information in our database        
    File.findByPk(req.params.fileId).then(file => {
        if (file === null) {
            res.status(404).send("The file with id " + req.params.fileId + " does not exists");
        } else {
            res.setHeader("Content-Type", file.mimeType);
            next();
        }
    });
});

app.use('/api/file/', express.static(env.fileStoragePath, {
    maxAge: 1000 * 60 * 60 * 24 * 365 * 10 /*10 years*/,
    index: false,
}));

// Create a Server
var server = app.listen(8080, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("App listening at http://%s:%s", host.indexOf(':') !== -1 ? `[${host}]`: host, port);
});
