const env = {
    database: 'bardaten',
    username: 'node_code',
    password: 'password',
    host: 'localhost',
    dialect: 'sqlite',
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    databaseFile: 'data.sqlite'
};

module.exports = env;