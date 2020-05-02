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
    ical: {
        urlPath: '/publicEvents.ics', // the path on the server
        domain: 'symposion-aachen.com',
        prodId: { company: 'hilton.rwth-aachen.de', product: 'Symposion Bar' },
        name: 'Symposion Bar Events',
        ttl: 60 * 60 * 24, // time to live: one day
        oldestEvent: 90, // days, the oldest event in the calendar is x days in the past
        organizer: { // organizer of the events
            name: 'Symposion BarAG',
            email: 'bar@hilton.rwth-aachen.de',
        },
        geo: { // position of the events
            lat: 50.78254777841156,
            lon: 6.076405048370362,
        },
        // location: "Turmstraße 1, 52072 Aachen, Germany", // or use appleLocation
        appleLocation: { // or use location
            title: "Symposion",
            address: "Turmstraße 1, 52072 Aachen, Germany",
            radius: 10,
            geo: {
                lat: 50.78254777841156,
                lon: 6.076405048370362,
            },
        },
    },
    /*webDavCalendars: [{ // you can add multiple accounts
        url: "https://cloud.hilton.rwth-aachen.de/remote.php/dav/calendars/symposion",
        calendarName: "Personal",
        auth: {
            username: "symposion",
            password: "",
        }
    }],*/
};

module.exports = env;