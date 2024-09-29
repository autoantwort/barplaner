const db = require('../config/db.config.js');
const File = require('./file.controller');
const Position = db.stock.Position;
const Item = db.stock.Item;
const ItemGroup = db.stock.ItemGroup;
const Image = db.Image;
const sequelize = db.sequelize;

// Post a Position
exports.create = (req, res) => {
    const errorHandler = e => res.status(e.name === "SequelizeValidationError" || e.name === "SequelizeUniqueConstraintError" ? 400 : 500).send("Error: " + e.name + ": " + e.errors[0].message);
    // a already existing image is used
    if (req.body.imageId) {
        Position.create(req.body)
            .then(o => res.status(201).send(o))
            .catch(errorHandler);
    } else {
        // see https://www.npmjs.com/package/express-fileupload
        if (!req.files || Object.keys(req.files).length === 0) {
            // A position without an image
            Position.create(req.body)
                .then(o => res.status(201).send(o))
                .catch(errorHandler);
        } else {
            const keys = Object.keys(req.files);
            if (keys.length > 1) {
                return res.status(400).send("More than one image was uploaded");
            }
            const file = req.files[keys[0]];
            File.coreCreateImage(req.body.titel, file.name, file.data, file.mimetype).then(image => {
                Position.create({
                    ...req.body,
                    imageId: image.id,
                })
                    .then(o => res.status(201).send(o))
                    .catch(errorHandler);
            }).catch(errorHandler);
        }
    }
};

exports.update = async (req, res) => {
    try {
        if (req.files && Object.keys(req.files).length > 0) {
            const keys = Object.keys(req.files);
            if (keys.length > 1) {
                return res.status(400).send("More than one image was uploaded");
            }
            req.body.imageId = (await File.coreCreateImageFromRequest(req, req.body.titel, keys[0])).id;
        }
        const affected = await Position.update({
            ...req.body,
            imageId: image.id,
        }, { where: { id: req.params.id } });
        if (affected[0] === 0) {
            return res.status(404).send("Position with id " + req.params.id + " does not exist");
        }
        res.status(200).send(await Position.findByPk(req.params.id, { include: [{ model: Image }] }));
    } catch (e) {
        res.status(e.name === "SequelizeValidationError" || e.name === "SequelizeUniqueConstraintError" ? 400 : 500).send("Error: " + e.name + ": " + e.errors[0].message);
    }
};

const order = [['room', 'ASC'], ['name', 'ASC']];

// get all Positions
exports.findAll = (req, res) => {
    Position.findAll({
        order,
    }).then(positions => {
        res.send(positions);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};

// get all positions with images
exports.getAllWithImages = (req, res) => {
    Position.findAll({
        include: [{
            model: Image,
        }],
        order,
    }).then(positions => {
        res.send(positions);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};

// get all Positions for select
exports.getAllForSelect = (req, res) => {
    Position.findAll({
        attributes: [
            ['id', 'value'],
            ['name', 'text'],
            "nameColognePhonetics",
        ],
        order,
    }).then(positions => {
        res.send(positions);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};

// get all Position images
exports.getAllUsedImages = (req, res) => {
    console.log("getAllUsedImages");
    Image.findAll({
        attributes: ['id', 'titel', 'original', 'compressed'],
        include: [{
            model: Position,
            required: true,
            order,
        }],
    }).then(images => {
        res.send(images);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};

// get all images, that are not used as Position image
exports.getAllNotUsedImages = (req, res) => {
    // "exclude": see https://github.com/sequelize/sequelize/issues/4099 
    Image.findAll({
        attributes: ['id', 'titel', 'original', 'compressed'],
        where: {
            positionId: {
                [Op.eq]: null
            }
        },
        include: [{
            model: Position,
            required: false,
        }],
    }).then(images => {
        res.send(images);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};

exports.update = (req, res) => {
    if (req.params.name !== undefined) {
        res.status(400).send("You can not update the name of a position");
    } else if (req.params.id === undefined) {
        res.status(400).send("The request does not contains a id parameter");
    } else {
        Position.update(req.body, {
            where: {
                id: req.params.id,
            }
        }).then((affected) => {
            if (affected[0] === 0) {
                res.status(404).send("Position with id " + req.params.id + " does not exist");
            } else {
                res.status(200).send(affected[1][0]);
            }
        }).catch(err => {
            res.status(500).send("Error -> " + err);
        });
        // TODO check if the last reference to a image was deleted => delete image, files
    }
};

// Find a Position by Id
exports.findById = (req, res) => {
    Position.findByPk(req.params.id, {
        include: [{ model: Image }]
    }).then(position => {
        res.send(position);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};

// Delete a Position by Id
exports.delete = (req, res) => {
    const errorHandler = e => res.status(500).send("Error : " + e);
    Item.count({
        where: {
            positionId: req.params.id,
        }
    }).then(count => {
        if (count === 0) {
            ItemGroup.count({
                where: {
                    positionId: req.params.id,
                }
            }).then(count => {
                if (count === 0) {
                    Position.destroy({
                        where: { id: req.params.id }
                    }).then(() => {
                        res.status(200).send("Position has been deleted");
                    }).catch(errorHandler);
                } else {
                    res.status(409).send("The position is still used by " + count + " item groups");
                }
            }).catch(errorHandler);
        } else {
            res.status(409).send("The position is still used by " + count + " items");
        }
    }).catch(errorHandler);
};