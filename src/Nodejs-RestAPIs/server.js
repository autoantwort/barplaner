#!/usr/bin/env node

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var env = require('./app/config/env');

if (env.staticVue === true)
    app.use(express.static("../Vue.js-Client/dist"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const cors = require('cors');
const corsOptions = {
    //origin: "http://localhost:4200",
    origin: true,
    optionsSuccessStatus: 200,
    credentials: true,

};
app.use(cors(corsOptions));
app.use(cookieParser());

const db = require('./app/config/db.config.js');
const bcrypt = require('bcrypt');
bcrypt.genSalt(10, function(err, salt) {
    console.log(salt);
    console.log(JSON.stringify(salt));
});

// force: true will drop the table if it already exists
db.sequelize.sync({ force: env.resetDatabase }).then(() => {
    console.log('Sync with db');
    db.callSyncCallbacks();
    //const Util = require('./app/util/adduser');
    //Util.createAdmin("Test", "Test", e => console.log(e));
});
if (env.loadOldData === true)
    require("./app/old_data/loadOldData").loadOldData();

if (typeof env.facebookAccessToken === "string" && env.facebookAccessToken.length > 0 &&
    typeof env.symposionPageID === "string" && env.symposionPageID.length > 0) {
    require("./app/util/facebook").runFacebookSync();
}
require("./app/util/telegram");
require("./app/util/gitlab");

const crypto = require('crypto');

const User = db.User;
app.post('/api/login', (req, res) => {
    User.findOne({
        where: {
            name: req.body.name
        }
    }).then(user => {
        if (user === null) {
            res.status(401).send("User not exists");
        } else {
            let func = (result) => {
                if (result === true) {
                    res.cookie('auth', user.sessionID, { maxAge: 1892160000000 /*60 years*/ , httpOnly: true, sameSite: false /* TODO */ , secure: req.secure });
                    user.getRoles().then(roles => {
                        res.send({ user: user, roles: roles });
                    }).catch(err => res.status(500).send(err));
                } else {

                    res.status(401).send("Wrong passord");
                }
            };
            // old password hash from old db
            if (user.password.indexOf('$md5$') === 0) {
                const hash = crypto.createHash('md5');
                hash.update(req.body.password);
                // right, but old password hash
                let result = user.password.substr(5) === hash.digest('hex');
                if (result) {
                    bcrypt.hash(req.body.password, 10).then(function(hash) {
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
require('./app/route/customer.route.js')(app);
app.use((req, res, next) => {
    if (req.cookies.auth === undefined) {
        res.status(401).send("not authenticated");
        return;
    }
    User.findOne({ where: { sessionID: req.cookies.auth } }).then(user => {
        if (user === null) {
            res.status(401).send("not authenticated");
        } else {
            req.user = user;
            next();
        }
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
});
app.post('/api/logout', (req, res) => {
    res.clearCookie('auth', { httpOnly: true, sameSite: false /* TODO */ , secure: req.secure });
    req.user.update({ sessionID: null })
        .then(() => res.send("logged out"))
        .catch(err => releaseEvents.status(500).send("Error -> " + err));
});
require('./app/route/user.route.js')(app);
require('./app/route/bar.route.js')(app);
require('./app/route/duty.route.js')(app);
require('./app/route/setting.route.js')(app);
require('./app/route/survey.route.js')(app);

// Create a Server
var server = app.listen(8080, function() {

    var host = server.address().address;
    var port = server.address().port;

    console.log("App listening at http://%s:%s", host, port);
});