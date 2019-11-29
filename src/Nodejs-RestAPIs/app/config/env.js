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
    databaseFile: 'data.sqlite',
    facebookAccessToken: 'Your access token',
    symposionPageID: 'Facebook site id',
    facebookFetchInterval: '5',
    telegramAccessToken: 'Your access token',
    resetDatabase: true,
    loadOldData: true,
    baseURL: "http://localhost:8080",
    staticVue: false,
    gitLabAccessToken: 'Your gitlab access token',
    gitLabBrowser: {
        host: "git.rwth-aachen.de",
        projectId: "31804",
        convertedToPdf: ["doc", "docx", "odt", "wbk", "md"],
        jobName: "docToPdf",
    },
    wordpress: {
        database: 'wordpress',
        username: 'barplaner2',
        password: '***',
        host: '***',
        dialect: 'mysql',
    },
};

module.exports = env;