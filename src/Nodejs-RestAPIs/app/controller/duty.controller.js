const db = require('../config/db.config.js');
const Util = require('../util/cleaning');
const Bar = db.Bar;
const User = db.User;
const BarDuty = db.BarDuty;
const sequelize = db.sequelize;
const Role = db.Role;
const UserRoles = db.UserRoles;



// Update a Bar
exports.list = (req, res) => {
    Util.computeRatio().then((users) => {
        res.send(users);
    }).catch(err => {
        console.error(err);
        res.status(500).send("Error -> " + err);
    });
};