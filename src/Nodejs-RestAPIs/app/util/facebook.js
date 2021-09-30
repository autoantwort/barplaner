import db from '../config/db.config';
import { Op } from 'sequelize';

const Axios = require("axios");
const env = require('../config/env');

const Bar = db.Bar;
const User = db.User;
const UserRoles = db.UserRoles;
const BarDuty = db.BarDuty;
const Role = db.Role;
const Setting = db.Setting;
const BarUtil = require('./addBar');

let axios = Axios.default.create({
    baseURL: "https://graph.facebook.com/v3.2",
    // headers: {
    //     "Content-type": "application/json",
    // }
});

let AccessToken = null;
let PageID = null;
let CopyEvents = null;
let FetchInterval = null;

db.addSyncCallback(() => {
    Role.findCreateFind({
        where: { name: "FacebookAdmin" },
        defaults: {
            name: "FacebookAdmin",
            description: "You can change the the settings belongs to facebook",
        },
    }).then(role => {
        role = role.name;
        Setting.findCreateFind({
            where: { name: "access-token" },
            defaults: {
                name: "access-token",
                permission: role,
                description: "The Access token to access the facebook graph api to get the events from the symposion page.",
                value: env.facebookAccessToken
            }
        }).then(s => {
            AccessToken = s[0];
            AccessToken.value = env.facebookAccessToken;
            AccessToken.save().catch(console.error);
        }).catch(console.error);
        Setting.findCreateFind({
            where: { name: "pageID" },
            defaults: {
                name: "pageID",
                permission: role,
                description: "The pageID of the symposion facebook page.",
                value: env.symposionPageID,
            }
        }).then(s => {
            PageID = s[0];
        }).catch(console.error);
        Setting.findCreateFind({
            where: { name: "copyEvents" },
            defaults: {
                name: "copyEvents",
                permission: role,
                description: "A boolean, if true, the system copy facebook events to the barplaner, if false, nothing get copied.",
                value: true
            }
        }).then(s => {
            CopyEvents = s[0];
        }).catch(console.error);
        Setting.findCreateFind({
            where: { name: "fetchInterval" },
            defaults: {
                name: "fetchInterval",
                permission: role,
                description: "The intervall, in wich the server will fetch the facebook graph api for new events.",
                value: env.facebookFetchInterval,
            }
        }).then(s => {
            FetchInterval = s[0];
        }).catch(console.error);
    }).catch(console.error);
});


exports.getFacebookEvents = () => {
    return new Promise((resolve, reject) => {
        if (AccessToken === null) {
            reject("Not in sync with db");
        } else {
            AccessToken.reload().then(() => {
                PageID.reload().then(() => {
                    axios.get(PageID.value + "/events?fields=start_time,end_time,description,id,interested_count,is_canceled,is_draft,maybe_count,name,declined_count,noreply_count,type,cover&include_canceled=true&access_token=" + AccessToken.value).then(response => {
                        resolve(response.data.data); // the events array in saved in a data property
                    }).catch(err => reject(err.response));
                });
            });
        }
    });
};

exports.syncFacebookEvents = () => {
    return new Promise((resolve, reject) => {
        exports.getFacebookEvents().then(events => {
            const now = new Date();
            Bar.findAll({
                where: {
                    start: {
                        [Op.gt]: now
                    }
                },
                order: [
                    ['start', 'ASC']
                ]
            }).then(bars => {
                for (let i = 0; i < events.length; ++i) {
                    events[i].start = new Date(events[i].start_time);
                    events[i].end = new Date(events[i].end_time);
                }
                events = events.filter(e => e.start > now).filter(e => !e.is_draft).reverse();
                if (events.length === 0) {
                    resolve();
                    return;
                }
                Setting.findByPk("defaultNumberOfPersonsToClean").then(numberSetting => {
                    let barsToCreate = [];
                    const getBarData = event => {
                        return {
                            name: event.name,
                            description: event.description,
                            start: event.start,
                            end: event.end,
                            facebookEventID: event.id,
                            facebookCoverImageURL: event.cover.source,
                            public: event.type == "public",
                            canceled: event.is_canceled,
                        };
                    };
                    // both sorted by time
                    let e = 0;
                    for (let b = 0; e < events.length && b < bars.length && events[e].start > now;) {
                        // check if on same date:
                        if (bars[b].start.getYear() === events[e].start.getYear() &&
                            bars[b].start.getMonth() === events[e].start.getMonth() &&
                            bars[b].start.getDate() === events[e].start.getDate()) {
                            // the BarUtil checks what should be updated (if any)
                            BarUtil.changeBar(bars[b], getBarData(events[e]));
                            ++b;
                            ++e;
                            // bar is older then the facebook event, skip bar
                        } else if (bars[b].start < events[e].start) {
                            ++b;
                        } else { // event is older then a bar => create bar
                            const event = events[e];
                            ++e;
                            if (event.is_draft || event.is_canceled) {
                                continue;
                            }
                            barsToCreate.push(getBarData(event));
                        }
                    }
                    for (; e < events.length; ++e) {
                        const event = events[e];
                        barsToCreate.push(getBarData(event));
                    }
                    if (barsToCreate.length > 0) {
                        // only create a new bar, if the last bar is finished, otherwise the ratio computing in the cleaning distribution breaks
                        // use fancy recursion   
                        let index = 0;
                        let createBar = () => {
                            BarUtil.addBar(barsToCreate[index], Number(numberSetting.value))
                                .then(userIDs => {
                                    console.log("Es müssen putzen : ", userIDs)
                                        ++index;
                                    if (index < barsToCreate.length) {
                                        createBar();
                                    } else {
                                        resolve();
                                    }
                                })
                                .catch(reject);
                        };
                        createBar();
                    } else {
                        resolve();
                    }


                }).catch(reject);
            }).catch(reject);
        }).catch(reject);
    });
}

let intervalID = null;
let time = 4;

exports.runFacebookSync = () => {
    if (intervalID === null) {
        intervalID = setInterval(() => {
            ++time;
            if (CopyEvents !== null) {
                // TODO every minute one db query
                CopyEvents.reload().then(() => {
                    if (CopyEvents.value == true) {
                        FetchInterval.reload().then(() => {
                            if (time >= FetchInterval.value) {
                                exports.syncFacebookEvents().catch(console.error);
                                time = 0;
                            }
                        });
                    }
                });
            }
        }, 1000 * 60); //every minute
    }
}

exports.stopFacebookSync = () => {
    if (intervalID !== null) {
        clearInterval(intervalID);
        intervalID = null;
    }
}