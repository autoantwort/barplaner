const db = require('../config/db.config.js');
const ItemGroup = db.stock.ItemGroup;
const Position = db.stock.Position;

// Post a ItemGroup
exports.create = (req, res) => {
    const errorHandler = e => res.status(e.name === "SequelizeValidationError" || e.name === "SequelizeUniqueConstraintError" ? 400 : 500).send("Error: " + e.name + ": " + e.errors[0].message);
    ItemGroup.create(req.body)
        .then(o => res.status(201).send(o))
        .catch(errorHandler);
};

// get all ItemGroups
exports.getAll = (req, res) => {
    ItemGroup.findAll().then(itemGroups => {
        res.send(itemGroups);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};

// get all ItemGroups
exports.getAllWithPositions = (req, res) => {
    ItemGroup.findAll({
        include: [{
            model: Position,
        }]
    }).then(itemGroups => {
        res.send(itemGroups);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};

// get all ItemGroups for select
exports.getAllForSelect = (req, res) => {
    ItemGroup.findAll({
        attributes: [
            ['id', 'value'],
            ['name', 'text']
        ],
    }).then(itemGroups => {
        res.send(itemGroups);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};


exports.update = (req, res) => {
    if (req.params.id !== undefined) {
        res.status(400).send("The request does not contains a id parameter");
    } else {
        ItemGroup.update(req.body, {
            where: {
                id: req.params.id,
            }
        }).spread((affectedCount, affectedRows) => {
            res.status(200).send(JSON.stringify(affectedCount));
        }).catch(err => {
            res.status(500).send("Error -> " + err);
        });
    }
};

// Find a ItemGroup by Id
exports.findById = (req, res) => {
    ItemGroup.findByPk(req.params.id, {
        include: [{ model: Position }]
    }).then(itemGroup => {
        res.send(itemGroup);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};