import env, { username, database, host, dialect, databaseFile } from './env.js';

console.log(env)
const config = {
    "development": {
        "username": username,
        "password": database,
        "database": database,
        "host": host,
        "dialect": dialect,
        "storage": databaseFile,
        "operatorsAliases": false
    },
    "production": {
        "username": username,
        "password": database,
        "database": database,
        "host": host,
        "dialect": dialect,
        "storage": databaseFile,
        "operatorsAliases": false
    }
};

export default config;