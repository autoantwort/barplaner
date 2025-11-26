import Axios from "axios";
import { CronJob } from 'cron';
import WebSocket from 'ws';
import { Bar } from "../model/bar.model.js";
import { Setting } from "../model/setting.model.js";
import { changeBar, addBar } from './addBar.js';
import { Sequelize } from "../config/database.js";

let axios = Axios.create({
    baseURL: "https://studibars-ac.de/api",
});

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

export async function syncStudibarsEvents() {
    let in4Weeks = new Date();
    in4Weeks.setDate(in4Weeks.getDate() + 28);
    const response = await axios.get("/events?bar__name__iexact=symposion&start_date__lte=" + in4Weeks.toISOString());
    const events = response.data;
    let numberPersonsClean = null;
    for (const event of events) {
        const bar = await Bar.findOne({ where: { studibarsEventId: event.id } })
        if (bar) {
            if (bar.updatedAt < new Date(event.updated_at)) {
                await changeBar(bar, eventToBar(event));
            }
        } else {
            const startDate = new Date(event.start_date).toISOString().split('T')[0];
            const bars = await Bar.findAll({ where: Sequelize.where(Sequelize.fn('DATE', Sequelize.col('start')), startDate) })
            if (bars.length === 1) {
                await changeBar(bars[0], eventToBar(event));
            } else if (bars.length === 0) {
                numberPersonsClean = numberPersonsClean || await Setting.findByPk("defaultNumberOfPersonsToClean");
                await addBar(eventToBar(event), numberPersonsClean.value);
            } else {
                console.warn("syncStudibarsEvents: Multiple bars on the same day. Can not match event to bar: " + JSON.stringify(event));
            }
        }
    }
}

const wssUrl = 'wss://studibars-ac.de/api/bar/1/events/subscribe';


let ws;
let reconnectInterval = 1000; // Start with a 1-second interval

// Import changes after they happened
function connectWebSocket() {
    ws = new WebSocket(wssUrl, { followRedirects: true });

    ws.on('open', function open() {
        reconnectInterval = 1000; // Reset the reconnect interval on successful connection
    });

    ws.on('message', function incoming(data) {
        syncStudibarsEvents().catch(console.error);
    });

    ws.on('close', attemptReconnect);
    ws.on('error', (error) => console.error('studibars.de WebSocket error:', error));
}

// Function to handle reconnection attempts
function attemptReconnect() {
    setTimeout(() => {
        reconnectInterval = Math.min(reconnectInterval * 2, 30000); // Exponential backoff, max 30 seconds
        connectWebSocket();
    }, reconnectInterval);
}

connectWebSocket();

const everyMinute = new CronJob('0 0 0 * * *', function () { // Every day at midnight
    syncStudibarsEvents().catch(console.error);
}, null, true);
