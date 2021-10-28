import db from "../config/db.config.js";
import Role from "../model/role.model.js";
import * as seq from "sequelize";

const Op = seq.Op;

const Util = require("../util/cleaning");
const User = db.User;
const BarDuty = db.BarDuty;
const sequelize = db.sequelize;
const UserRoles = db.UserRoles;
const Setting = db.Setting;

let FacebookAdminRole = null;
let CleaningAdminRole = null;

db.addSyncCallback(() => {
  // create default settings if not exists:
  Role.findCreateFind({
    where: { name: "FacebookAdmin" },
    defaults: {
      name: "FacebookAdmin",
      description: "You can change the Facebook Access Token",
    },
  })
    .then((role) => {
      FacebookAdminRole = role[0];
    })
    .catch(console.error);
  Role.findCreateFind({
    where: { name: "CleaningAdmin" },
    defaults: {
      name: "CleaningAdmin",
      description: "You can update the have_to_clean state of barduties",
    },
  })
    .then((role) => {
      CleaningAdminRole = role[0];
      Setting.findCreateFind({
        where: {
          name: "defaultNumberOfPersonsToClean",
        },
        defaults: {
          name: "defaultNumberOfPersonsToClean",
          description: "Default number of persons, which should clean the bar",
          value: "2",
          permission: CleaningAdminRole.name,
        },
      }).catch(console.error);
    })
    .catch(console.error);
});

// a mapping from settings name => listener
const settingChangeListener = {};
export const addSettingChangeListener = (name, callback) => {
  if (settingChangeListener[name] === undefined) {
    settingChangeListener[name] = [callback];
  } else {
    settingChangeListener[name].push(callback);
  }
};

const sendSettingsChangeEvent = (name, newValue) => {
  if (settingChangeListener[name] !== undefined) {
    for (let c of settingChangeListener[name]) {
      c(newValue);
    }
  }
};

// get Settings
export const getAll = (req, res) => {
  UserRoles.findAll({
    where: {
      userId: req.user.id,
    },
    raw: true,
  })
    .then((roles) => {
      let r = roles.map((r) => r.roleName);
      r.push(null);
      Setting.findAll({
        where: {
          permission: {
            [Op.in]: r,
          },
        },
        raw: true,
      })
        .then((settings) => {
          res.send(settings);
        })
        .catch((err) => res.status(500).send(err));
    })
    .catch((err) => res.status(500).send(err));
};
// get Setting by name
export const getOne = (req, res) => {
  Setting.findByPk(req.params.name, { raw: true })
    .then((s) => {
      if (s === null) {
        res.status(400).send("No Setting with this name");
      } else {
        if (s.permission === null) {
          res.send(s);
        } else {
          UserRoles.findOne({
            where: {
              userId: req.user.id,
              roleName: s.permission,
            },
            raw: true,
          })
            .then((r) => {
              if (r === null) {
                res.status(403).send("You dont have this permission");
              } else {
                res.send(s);
              }
            })
            .catch((err) => res.status(500).send(err));
        }
      }
    })
    .catch((err) => res.status(500).send(err));
};

// update Setting by name
export const updateOne = (req, res) => {
  Setting.findByPk(req.params.name)
    .then((s) => {
      if (s === null) {
        res.status(400).send("No Setting with this name");
      } else {
        let update = () => {
          s.update({ value: req.body.value })
            .then(() => {
              res.send("success");
              sendSettingsChangeEvent(req.params.name, req.body.value);
            })
            .catch((err) => {
              console.log(err);
              res.status(500).send(JSON.stringify(err));
            });
        };
        if (s.permission === null) {
          update();
        } else {
          UserRoles.findOne({
            where: {
              userId: req.user.id,
              roleName: s.permission,
            },
            raw: true,
          })
            .then((r) => {
              if (r === null) {
                res.status(403).send("You dont have this permission");
              } else {
                update();
              }
            })
            .catch((err) => {
              console.log(err);
              res.status(500).send(JSON.stringify(err));
            });
        }
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(JSON.stringify(err));
    });
};
