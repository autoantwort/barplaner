var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const cors = require('cors');
const corsOptions = {
    origin: true,
    optionsSuccessStatus: 200
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
db.sequelize.sync({ force: false }).then(() => {
    console.log('Sync with db');
    db.callSyncCallbacks();
    const Util = require('./app/util/adduser');
    Util.createAdmin("Test", "Test", e => console.log(e));
    Util.createAdmin("Test2", "Test2", e => console.log(e));
});



const User = db.User;
app.post('/app/login', (req, res) => {
    User.findOne({
        where: {
            name: req.body.name
        }
    }).then(user => {
        if (user === null) {
            res.status(401).send("User not exists");
        } else {
            bcrypt.compare(req.body.password, user.password).then(result => {
                if (result === true) {
                    res.cookie('auth', user.sessionID, { httpOnly: true, sameSite: true, secure: req.secure });
                    user.getRoles().then(roles => {
                        res.send(roles)
                    }).catch(err => res.status(500).send(err));
                } else {
                    res.status(401).send("Wrong passord");
                }
            }).catch(err => res.status(500).send("Error -> " + err));
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
require('./app/route/user.route.js')(app);
require('./app/route/bar.route.js')(app);

// Create a Server
var server = app.listen(8080, function() {

    var host = server.address().address;
    var port = server.address().port;

    console.log("App listening at http://%s:%s", host, port);
});