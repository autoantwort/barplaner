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
    facebookAccessToken: '', // Insert your access token
    symposionPageID: 'Facebook site id',
    facebookFetchInterval: '5',
    telegramAccessToken: '', // Insert your access token (Create bot here: https://t.me/botfather)
    resetDatabase: false,
    loadOldData: false,
    baseURL: "http://localhost:8080",
    frontendURL: "http://localhost:4200",
    staticVue: false,
    gitLabAccessToken: '', // Insert your access token (Create access token here: https://git.rwth-aachen.de/-/profile/personal_access_tokens)
    gitLabSymposionGroupId: 15812,
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
    fileStoragePath: __dirname + '/../../../../webserver/files/',
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
    webNotifications: {
        contact: "mailto:bar@hilton.rwth-aachen.de",
        vapidKeys: { // in the src/Nodejs-RestAPIs folder execute "node_modules/web-push/src/cli.js generate-vapid-keys --json" to generate the keys
            "publicKey": "",
            "privateKey": ""
        },
        sendDaysBefore: [0, 1], // wie viel Tage vorher senden
        sendTime: 20, // um wie viel Uhr senden
    },
    mailServer: {
        host: 'mail.hilton.rwth-aachen.de',
        port: 587, // or 25, or any other port your SMTP server uses
        secure: false, // true for 465, false for other ports
        auth: {
            user: 'noreply@hilton.rwth-aachen.de',
            pass: '***'
        }
    },
    mqtt: {
        url: 'mqtt://mqtt.hilton.rwth-aachen.de',
        username: 'barplaner',
        password: '***',
    },
};

module.exports = env;