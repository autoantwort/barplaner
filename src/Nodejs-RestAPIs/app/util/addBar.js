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

const barAddedListener = [];
const barChangedListener = [];

exports.addBar = (barData, numberOfPersonsToClean) => {
    return new Promise((resolve, reject) => {
        Bar.create(barData).then(bar => {
            Newsletter.sendEmailForBar(bar);
            User.findAll({
                where: {
                    active: true
                }
            }).then(users => {
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
                        barAddedListener.forEach(c => c(bar));
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

exports.onBarAdded = callback => barAddedListener.push(callback);

/**
 * Must be called to change a bar object. Checks if there are changes and do 
 * additional things like changing newsletters, deleting bar duties, ...
 * 
 * @param {Bar} barObject the bar model instance 
 * @param {object} newBarData the new bar data with the same fields as the bar model instance
 */
exports.changeBar = async (barObject, newBarData) => {
    if (!barObject.canceled && newBarData.canceled) {
        // if the bar was cancelled, delete all bar duties
        BarDuty.destroy({
            where: {
                barID: barObject.id,
            }
        });
    }
    for (let p in newBarData) {
        barObject[p] = newBarData[p];
    }
    // if the previous for loop changed a property
    if (barObject.changed()) {
        await barObject.save();
        // update the email newsletter
        Newsletter.sendEmailForBar(barObject);
        barChangedListener.forEach(c => c(barObject));
    }
};

exports.onBarChanged = callback => barChangedListener.push(callback);