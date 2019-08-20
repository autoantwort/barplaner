const env = require('./env.js');

console.log(env)
const config = {
    "development": {
        "username": env.username,
        "password": env.database,
        "database": env.database,
        "host": env.host,
        "dialect": env.dialect,
        "storage": env.databaseFile,
        "operatorsAliases": false
    },
    "production": {
        "username": env.username,
        "password": env.database,
        "database": env.database,
        "host": env.host,
        "dialect": env.dialect,
        "storage": env.databaseFile,
        "operatorsAliases": false
    }
};

module.exports = config;