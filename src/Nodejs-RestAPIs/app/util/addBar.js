const db = require('../config/db.config.js');
const TelegramBarFeedback = require('./telegramBarFeedback');
const Newsletter = require('./newsletter.js');
const Axios = require("axios");

const Bar = db.Bar;
const User = db.User;
const UserRoles = db.UserRoles;
const BarDuty = db.BarDuty;
const Role = db.Role;
const Setting = db.Setting;
const Op = db.Sequelize.Op;
const Util = require('../util/cleaning');

exports.addBar = (barData, numberOfPersonsToClean) => {
    return new Promise((resolve, reject) => {
        Bar.create(barData).then(bar => {
            Newsletter.sendEmailForBar(bar);
            User.findAll({
                where: {
                    active: true
                }
            }).then(users =>  {
                for (let i = 0; i < users.length; ++i) {
                    users[i] = {
                        barID: bar.id,
                        userID: users[i].id,
                    };
                }
                BarDuty.bulkCreate(users).then(() => {
                    console.log("## numberOfPersonsToClean", numberOfPersonsToClean);
                    if (numberOfPersonsToClean !== undefined && numberOfPersonsToClean > 0) {
                        Util.computeCleaning(bar.id, numberOfPersonsToClean)
                            .then(userIDs => {
                                TelegramBarFeedback.barAdded(bar);
                                resolve(userIDs);
                            })
                            .catch(reject);
                    } else {
                        TelegramBarFeedback.barAdded(bar);
                        resolve(bar);
                    }
                }).catch(err => {
                    reject(err);
                });
            }).catch(err => {
                reject(err);
            });
        }).catch(err => {
            reject(err);
        });
    });
};