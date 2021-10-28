import env from "./env.js";

export default {
  development: {
    username: env.username,
    password: env.database,
    database: env.database,
    host: env.host,
    dialect: env.dialect,
    storage: env.databaseFile,
    operatorsAliases: false,
  },
  production: {
    username: env.username,
    password: env.database,
    database: env.database,
    host: env.host,
    dialect: env.dialect,
    storage: env.databaseFile,
    operatorsAliases: false,
  },
};
