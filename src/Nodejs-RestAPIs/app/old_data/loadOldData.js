var fs = require('fs');
const db = require("../config/db.config");

exports.loadOldData = function() {
    db.addSyncCallback(() => {
        fs.readFile(__dirname + '/user.json', 'utf8', function(err, data) {
            if (err) throw err; // we'll not consider error handling for now
            let users = JSON.parse(data);
            let userRoles = [];
            for (let i = 0; i < users.length; ++i) {
                users[i].id += 5;
                users[i].active = users[i].aktive === 1;
                if (users[i].handy.length > users[i].tel.length)
                    users[i].phone = users[i].handy;
                else
                    users[i].phone = users[i].tel;
                if (users[i].userlevl === 3) {
                    userRoles.push({ userId: users[i].id, roleName: "CleaningAdmin" });
                } else if (users[i].userlevl === 4) {
                    userRoles.push({ userId: users[i].id, roleName: "CleaningAdmin" });
                    userRoles.push({ userId: users[i].id, roleName: "BarAdmin" });
                    userRoles.push({ userId: users[i].id, roleName: "UserAdmin" });
                }
                users[i].password = '$md5$' + users[i].password;
                users[i].birthday = users[i].bday;
            }
            db.User.bulkCreate(users).then(() => {

                db.UserRoles.bulkCreate(userRoles)
                    .then(() => console.log("Added User Roles!"))
                    .catch(console.error);

                fs.readFile(__dirname + '/bars.json', 'utf8', function(err, data) {
                    if (err) throw err; // we'll not consider error handling for now
                    let bars = JSON.parse(data);
                    for (let i = 0; i < bars.length; ++i) {
                        bars[i].start = new Date(bars[i].time * 1000);
                        bars[i].description = bars[i].kommentar;
                    }
                    db.Bar.bulkCreate(bars).then(() => {

                        fs.readFile(__dirname + '/bardienst.json', 'utf8', function(err, data) {
                            if (err) throw err; // we'll not consider error handling for now
                            let obj = JSON.parse(data);
                            let status = ['no_info', 'absent', 'present'];
                            for (let i = 0; i < obj.length; ++i) {
                                obj[i].state = status[obj[i].status];
                                obj[i].job = obj[i].was === 0 ? "Biertheke" : "Cocktailtheke";
                                obj[i].have_to_clean = obj[i].putzen.length !== 0;
                                obj[i].from = obj[i].von;
                                obj[i].to = obj[i].bis;
                                obj[i].userID += 5;
                                if (!bars.some(b => b.id === obj[i].barID)) {
                                    //console.error("keine Bar für ID + " + obj[i].barID);
                                    delete obj[i];
                                    continue;
                                }
                                if (!users.some(b => b.id === obj[i].userID)) {
                                    //console.error("kein User für ID + " + obj[i].userID);
                                    delete obj[i];
                                }
                            }
                            obj = obj.filter(e => e !== undefined);

                            db.BarDuty.bulkCreate(obj).then(() => {

                                console.log("success!");

                            }).catch(err => {
                                console.error(Object.keys(err));
                                console.error("ERROR _> " + err.name);
                            });
                        });

                    }).catch(err => {
                        console.error(Object.keys(err));
                        console.error(err.errors);
                    });
                });

            }).catch(err => console.error(err));
        });
    });
}