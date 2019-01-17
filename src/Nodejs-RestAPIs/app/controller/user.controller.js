const db = require('../config/db.config.js');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Bar = db.Bar;
const User = db.User;
const Role = db.Role;
const UserRoles = db.UserRoles;
const BarDuty = db.BarDuty;
const Op = db.Sequelize.Op;

let UserAdminRole = null;

db.addSyncCallback(() => {
    Role.create({
        name: "UserAdmin",
        description: "You can add/remove user, change properties of user, change roles of a user.",
    }).then(role =>  {
        console.log("")
        UserAdminRole = role;
    }).catch(err => {
        Role.findByPk("UserAdmin")
            .then(role => UserAdminRole = role)
            .catch(err => console.error(err));
        console.error(err);
    });
});
// Post a User
exports.create = (req, res) => {
    UserRoles.findOne({
        where: {
            userId: req.user.id,
            roleName: UserAdminRole.name,
        }
    }).then(result => {
        if (result === null) {
            res.status(403).send("You dont have this permission");
        } else {
            if (req.body.password === undefined || req.body.name === undefined) {
                res.status(400).send("password or name was not defined" + JSON.stringify(req.body));
                return;
            }
            bcrypt.hash(req.body.password, 10).then(function(hash) {
                User.create({
                    name: req.body.name,
                    password: hash,
                    email: req.body.email,
                    phone: req.body.phone,
                    active: req.body.active,
                    sessionID: crypto.randomBytes(32).toString('hex'),
                }).then(user => {
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
                            BarDuty.bulkCreate(bars).catch(err => {
                                console.error(err);
                            });
                        }).catch(err => {
                            console.error(err);
                        });
                    }
                    res.send(user);
                }).catch(err => {
                    res.status(500).send("Error -> " + err);
                });
            });
        }
    }).catch(err => res.status(500).send("Error -> " + err));
};

exports.getRoles = (req, res) => {
    User.findByPk(req.params.userID).then(user => {
        user.getRoles().then(roles => {
            res.send(roles)
        }).catch(err => res.status(500).send("Error -> " + err));
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
}

// Add a role to user (POST)
exports.addRole = (req, res) => {
    UserRoles.findOne({
        where: {
            userId: req.user.id,
            roleName: UserAdminRole.name,
        }
    }).then(result => {
        if (result === null) {
            res.status(403).send("You dont have this permission");
        } else {
            User.findByPk(req.params.userID).then(user => {
                user.addRole(req.body.role).then(() => {
                    res.send("success");
                }).catch(err => {
                    res.status(500).send("Error -> " + err);
                });
            }).catch(err => {
                res.status(500).send("Error -> " + err);
            });
        }
    }).catch(err => res.status(500).send("Error -> " + err));
};

// remove a role to user (DELETE)
exports.removeRole = (req, res) => {
    UserRoles.findOne({
        where: {
            userId: req.user.id,
            roleName: UserAdminRole.name,
        }
    }).then(result => {
        if (result === null) {
            res.status(403).send("You dont have this permission");
        } else {
            UserRoles.findOne({
                where: {
                    [Op.or]: [{ userId: req.params.userID }, { roleName: req.params.role }]
                }
            }).then(userrole => {
                if (userrole === null) {
                    res.status(400).send("No user with this role found");
                } else {
                    userrole.destroy().then(() => {
                        res.send("success");
                    }).catch(err => {
                        res.status(500).send("Error -> " + err);
                    });
                }
            }).catch(err => {
                res.status(500).send("Error -> " + err);
            });
        }
    }).catch(err => res.status(500).send("Error -> " + err));
};

// FETCH all User
exports.findAll = (req, res) => {
    User.findAll().then(user => {
        // Send all user to Client
        res.send(user);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};

// Find a User by Id
exports.findById = (req, res) => {
    User.findByPk(req.params.userID).then(user => {
        res.send(user);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};


// Update a User
exports.update = (req, res) => {
    let realFunc = () => {
        var user = req.body;
        let createUser = function(hash) {
            // TODO: if update active status, add/remove the user from bars in the future             
            let update = { name: req.body.name, email: req.body.email, phone: req.body.phone, telegramID: req.body.telegramID, active: req.body.active, password: hash };
            //remove undefined properties, otherwise update() will set the entries in the table to null
            Object.keys(update).forEach(key => update[key] === undefined && delete update[key]);
            User.update(update, {
                where: {
                    id: req.params.userID
                }
            }).then(() => {
                res.status(200).send(user + JSON.stringify(req.body) + JSON.stringify(req.params));
            }).catch(err => {
                res.status(500).send("Error -> " + err);
            });
        };
        if (req.body.password === undefined) {
            createUser();
        } else {
            bcrypt.hash(req.body.password, 10).then(function(hash) {
                createUser(hash);
            });
        }
    };
    //you can change you data
    if (req.params.userID == req.user.id) {
        realFunc();
    } else {
        //or an admin
        UserRoles.findOne({
            where: {
                userId: req.user.id,
                roleName: UserAdminRole.name,
            }
        }).then(result => {
            if (result === null) {
                res.status(403).send("You dont have this permission");
            } else {
                realFunc();
            }
        }).catch(err => res.status(500).send("Error -> " + err));
    }
};

// Delete a User by Id
exports.delete = (req, res) => {
    UserRoles.findOne({
        where: {
            userId: req.user.id,
            roleName: UserAdminRole.name,
        }
    }).then(result => {
        if (result === null) {
            res.status(403).send("You dont have this permission");
        } else {
            const id = req.params.userID;
            User.destroy({
                where: { id: id }
            }).then(() => {
                res.status(200).send('User has been deleted!');
            }).catch(err => {
                res.status(500).send("Error -> " + err);
            });
        }
    }).catch(err => res.status(500).send("Error -> " + err));
};