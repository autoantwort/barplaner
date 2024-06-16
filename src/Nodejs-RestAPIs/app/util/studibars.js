const db = require('../config/db.config.js');
const Axios = require("axios");
const CronJob = require('cron').CronJob;

const Bar = db.Bar;
const Setting = db.Setting;
const Sequelize = db.Sequelize;
const BarUtil = require('./addBar.js');

let axios = Axios.create({
    baseURL: "https://studibars-ac.de/api",
});

let lastUpdated = new Date(0);

const eventToBar = event => {
    return {
        name: event.name,
        description: event.description,
        start: new Date(event.start_date),
        end: event.end ? new Date(event.end_date) : null,
        studibarsEventId: event.id,
        studibarsEventPosterURL: event.poster,
        public: false,
    };
};

exports.syncStudibarsEvents = async () => {
    const previousLastUpdated = lastUpdated;
    lastUpdated = new Date();
    let in4Weeks = new Date();
    in4Weeks.setDate(in4Weeks.getDate() + 28);
    const response = await axios.get("/events?bar__name__iexact=symposion&updated_at__gt=" + previousLastUpdated.toISOString() + "&start_date__lte=" + in4Weeks.toISOString());
    const events = response.data;
    let numberPersonsClean = null;
    for (const event of events) {
        const bar = await Bar.findOne({ where: { studibarsEventId: event.id } })
        if (bar) {
            if (bar.updatedAt < new Date(event.updated_at)) {
                await BarUtil.changeBar(bar, eventToBar(event));
            }
        } else {
            const startDate = new Date(event.start_date).toISOString().split('T')[0];
            const bars = await Bar.findAll({ where: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('start')), startDate) })
            if (bars.length === 1) {
                await BarUtil.changeBar(bars[0], eventToBar(event));
            } else if (bars.length === 0) {
                numberPersonsClean = numberPersonsClean || await Setting.findByPk("defaultNumberOfPersonsToClean");
                await BarUtil.addBar(eventToBar(event), numberPersonsClean.value);
            } else {
                console.warn("syncStudibarsEvents: Multiple bars on the same day. Can not match event to bar: " + JSON.stringify(event));
            }
        }
    }
};

const everyMinute = new CronJob('0,15,30,45 * * * * *', function () {
    exports.syncStudibarsEvents().catch(console.error);
}, null, true);
