const env = require("./env.js");

import { Sequelize } from "sequelize";

interface Database {
  sequelize?: Sequelize;
  Wordpress?: Sequelize;
  User?: any;
  Bar?: any;
  Role?: any;
  BarDuty?: any;
  UserRoles?: any;
  Setting?: any;
  ShouldDelete?: any;
  TelegramNewsletter?: any;
  WebPushSubscription?: any;
  Survey?: any;
  Question?: any;
  Answer?: any;
  addSyncCallback?: (func: any) => any;
  callSyncCallbacks?: () => void;
}

const sequelize = new Sequelize(env.database, env.username, env.password, {
  host: env.host,
  dialect: env.dialect,

  pool: {
    max: env.max,
    min: env.pool.min,
    acquire: env.pool.acquire,
    idle: env.pool.idle,
  },
  benchmark: true,
  logging: (e, t) => console.log(e.substr(0, 500), " time : ", t),

  storage: env.databaseFile,
});

const wordpressDB = new Sequelize(
  env.wordpress.database,
  env.wordpress.username,
  env.wordpress.password,
  {
    host: env.wordpress.host,
    dialect: env.wordpress.dialect,
    logging: (e, t) => {},
  }
);

wordpressDB
  .authenticate()
  .then(() => {
    console.log(
      "Connection to the wordpress database has been established successfully."
    );
  })
  .catch((err) => {
    console.error("Unable to connect to the wordpress database:", err);
  });

const db: Database = {};

db.sequelize = sequelize;
db.Wordpress = wordpressDB;

//Models/tables
db.User = require("../model/user.model.js")(sequelize, Sequelize);
db.Bar = require("../model/bar.model.js")(sequelize, Sequelize);
db.Role = require("../model/role.model.js")(sequelize, Sequelize);
db.BarDuty = require("../model/barduty.model.js")(
  sequelize,
  Sequelize,
  db.Bar,
  db.User
);
db.UserRoles = require("../model/userroles.model.js")(
  sequelize,
  Sequelize,
  db.User,
  db.Role
);
db.Setting = require("../model/setting.model.js")(
  sequelize,
  Sequelize,
  db.Role
);
db.ShouldDelete = require("../model/shouldDelete.model.js")(
  sequelize,
  Sequelize
);
db.TelegramNewsletter = require("../model/telegramNewsletter.model")(
  sequelize,
  Sequelize
);
db.WebPushSubscription = require("../model/webPushSubscription.model")(
  sequelize,
  Sequelize
);

let funcArray = [];

db.addSyncCallback = function (func) {
  if (funcArray === null) func();
  else funcArray.push(func);
};

db.callSyncCallbacks = function () {
  for (let func of funcArray) {
    func();
  }
  funcArray = null;
};

export default db;
