const db = require('../config/db.config.js');
const File = require('./file.controller');
const http = require('axios');
const Position = db.stock.Position;
const Item = db.stock.Item;
const ItemGroup = db.stock.ItemGroup;
const Image = db.Image;
const sequelize = db.sequelize;

// Post a Item
exports.create = async(req, res) => {
    let response = { created: {} };
    const errorHandler = e => res.status(e.name === "SequelizeValidationError" || e.name === "SequelizeUniqueConstraintError" ? 400 : 500).send("Error: " + e.name + ": " + e.errors[0].message);

    // first handle the possible creation of a item group
    let itemGroupId = null;
    if (req.body['itemGroup.name'] !== undefined) {
        try {
            itemGroupId = (await ItemGroup.create({
                "name": req.body['itemGroup.name'],
                "minimumCount": req.body['itemGroup.minimumCount'],
                "idealCount": req.body['itemGroup.idealCount'],
                "stockPositionId": req.body['itemGroup.position'],
            })).id;
            response.created.itemGroup = itemGroupId;
        } catch (error) {
            response.error = "Error while creating item group: " + JSON.stringify(error);
            res.status(400).send(response);
            return;
        }
    } else if (req.body['itemGroup.id'] !== undefined) {
        itemGroupId = req.body['itemGroup.id'];
    }
    // handle image
    let imageId = null;
    if (req.body.itemImageId !== undefined) {
        imageId = req.body.itemImageId;
    } else if (req.files && req.files.itemImage !== undefined) {
        try {
            imageId = (await File.coreCreateImageFromRequest(req, req.body.name, "itemImage")).dataValues.id;
            response.created.image = imageId;
        } catch (error) {
            response.error = "Error while creating image from request: " + error;
            res.status(400).send(response);
            return;
        }
    } else if (req.body.itemImageURL !== undefined) {
        try {
            const downloadResponse = await http.get(req.body.itemImageURL, { responseType: 'arraybuffer' });
            imageId = (await File.coreCreateImage(req.body.name, req.body.itemImageURL, downloadResponse.data, downloadResponse.headers['content-type'])).dataValues.id;
            response.created.image = imageId;
        } catch (error) {
            response.error = "Can't create an image from the given url: " + error;
            res.status(400).send(response);
            return;
        }
    }

    const create = {
        ...req.body,
        image: imageId,
        itemGroupId,
        stockPositionId: req.body.itemPosition,
    };
    Item.create(create).then(item => {
        res.status(201).send(item);
    }).catch(error => {
        response.error = "Can't create an item: " + JSON.stringify(error);
        res.status(400).send(response);
    });
};

// get all items
exports.getAll = (req, res) => {
    Item.findAll().then(items => {
        res.send(items);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};

// get all items for select
exports.getAllForSelect = (req, res) => {
    Item.findAll({
        attributes: [
            ['id', 'value'],
            ['name', 'text'],
            'nameColognePhonetics',
            'barcode',
        ],
    }).then(items => {
        res.send(items);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};

exports.getAllWithGroupsAndPositions = (req, res) => {
    Item.findAll({
        include: [{
            model: ItemGroup,
            include: [{ model: Position }]
        }, {
            model: Position
        }]
    }).then(items => {
        res.send(items);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};

// Find a Item by Id
exports.findById = (req, res) => {
    Item.findByPk(req.params.id, {
        include: [{
            model: Position,
            include: [{ model: Image }]
        }, {
            model: ItemGroup,
            include: [{ model: Position }],
        }]
    }).then(item => {
        res.send(item);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
};