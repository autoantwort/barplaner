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
    benchmark: true,
    logging: (e, t) => console.log(e.substr(0, 500), " time : ", t),

    storage: env.databaseFile
});

const wordpressDB = new Sequelize(env.wordpress.database, env.wordpress.username, env.wordpress.password, {
    host: env.wordpress.host,
    dialect: env.wordpress.dialect,
    logging: (e, t) => {},
});
wordpressDB
    .authenticate()
    .then(() => {
        console.log('Connection to the wordpress database has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the wordpress database:', err);
    });

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Wordpress = wordpressDB;

//Models/tables
db.User = require('../model/user.model.js')(sequelize, Sequelize);
db.Bar = require('../model/bar.model.js')(sequelize, Sequelize);
db.Role = require('../model/role.model.js')(sequelize, Sequelize);
db.BarDuty = require('../model/barduty.model.js')(sequelize, Sequelize, db.Bar, db.User);
db.UserRoles = require('../model/userroles.model.js')(sequelize, Sequelize, db.User, db.Role);
db.Setting = require('../model/setting.model.js')(sequelize, Sequelize, db.Role);
db.ShouldDelete = require('../model/shouldDelete.model.js')(sequelize, Sequelize);
db.TelegramNewsletter = require('../model/telegramNewsletter.model')(sequelize, Sequelize);
db.WebPushSubscription = require('../model/webPushSubscription.model')(sequelize, Sequelize);

db.Survey = require('../model/survey.model.js')(sequelize, Sequelize, db.User);
db.Question = require('../model/question.model.js')(sequelize, Sequelize, db.Survey);
db.Answer = require('../model/answer.model.js')(sequelize, Sequelize, db.User, db.Question);

db.File = require('../model/file.model.js')(sequelize, Sequelize);
db.Image = require('../model/image.model.js')(sequelize, Sequelize, db.File);
db.stock = {};
db.stock.Position = require('../model/stockManagement/position.model')(sequelize, Sequelize, db.Image);
db.stock.ItemGroup = require('../model/stockManagement/itemGroup.model')(sequelize, Sequelize, db.stock.Position);
db.stock.Item = require('../model/stockManagement/item.model')(sequelize, Sequelize, db.Image, db.stock.ItemGroup, db.stock.Position);
db.stock.Invoice = require('../model/stockManagement/invoice.model')(sequelize, Sequelize, db.File);
db.stock.InvoiceEntry = require('../model/stockManagement/invoiceEntry.model')(sequelize, Sequelize, db.stock.Invoice, db.stock.Item);
db.stock.Change = require('../model/stockManagement/change.model')(sequelize, Sequelize, db.stock.Item, db.User, db.stock.InvoiceEntry);


let funcArray = [];

db.addSyncCallback = function(func) {
    if (funcArray === null)
        func();
    else
        funcArray.push(func);
};

db.callSyncCallbacks = function() {
    for (let func of funcArray) {
        func();
    }
    funcArray = null;
};

module.exports = db;