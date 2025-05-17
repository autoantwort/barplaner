import { database, username, password, host, dialect, pool, databaseFile } from './env.js';
import Sequelize from 'sequelize';

const sequelize = new Sequelize(database, username, password, {
    host: host,
    dialect: dialect,
    operatorsAliases: false,

    pool: {
        max: pool.max,
        min: pool.min,
        acquire: pool.acquire,
        idle: pool.idle
    },
    benchmark: true,
    logging: null, //(e, t) => console.log(e, " time : ", t),

    storage: databaseFile
});

export {sequelize, Sequelize};
