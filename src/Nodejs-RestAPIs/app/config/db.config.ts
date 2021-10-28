import env from "./env.js";

import { Sequelize } from "sequelize-typescript";
import Bar from "../model/bar.model.js";
import Role from "../model/role.model.js";

interface Database {
  sequelize?: Sequelize;
  Wordpress?: Sequelize;
  User?: any;
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

  pool: env.pool,
  benchmark: true,
  logging: (e, t) => console.log(e.substr(0, 500), " time : ", t),

  storage: env.databaseFile,
});

sequelize.addModels([Bar, Role]);

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

// Models/tables
db.User = require("../model/user.model.js")(sequelize, Sequelize);
db.BarDuty = require("../model/barduty.model.js")(
  sequelize,
  Sequelize,
  Bar,
  db.User
);
db.UserRoles = require("../model/userroles.model.js")(
  sequelize,
  Sequelize,
  db.User,
  Role
);
db.Setting = require("../model/setting.model.js")(sequelize, Sequelize, Role);
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
