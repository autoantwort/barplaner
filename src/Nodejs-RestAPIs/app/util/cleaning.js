import { sequelize, Sequelize } from '../config/database.js';
const Op = Sequelize.Op;
import { Bar } from '../model/bar.model.js';
import { Barduty } from '../model/barduty.model.js';
import { Setting } from '../model/setting.model.js';
import { User } from '../model/user.model.js';

// Post a Bar
export function computeCleaning(barID, numberOfPersons) {
    return new Promise((resolve, reject) => {
        let what = 0;
        //console.log("---------------", ++what, "---------------");
        Bar.findByPk(barID).then(bar => {
            //console.log("---------------", ++what, "---------------");
            User.findAll({ where: { active: true }, raw: true }).then(users => {
                // es können users.length viele Leute putzen, wenn jedes mal 
                // numberOfPersons viele putzen, sollte man users.length/numberOfPersons * 3/7
                // oft erstmal nicht mehr putzen müssen
                let wieOftNicht = Math.round(users.length / numberOfPersons * 3 / 7);
                //console.log("wieOftNicht", wieOftNicht);
                //console.log("---------------", ++what, "---------------");
                Bar.findAll({
                    where: {
                        start: {
                            [Op.lt]: bar.start
                        }
                    },
                    limit: wieOftNicht,
                    order: [
                        ['start', 'DESC']
                    ]
                }).then(bars => {
                    //console.log("---------------", ++what, "---------------");
                    //console.log("last bars", bars);
                    let barIDs = bars.map(b => b.id);
                    barIDs.push(barID);
                    //console.log("---------------", ++what, "---------------");
                    Barduty.findAll({
                        where: {
                            barID: {
                                [Op.in]: barIDs
                            }
                        }
                    }).then(duties => {
                        //console.log("---------------", ++what, "---------------");
                        let experienced_cleaner_present = false;
                        // vielleicht putzen ja schon welche
                        //console.log("---------------", ++what, "---------------");
                        duties.forEach(duty => {
                            if (duty.have_to_clean && duty.barID === barID) {
                                --numberOfPersons;
                                for (const user of users) {
                                    if (user.id === duty.userID) {
                                        experienced_cleaner_present |= user.experienced_cleaner;
                                        break;
                                    }
                                }
                            }
                        });
                        //console.log("---------------", ++what, "---------------");
                        let newUsers = users.slice();
                        // wen dürfen wir nicht mehr auswählen?
                        for (let i = 0; i < users.length; ++i) {
                            // wer hat die letzten bars schon mal geputzt?
                            if (duties.some(r => r.have_to_clean && r.userID === users[i].id))
                                newUsers[i] = undefined;
                        }
                        //console.log("---------------", ++what, "---------------");
                        newUsers = newUsers.filter(r => r !== undefined);
                        // es gibt genung
                        if (newUsers.length >= numberOfPersons) {
                            users = newUsers;
                        }
                        //console.log("---------------", ++what, "---------------");
                        //console.log("users", users);
                        // es gibt genau richtig viele
                        if (newUsers.length === numberOfPersons) {
                            //console.log("---------------", ++what, "---------------");
                            Barduty.update({ have_to_clean: true }, {
                                where: {
                                    userID: {
                                        [Op.in]: users.map(u => u.id),
                                    },
                                    barID: barID,
                                }
                            }).then(() => resolve(users.map(u => u.id))).catch(reject);;
                        } else {
                            //console.log("---------------", ++what, "---------------");
                            Barduty.findAll({
                                attributes: ['userID', [sequelize.fn('count', sequelize.col('userID')), "count"]],
                                group: "userID",
                                raw: true
                            }).then(barCount => {
                                //console.log("---------------", ++what, "---------------");
                                Barduty.findAll({
                                    attributes: ['userID', [sequelize.fn('COUNT', sequelize.col('userID')), "count"]],
                                    where: {
                                        have_to_clean: true
                                    },
                                    group: "userID",
                                    raw: true,
                                }).then(barCleanedCount => {
                                    //console.log("---------------", ++what, "---------------");
                                    let ver = {};
                                    for (let b of barCount) {
                                        ver[b.userID] = { count: b.count };
                                    }
                                    for (let b of barCleanedCount) {
                                        ver[b.userID]['cleaned'] = b.count;
                                        ver[b.userID]['ratio'] = ver[b.userID].count / (b.count + 1);
                                    }
                                    //console.log("---------------", ++what, "---------------");
                                    for (let i = 0; i < users.length; ++i) {
                                        // hat noch nie an einer Bar teilgenommen
                                        if (ver[users[i].id] === undefined) {
                                            users[i].cleaned = 0;
                                            users[i].ratio = 0;
                                            users[i].count = 0;
                                        }
                                        // haben noch nie geputzt
                                        else if (ver[users[i].id].cleaned === undefined) {
                                            users[i].cleaned = 0;
                                            users[i].ratio = ver[users[i].id].count;
                                            users[i].count = ver[users[i].id].count;
                                        } else {
                                            users[i].ratio = ver[users[i].id].ratio;
                                            users[i].cleaned = ver[users[i].id].cleaned;
                                            users[i].count = ver[users[i].id].count;
                                        }
                                    }
                                    //console.log("---------------", ++what, "---------------");
                                    users.sort((l, r) => { return -(l.ratio - r.ratio) });
                                    let userIDs = [];
                                    // einen erfahrenen putzter hinzufügen wenn noch nicht vorhanden
                                    //console.log("---------------", ++what, "---------------");
                                    if (experienced_cleaner_present === false) {
                                        for (let i = 0; i < users.length; ++i) {
                                            if (users[i].experienced_cleaner) {
                                                userIDs.push(users[i].id);
                                                //console.log("experienced_cleaner : ", users[i]);
                                                users[i] = undefined;
                                                --numberOfPersons;
                                                break;
                                            }
                                        }
                                    }
                                    //console.log("---------------", ++what, "---------------");
                                    // weitere putzter hinzufügen bis wir genug leute haben die putzen
                                    if (numberOfPersons > 0) {
                                        for (const user of users) {
                                            if (user !== undefined) {
                                                userIDs.push(user.id);
                                                --numberOfPersons;
                                                if (numberOfPersons === 0) {
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    //console.log("---------------", ++what, "---------------");
                                    Barduty.update({ have_to_clean: true }, {
                                        where: {
                                            userID: {
                                                [Op.in]: userIDs
                                            },
                                            barID: barID,
                                        }
                                    }).then(() => {
                                        //console.log("---------------", ++what, "---------------");
                                        resolve(userIDs);
                                    }).catch(reject);
                                }).catch(reject);
                            }).catch(reject);
                        }
                    }).catch(reject);;
                }).catch(reject);;
            }).catch(reject);;
        }).catch(reject);;
    });
}

export function computeRatio() {
    return new Promise((resolve, reject) => {
        User.findAll({ where: { active: true }, raw: true }).then(users => {


            Barduty.findAll({
                attributes: ['userID', [sequelize.fn('count', sequelize.col('userID')), "count"]],
                group: "userID",
                raw: true
            }).then(barCount => {
                Barduty.findAll({
                    attributes: ['userID', [sequelize.fn('COUNT', sequelize.col('userID')), "count"]],
                    where: {
                        have_to_clean: true
                    },
                    group: "userID",
                    raw: true,
                }).then(barCleanedCount => {
                    let ver = {};
                    for (let b of barCount) {
                        ver[b.userID] = { count: b.count };
                    }
                    for (let b of barCleanedCount) {
                        ver[b.userID]['cleaned'] = b.count;
                        ver[b.userID]['ratio'] = ver[b.userID].count / (b.count + 1);
                    }
                    for (let i = 0; i < users.length; ++i) {
                        // hat noch nie an einer Bar teilgenommen
                        if (ver[users[i].id] === undefined) {
                            users[i].cleaned = 0;
                            users[i].ratio = 0;
                            users[i].count = 0;
                        }
                        // haben noch nie geputzt
                        else if (ver[users[i].id].cleaned === undefined) {
                            users[i].cleaned = 0;
                            users[i].ratio = ver[users[i].id].count;
                            users[i].count = ver[users[i].id].count;
                        } else {
                            users[i].ratio = ver[users[i].id].ratio;
                            users[i].cleaned = ver[users[i].id].cleaned;
                            users[i].count = ver[users[i].id].count;
                        }
                    }
                    users.sort((l, r) => { return -(l.ratio - r.ratio) });
                    Setting.findByPk("defaultNumberOfPersonsToClean").then(numberSetting => {
                        let wieOftNicht = Math.round(users.length / Number(numberSetting.value) * 3 / 7);
                        resolve({ users: users, howOftenNot: wieOftNicht });
                    }).catch(reject);
                }).catch(reject);
            }).catch(reject);
        }).catch(reject);
    });

}
