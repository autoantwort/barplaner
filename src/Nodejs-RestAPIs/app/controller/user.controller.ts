import db from "../config/db.config.js";
import * as seq from "sequelize";

const Op = seq.Op;

import Bar from "../model/bar.model.js";
import Role from "../model/role.model.js";

import * as bcrypt from "bcrypt";
import * as crypto from "crypto";

const User = db.User;
const UserRoles = db.UserRoles;
const BarDuty = db.BarDuty;

let UserAdminRole = null;
let CleaningAdminRole = null;

db.addSyncCallback(() => {
  Role.findCreateFind({
    where: { name: "UserAdmin" },
    defaults: {
      name: "UserAdmin",
      description:
        "You can add/remove user, change properties of user, change roles of a user.",
    },
  })
    .then((role) => {
      UserAdminRole = role[0];
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
// Post a User
export const create = (req, res) => {
  UserRoles.findOne({
    where: {
      userId: req.user.id,
      roleName: UserAdminRole.name,
    },
  })
    .then((result) => {
      if (result === null) {
        res.status(403).send("You dont have this permission");
      } else {
        if (req.body.password === undefined || req.body.name === undefined) {
          res
            .status(400)
            .send(
              "password or name was not defined" + JSON.stringify(req.body)
            );
          return;
        }
        bcrypt.hash(req.body.password, 10).then(function (hash) {
          User.create({
            name: req.body.name,
            password: hash,
            email: req.body.email,
            phone: req.body.phone,
            active: req.body.active,
            sessionID: crypto.randomBytes(32).toString("hex"),
            birthday: req.body.birthday,
          })
            .then((user) => {
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
                    for (const bar of bars) {
                      barDuties.push({
                        barID: bar.id,
                        userID: user.id,
                      });
                    }

                    BarDuty.bulkCreate(barDuties).catch((err) => {
                      console.error(err);
                    });
                  })
                  .catch((err) => {
                    console.error(err);
                  });
              }
              res.status(201).send(user);
            })
            .catch((err) => {
              // status 200 to make a workaround, otherwise axios will set response to undefined
              res.status(200).send(err);
            });
        });
      }
    })
    .catch((err) => res.status(500).send("Error -> " + err));
};

export const getRoles = (req, res) => {
  User.findByPk(req.params.userID)
    .then((user) => {
      user
        .getRoles()
        .then((roles) => {
          res.send(roles);
        })
        .catch((err) => res.status(500).send("Error -> " + err));
    })
    .catch((err) => {
      res.status(500).send("Error -> " + err);
    });
};

// Add a role to user (POST)
export const addRole = (req, res) => {
  UserRoles.findOne({
    where: {
      userId: req.user.id,
      roleName: UserAdminRole.name,
    },
  })
    .then((result) => {
      if (result === null) {
        res.status(403).send("You dont have this permission");
      } else {
        User.findByPk(req.params.userID)
          .then((user) => {
            user
              .addRole(req.body.role)
              .then(() => {
                res.send("success");
              })
              .catch((err) => {
                res.status(500).send("Error -> " + err);
              });
          })
          .catch((err) => {
            res.status(500).send("Error -> " + err);
          });
      }
    })
    .catch((err) => res.status(500).send("Error -> " + err));
};

// remove a role to user (DELETE)
export const removeRole = (req, res) => {
  UserRoles.findOne({
    where: {
      userId: req.user.id,
      roleName: UserAdminRole.name,
    },
  })
    .then((result) => {
      if (result === null) {
        res.status(403).send("You dont have this permission");
      } else {
        UserRoles.findOne({
          where: {
            [Op.and]: [
              { userId: req.params.userID },
              { roleName: req.params.role },
            ],
          },
        })
          .then((userrole) => {
            if (userrole === null) {
              res.status(400).send("No user with this role found");
            } else {
              userrole
                .destroy()
                .then(() => {
                  res.send("success");
                })
                .catch((err) => {
                  res.status(500).send("Error -> " + err);
                });
            }
          })
          .catch((err) => {
            res.status(500).send("Error -> " + err);
          });
      }
    })
    .catch((err) => res.status(500).send("Error -> " + err));
};

// FETCH all User
export const findAll = (req, res) => {
  User.findAll({
    raw: true,
    attributes: [
      "active",
      "birthday",
      "email",
      "experienced_cleaner",
      "gitLabID",
      "id",
      "name",
      "phone",
      "telegramID",
    ],
  })
    .then((user) => {
      // Send all user to Client
      res.send(user);
    })
    .catch((err) => {
      res.status(500).send("Error -> " + err);
    });
};

// FETCH all Roles
export const findAllRoles = (req, res) => {
  User.findAll({
    raw: true,
  })
    .then((user) => {
      UserRoles.findAll({ raw: true })
        .then((roles) => {
          let map = {};
          for (let i = 0; i < user.length; ++i) {
            map[user[i].id] = user[i];
            user[i].roles = [];
          }
          for (const role of roles) {
            map[role.userId].roles.push(role);
          }
          res.send(user);
        })
        .catch((err) => res.status(500).send("Error -> " + err));
    })
    .catch((err) => {
      res.status(500).send("Error -> " + err);
    });
};

export const userRolesTable = (req, res) => {
  User.findAll({
    raw: true,
  })
    .then((user) => {
      Role.findAll({
        raw: true,
      })
        .then((roles) => {
          let map = {};
          for (let i = 0; i < user.length; ++i) {
            map[user[i].id] = user[i];
            user[i].roles = {};
            roles.forEach((role) => {
              user[i].roles[role.name] = false;
            });
          }
          UserRoles.findAll({ raw: true })
            .then((userRoles) => {
              userRoles.forEach((userRole) => {
                map[userRole.userId].roles[userRole.roleName] = true;
              });
              res.send({
                roles: roles,
                user: user,
              });
            })
            .catch((err) => res.status(500).send(err));
        })
        .catch((err) => res.status(500).send(err));
    })
    .catch((err) => res.status(500).send(err));
};

// Find a User by Id
export const findById = (req, res) => {
  User.findByPk(req.params.userID, {
    raw: true,
    attributes: [
      "active",
      "birthday",
      "email",
      "experienced_cleaner",
      "gitLabID",
      "id",
      "name",
      "phone",
      "telegramID",
    ],
  })
    .then((user) => {
      res.send(user);
    })
    .catch((err) => {
      res.status(500).send("Error -> " + err);
    });
};

// Update a User
export const update = (req, res) => {
  let realFunc = (data) => {
    let createUser = function (hash?) {
      let update = { ...data, password: hash }; //{ name: req.body.name, email: req.body.email, phone: req.body.phone, telegramID: req.body.telegramID, active: req.body.active, password: hash };
      //remove undefined properties, otherwise update() will set the entries in the table to null
      Object.keys(update).forEach(
        (key) => update[key] === undefined && delete update[key]
      );
      User.findByPk(req.params.userID, { attributes: ["active"] })
        .then((user) => {
          User.update(update, {
            where: {
              id: req.params.userID,
            },
          })
            .then(() => {
              res.status(200).send(update);
            })
            .catch((err) => {
              res.status(400).send(err);
            });
          // check if users active status changes a bar duties should be created/deleted
          if (
            (update.active == true || update.active == false) &&
            user.active != update.active
          ) {
            if (update.active) {
              // we have to add bar duties
              // get all new bars
              Bar.findAll({
                where: {
                  start: {
                    [Op.gt]: new Date(),
                  },
                },
                attributes: ["id"],
              })
                .then((bars) => {
                  // create bar duty for every bar
                  bars.forEach((bar) => {
                    // if it is already there, we get an error, but we ignore the result
                    BarDuty.create({
                      barID: bar.id,
                      userID: req.params.userID,
                    }).catch((err) => {});
                  });
                })
                .catch(console.error);
            } else {
              // delete BarDuties in the future if state is 'no_info'
              BarDuty.findAll({
                where: {
                  userID: req.params.userID,
                  state: "no_info",
                },
                attributes: ["userID", "barID"],
                include: [
                  {
                    model: Bar,
                    where: {
                      start: {
                        [Op.gt]: new Date(),
                      },
                    },
                    required: true,
                  },
                ],
              })
                .then((duties) => {
                  // delete all found duties
                  duties.forEach((duty) => duty.destroy().catch(console.error));
                })
                .catch(console.error);
            }
          }
        })
        .catch((err) => res.status(400).send(err));
    };
    if (req.body.password === undefined || req.body.password.length === 0) {
      createUser();
    } else {
      if (req.body.password.length < 8) {
        res.status(400).send({
          errors: [
            {
              message: "password is to short, min 8 chars",
              value: req.body.password.length,
            },
          ],
        });
        return;
      }
      bcrypt.hash(req.body.password, 10).then(function (hash) {
        createUser(hash);
      });
    }
  };
  //you can change you data
  if (req.body.name !== undefined && req.body.name.length < 2) {
    res.status(400).send({
      errors: [
        {
          message: "name is to short, min 2 chars",
          value: req.body.name.length,
        },
      ],
    });
    return;
  }
  if (
    req.params.userID == req.user.id &&
    req.body.experienced_cleaner === undefined
  ) {
    realFunc({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      telegramID: req.body.telegramID,
      active: req.body.active,
      birthday: req.body.birthday,
      gitLabID: req.body.gitLabID,
      only_show_gitlab_notifications_if_assigned:
        req.body.only_show_gitlab_notifications_if_assigned,
    });
  } else {
    if (req.body.experienced_cleaner !== undefined) {
      UserRoles.findOne({
        where: {
          userId: req.user.id,
          roleName: CleaningAdminRole.name,
        },
      })
        .then((result) => {
          if (result === null) {
            res.status(403).send("You dont have this permission");
          } else {
            realFunc({ experienced_cleaner: req.body.experienced_cleaner });
          }
        })
        .catch((err) => res.status(500).send("Error -> " + err));
    } else {
      UserRoles.findOne({
        where: {
          userId: req.user.id,
          roleName: UserAdminRole.name,
        },
      })
        .then((result) => {
          if (result === null) {
            res.status(403).send("You dont have this permission");
          } else {
            realFunc({
              name: req.body.name,
              email: req.body.email,
              phone: req.body.phone,
              telegramID: req.body.telegramID,
              active: req.body.active,
              birthday: req.body.birthday,
              gitLabID: req.body.gitLabID,
              only_show_gitlab_notifications_if_assigned:
                req.body.only_show_gitlab_notifications_if_assigned,
            });
          }
        })
        .catch((err) => res.status(500).send("Error -> " + err));
    }
  }
};

// Delete a User by Id
export const deleteUser = (req, res) => {
  UserRoles.findOne({
    where: {
      userId: req.user.id,
      roleName: UserAdminRole.name,
    },
  })
    .then((result) => {
      if (result === null) {
        res.status(403).send("You dont have this permission");
      } else {
        const id = req.params.userID;
        User.destroy({
          where: { id: id },
        })
          .then(() => {
            res.status(200).send("User has been deleted!");
          })
          .catch((err) => {
            res.status(500).send("Error -> " + err);
          });
      }
    })
    .catch((err) => res.status(500).send("Error -> " + err));
};