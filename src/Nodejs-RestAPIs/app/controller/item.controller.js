import { coreCreateImageFromRequest, coreCreateImage } from './file.controller';
import axios from 'axios';
import { Position } from '../model/stockManagement/position.model';
import { Item } from '../model/stockManagement/item.model';
import { ItemGroup } from '../model/stockManagement/itemGroup.model';
import { Image } from '../model/image.model';

// Post a Item
const createOrUpdate = create => async (req, res) => {
    let response = { created: {} };
    const errorHandler = e => res.status(e.name === "SequelizeValidationError" || e.name === "SequelizeUniqueConstraintError" ? 400 : 500).send("Error: " + e.name + ": " + e.errors[0].message);

    // handle image
    let imageId;
    if (req.body.itemImageId !== undefined) {
        imageId = req.body.itemImageId;
    } else if (req.files && req.files.itemImage !== undefined) {
        try {
            imageId = (await coreCreateImageFromRequest(req, req.body.name, "itemImage")).dataValues.id;
            response.created.image = imageId;
        } catch (error) {
            response.error = "Error while creating image from request: " + error;
            res.status(400).send(response);
            return;
        }
    } else if (req.body.itemImageURL !== undefined) {
        try {
            const downloadResponse = await axios.get(req.body.itemImageURL, { responseType: 'arraybuffer' });
            imageId = (await coreCreateImage(req.body.name, req.body.itemImageURL, downloadResponse.data, downloadResponse.headers['content-type'])).dataValues.id;
            response.created.image = imageId;
        } catch (error) {
            response.error = "Can't create an image from the given url: " + error;
            res.status(400).send(response);
            return;
        }
    }

    const values = {
        ...req.body,
        imageId,
    };
    if (create) {
        Item.create(values).then(item => {
            if (response.created.image) {
                item.image = response.created.image;
            }
            res.status(201).send(item);
        }).catch(error => {
            response.error = "Can't create an item: " + JSON.stringify(error);
            res.status(400).send(response);
        });
    } else {
        Item.update(values, { where: { id: req.params.id } }).then(async (affected_) => {
            const affected = affected_[0];
            if (affected === 0) {
                response.error = "Item with id " + req.params.id + " does not exist";
                return res.status(404).send(response);
            }
            res.status(200).send(await Item.findByPk(req.params.id, { include: [{ model: Image }, { model: ItemGroup }, { model: Position }] }));
        }).catch(error => {
            console.error(error)
            response.error = "Can't update item: " + JSON.stringify(error);
            res.status(400).send(response);
        });
    }
};

export const create = createOrUpdate(true);
export const update = createOrUpdate(false);

// get all items
export function getAll(req, res) {
    Item.findAll().then(items => {
        res.send(items);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
}

// get all items for select
export function getAllForSelect(req, res) {
    Item.findAll({
        attributes: [
            ['id', 'value'],
            ['name', 'text'],
            'nameColognePhonetics',
            'barcode',
            'barcodePack'
        ],
    }).then(items => {
        res.send(items);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
}

export function getAllWithGroupsAndPositions(req, res) {
    Item.findAll({
        include: [{
            model: ItemGroup,
            include: [{ model: Position }]
        }, {
            model: Position
        }],
        order: [['name', 'ASC']],
    }).then(items => {
        res.send(items);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
}

export function getAllWithImage(req, res) {
    Item.findAll({
        include: [{
            model: Image
        }]
    }).then(items => {
        res.send(items);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
}

// Find a Item by Id
export function findById(req, res) {
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
}