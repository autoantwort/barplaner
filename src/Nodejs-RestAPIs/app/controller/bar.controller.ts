import db from "../config/db.config.js";
import * as Util from "../util/cleaning.js";

import Bar from "../model/bar.model.js";
import Role from "../model/role.model.js";

import * as BarUtil from"../util/addBar.js";

import * as Telegram from "../util/telegram.js";

const User = db.User;
const BarDuty = db.BarDuty;
const sequelize = db.sequelize;
const UserRoles = db.UserRoles;

let BarAdminRole = null;
let CleaningAdminRole = null;

db.addSyncCallback(() => {
  Role.findCreateFind({
    where: { name: "BarAdmin" },
    defaults: {
      name: "BarAdmin",
      description: "You can add bars and change them",
    },
  })
    .then((role) => {
      BarAdminRole = role[0];
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
    })
    .catch(console.error);
});

// Post a Bar
export const create = (req, res) => {
  UserRoles.findOne({
    where: {
      userId: req.user.id,
      roleName: BarAdminRole.name,
    },
  })
    .then((result) => {
      if (result === null) {
        res.status(403).send("You dont have this permission");
      } else {
        BarUtil.addBar(
          {
            name: req.body.name,
            description: req.body.description,
            public: req.body.public,
            start: req.body.start,
            end: req.body.end,
            facebookEventID: req.body.facebookEventID,
          },
          req.body.numberOfPersonsToClean
        )
          .then((r) => res.send(r))
          .catch((err) => {
            console.error(err);
            res.status(500).send(err);
          });
      }
    })
    .catch((err) => res.status(500).send("Error -> " + err));
};

// FETCH all Bars
export const findAll = (req, res) => {
  Bar.findAll()
    .then((bar) => {
      // Send all bars to Client
      res.send(bar);
    })
    .catch((err) => {
      res.status(500).send("Error -> " + err);
    });
};

// Update cleaning
export const updateCleaning = (req, res) => {
  let update = () => {
    BarDuty.update(req.body, {
      where: {
        userID: req.params.userID,
        barID: req.params.barID,
      },
    })
      .spread((affectedCount, affectedRows) => {
        Telegram.changeCleaningStatus(
          req.params.barID,
          req.params.userID,
          req.body.have_to_clean
        );
        // Send all bars to Client
        res.status(200).send(JSON.stringify(affectedCount));
      })
      .catch((err) => {
        res.status(500).send("Error -> " + err);
      });
  };
  UserRoles.findOne({
    where: {
      userId: req.user.id,
      roleName: CleaningAdminRole.name,
    },
  })
    .then((result) => {
      if (result === null) {
        // man darf freiwillig putzen
        if (
          Number(req.params.userID) === req.user.id &&
          (req.body.have_to_clean == true ||
            req.body.have_to_clean === undefined)
        ) {
          Bar.findByPk(req.params.barID).then((bar) => {
            if (bar.start > new Date()) {
              update();
            } else {
              res.status(403).send("You dont have this permission 1");
            }
          });
        } else {
          res.status(403).send("You dont have this permission 2");
        }
      } else {
        update();
      }
    })
    .catch((err) => res.status(500).send("Error -> " + err));
}; // Update cleaning

export const updateDuty = (req, res) => {
  if (req.user.id === Number(req.params.userID)) {
    BarDuty.update(req.body, {
      where: {
        userID: req.params.userID,
        barID: req.params.barID,
      },
    })
      .spread((affectedCount, affectedRows) => {
        // Send all bars to Client
        res.status(200).send(JSON.stringify(affectedCount));
      })
      .catch((err) => {
        res.status(500).send("Error -> " + err);
      });
  } else {
    res.status(403).send("You dont have this permission");
  }
};

// FETCH all Bars with barduties
export const getAllBarsWithBarduties = (req, res) => {
  User.findAll({ raw: true }).then((users) => {
    let userMap = {};
    for (const user of users) {
      userMap[user.id] = user;
    }
    Bar.findAll({
      //raw: true,
      order: [["start", "DESC"]],
    })
      .then((bars) => {
        console.time("order by");
        // Send all bars to Client
        var map = {};
        const jsonBars = [];

        for (const bar of bars) {
          let jsonBar = bar.toJSON();
          jsonBar["duties"] = [];

          jsonBars.push(jsonBar);

          map[bar.id] = jsonBar;
        }
        console.timeEnd("order by");
        BarDuty.findAll({
          raw: true,
          order: [["state", "DESC"]],
          // do this manually, then we are faster
          // include: [{
          //     model: User,
          // }]
        })
          .then((duties) => {
            console.time("zuordnen");
            // Send all bars to Client
            for (let duty of duties) {
              map[duty.barID].duties.push(duty);
              duty["user.name"] = userMap[duty.userID].name;
            }
            console.timeEnd("zuordnen");
            res.send(jsonBars);
          })
          .catch((err) => {
            res.status(500).send("Error -> " + err);
          });
      })
      .catch((err) => {
        res.status(500).send("Error -> " + err);
      });
  });
};

// Find a Bar by Id
export const findById = (req, res) => {
  Bar.findByPk(req.params.barID)
    .then((bar) => {
      res.send(bar);
    })
    .catch((err) => {
      res.status(500).send("Error -> " + err);
    });
};
// Find a Bar by Id
export const distributeCleaningDuty = (req, res) => {
  Util.computeCleaning(req.params.barID, 2);
  res.send("Wird bearbeitet");
};

// Update a Bar
export const update = (req, res) => {
  UserRoles.findOne({
    where: {
      userId: req.user.id,
      roleName: BarAdminRole.name,
    },
  })
    .then((result) => {
      if (result === null) {
        res.status(403).send("You dont have this permission");
      } else {
        var customer = req.body;
        let update = {
          name: req.body.name,
          description: req.body.description,
          public: req.body.public,
          start: req.body.start,
          end: req.body.end,
          facebookEventID: req.body.facebookEventID,
        };
        Object.keys(update).forEach(
          (key) => update[key] === undefined && delete update[key]
        );
        Bar.update(update, { where: { id: req.params.barID } })
          .then(() => {
            res.status(200).send(customer);
          })
          .catch((err) => {
            res.status(500).send("Error -> " + err);
          });
      }
    })
    .catch((err) => res.status(500).send("Error -> " + err));
};

// Delete a Bar by Id
export const deleteBar = (req, res) => {
  UserRoles.findOne({
    where: {
      userId: req.user.id,
      roleName: BarAdminRole.name,
    },
  })
    .then((result) => {
      if (result === null) {
        res.status(403).send("You dont have this permission");
      } else {
        const id = req.params.barID;
        Bar.destroy({
          where: { id: id },
        })
          .then(() => {
            res.status(200).send("Bar has been deleted!");
          })
          .catch((err) => {
            res.status(500).send("Error -> " + err);
          });
      }
    })
    .catch((err) => res.status(500).send("Error -> " + err));
};
