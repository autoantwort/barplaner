const env = require('./env.js');

const Sequelize = require('sequelize');
const sequelize = new Sequelize(env.database, env.username, env.password, {
    host: env.host,
    dialect: env.dialect,
    operatorsAliases: false,

    pool: {
        max: env.max,
        min: env.pool.min,
        acquire: env.pool.acquire,
        idle: env.pool.idle
    },

    storage: env.databaseFile
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

//Models/tables
db.customers = require('../model/customer.model.js')(sequelize, Sequelize);
db.User = require('../model/user.model.js')(sequelize, Sequelize);
db.Bar = require('../model/bar.model.js')(sequelize, Sequelize);
db.Role = require('../model/role.model.js')(sequelize, Sequelize);
db.BarDuty = require('../model/barduty.model.js')(sequelize, Sequelize, db.Bar, db.User);
db.UserRoles = require('../model/userroles.model.js')(sequelize, Sequelize, db.User, db.Role);

let funcArray = [];

db.addSyncCallback = function(func) {
    funcArray.push(func);
};

db.callSyncCallbacks = function() {
    for (let func of funcArray) {
        func();
    }
};

module.exports = db;