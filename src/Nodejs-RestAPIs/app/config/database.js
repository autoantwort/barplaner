import env from './env.js';
import Sequelize from 'sequelize';

const sequelize = new Sequelize(env.database, env.username, env.password, {
    host: env.host,
    dialect: env.dialect,
    operatorsAliases: false,

    pool: {
        max: env.pool.max,
        min: env.pool.min,
        acquire: env.pool.acquire,
        idle: env.pool.idle
    },
    benchmark: true,
    logging: null, //(e, t) => console.log(e, " time : ", t),

    storage: env.databaseFile
});

export {sequelize, Sequelize};
