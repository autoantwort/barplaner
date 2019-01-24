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
let CleaningAdminRole = null;

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
    Role.create({
        name: "CleaningAdmin",
        description: "You can update the have_to_clean state of barduties",
    }).then(role =>  {
        CleaningAdminRole = role;
    }).catch(err => {
        Role.findByPk("CleaningAdmin")
            .then(role => CleaningAdminRole = role)
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
                    birthday: req.body.birthday
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
                    res.status(201).send(user);
                }).catch(err => {
                    // status 200 to make a workaround, otherwise axios will set response to undefined
                    res.status(200).send(err);
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
                    [Op.and]: [{ userId: req.params.userID }, { roleName: req.params.role }]
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
    User.findAll({
        raw: true,
    }).then(user => {
        // Send all user to Client
        res.send(user);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};
// FETCH all Roles
exports.findAllRoles = (req, res) => {
    User.findAll({
        raw: true,
    }).then(user => {
        UserRoles.findAll({ raw: true }).then((roles) => {
            let map = {};
            for (let i = 0; i < user.length; ++i) {
                map[user[i].id] = user[i];
                user[i].roles = [];
            }
            for (const role of roles) {
                map[role.userId].roles.push(role);
            }
            res.send(user);
        }).catch(err => res.status(500).send("Error -> " + err));

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
    let realFunc = (data) => {
        var user = req.body;
        let createUser = function(hash) {
            // TODO: if update active status, add/remove the user from bars in the future             
            let update = {...data, password: hash }; //{ name: req.body.name, email: req.body.email, phone: req.body.phone, telegramID: req.body.telegramID, active: req.body.active, password: hash };
            //remove undefined properties, otherwise update() will set the entries in the table to null
            Object.keys(update).forEach(key => update[key] === undefined && delete update[key]);
            User.update(update, {
                where: {
                    id: req.params.userID
                }
            }).then(() => {
                res.status(200).send(update);
            }).catch(err => {
                res.status(400).send(err);
            });
        };
        if (req.body.password === undefined || req.body.password.length === 0) {
            createUser();
        } else {
            if (req.password.length < 8) {
                res.status(400).send({ errors: [{ message: "password is to short, min 8 chars", value: req.body.password.length }] })
                return;
            }
            bcrypt.hash(req.body.password, 10).then(function(hash) {
                createUser(hash);
            });
        }
    };
    //you can change you data
    if (req.body.name !== undefined && req.body.name.length < 2) {
        res.status(400).send({ errors: [{ message: "name is to short, min 2 chars", value: req.body.name.length }] })
        return;
    }
    if (req.params.userID == req.user.id && req.body.experienced_cleaner === undefined) {
        realFunc({ name: req.body.name, email: req.body.email, phone: req.body.phone, telegramID: req.body.telegramID, active: req.body.active, birthday: req.body.birthday, });
    } else {
        if (req.body.experienced_cleaner !== undefined) {
            UserRoles.findOne({
                where: {
                    userId: req.user.id,
                    roleName: CleaningAdminRole.name,
                }
            }).then(result => {
                if (result === null) {
                    res.status(403).send("You dont have this permission");
                } else {
                    realFunc({ experienced_cleaner: req.body.experienced_cleaner });
                }
            }).catch(err => res.status(500).send("Error -> " + err));
        } else {

            UserRoles.findOne({
                where: {
                    userId: req.user.id,
                    roleName: UserAdminRole.name,
                }
            }).then(result => {
                if (result === null) {
                    res.status(403).send("You dont have this permission");
                } else {
                    realFunc({ name: req.body.name, email: req.body.email, phone: req.body.phone, telegramID: req.body.telegramID, active: req.body.active, birthday: req.body.birthday, });
                }
            }).catch(err => res.status(500).send("Error -> " + err));
        }
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