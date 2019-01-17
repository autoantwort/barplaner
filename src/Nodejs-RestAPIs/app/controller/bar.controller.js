const db = require('../config/db.config.js');
const Bar = db.Bar;
const User = db.User;
const BarDuty = db.BarDuty;

// Post a Bar
exports.create = (req, res) => {

    Bar.create({
        name: req.body.name,
        description: req.body.description,
        public: req.body.public,
        start: req.body.start,
        end: req.body.end,
        facebookEventID: req.body.facebookEventID,
    }).then(bar => {
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
            BarDuty.bulkCreate(users).catch(err => {
                console.error(err);
            });
        }).catch(err => {
            console.error(err);
        });
        // Send created bar to client
        res.send(bar);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};

// FETCH all Bars
exports.findAll = (req, res) => {
    Bar.findAll().then(bar => {
        // Send all bars to Client
        res.send(bar);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};

// Find a Bar by Id
exports.findById = (req, res) => {
    Bar.findById(req.params.barID).then(bar => {
        res.send(bar);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};


// Update a Bar
exports.update = (req, res) => {
    var customer = req.body;
    let update = {
        name: req.body.name,
        description: req.body.description,
        public: req.body.public,
        start: req.body.start,
        end: req.body.end,
        facebookEventID: req.body.facebookEventID,
    };
    Object.keys(update).forEach(key => update[key] === undefined && delete update[key]);
    Bar.update(update, { where: { id: req.params.barID } }).then(() => {
        res.status(200).send(customer);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};

// Delete a Bar by Id
exports.delete = (req, res) => {
    const id = req.params.barID;
    Bar.destroy({
        where: { id: id }
    }).then(() => {
        res.status(200).send('Bar has been deleted!');
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};