import { hash as _hash } from 'bcrypt';
import { randomBytes } from 'crypto';
import { Bar } from '../model/bar.model.js';
import { User } from '../model/user.model.js';
import { Role } from '../model/role.model.js';
import { Sequelize } from '../config/database.js';
import { Barduty } from '../model/barduty.model.js';
const Op = Sequelize.Op;

// Post a User
export function createAdmin(name, password, callback) {
    if (password === undefined || name === undefined) {
        callback("password or name was not defined");
        return;
    }
    _hash(password, 10).then(function(hash) {
        User.create({
            name: name,
            password: hash,
            sessionID: randomBytes(32).toString('hex'),
        }).then(user => {
            callback("user created : " + user);
            if (user.active) {
                // add user to barduty of every bar in the future
                Bar.findAll({
                    where: {
                        start: {
                            [Op.gt]: new Date(),
                        }
                    }
                }).then(bars => {
                    for (let i = 0; i < bars.length; ++i) {
                        bars[i] = {
                            barID: bars[i].id,
                            userID: user.id,
                        };
                    }
                    Barduty.bulkCreate(bars).catch(err => {
                        callback(err);
                    });
                    Role.findAll().then(res => {
                        callback("success : " + res);
                        user.addRoles(res).then(() => {
                            callback("success");
                        }).catch(err => {
                            callback("Error -> " + err);
                        });
                    });

                }).catch(err => {
                    callback(err);
                });
            }
            callback(user);
        }).catch(err => {
            callback("Error -> " + err);
        });
    });
}
