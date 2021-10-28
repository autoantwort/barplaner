import db from "../config/db.config.js";
import * as seq from "sequelize";

const Op = seq.Op;

import Bar from "../model/bar.model.js";
import Role from "../model/role.model.js";

const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = db.User;
const UserRoles = db.UserRoles;
const BarDuty = db.BarDuty;

// Post a User
exports.createAdmin = (name, password, callback) => {
  if (password === undefined || name === undefined) {
    callback("password or name was not defined");
    return;
  }
  bcrypt.hash(password, 10).then(function (hash) {
    User.create({
      name: name,
      password: hash,
      sessionID: crypto.randomBytes(32).toString("hex"),
    })
      .then((user) => {
        callback("user created : " + user);
        if (user.active) {
          // add user to barduty of every bar in the future
          Bar.findAll({
            where: {
              start: {
                [Op.gt]: new Date(),
              },
            },
          })
            .then((bars) => {
              const barDuties = [];

              for (let i = 0; i < bars.length; ++i) {
                barDuties.push({
                  barID: bars[i].id,
                  userID: user.id,
                });
              }

              BarDuty.bulkCreate(bars).catch((err) => {
                callback(err);
              });

              Role.findAll().then((res) => {
                callback("suuccess : " + res);
                user
                  .addRoles(res)
                  .then(() => {
                    callback("suuccess");
                  })
                  .catch((err) => {
                    callback("Error -> " + err);
                  });
              });
            })
            .catch((err) => {
              callback(err);
            });
        }
        callback(user);
      })
      .catch((err) => {
        callback("Error -> " + err);
      });
  });
};
