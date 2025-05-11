import { Bar, User, UserRoles, BarDuty, Role, Setting, Sequelize } from '../config/db.config.js';
import { barAdded } from './telegramBarFeedback';
import { sendEmailForBar } from './newsletter.js';

const Op = Sequelize.Op;
import { computeCleaning } from '../util/cleaning';

const barAddedListener = [];
const barChangedListener = [];

export function addBar(barData, numberOfPersonsToClean) {
    return new Promise((resolve, reject) => {
        Bar.create(barData).then(bar => {
            sendEmailForBar(bar);
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
                        computeCleaning(bar.id, numberOfPersonsToClean)
                            .then(userIDs => {
                                barAdded(bar);
                                resolve(userIDs);
                            })
                            .catch(reject);
                    } else {
                        barAdded(bar);
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
}

export function onBarAdded(callback) { return barAddedListener.push(callback); }

/**
 * Must be called to change a bar object. Checks if there are changes and do 
 * additional things like changing newsletters, deleting bar duties, ...
 * 
 * @param {Bar} barObject the bar model instance 
 * @param {object} newBarData the new bar data with the same fields as the bar model instance
 */
export async function changeBar(barObject, newBarData) {
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
        sendEmailForBar(barObject);
        barChangedListener.forEach(c => c(barObject));
    }
}

export function onBarChanged(callback) { return barChangedListener.push(callback); }