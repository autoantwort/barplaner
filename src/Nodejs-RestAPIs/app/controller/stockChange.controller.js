import { StockChangeLog } from '../model/stockManagement/changeLog.model.js';
import { StockChange } from '../model/stockManagement/change.model.js';
import { Item } from '../model/stockManagement/item.model.js';
import { ItemGroup } from '../model/stockManagement/itemGroup.model.js';
import { Invoice } from '../model/stockManagement/invoice.model.js';
import { InvoiceEntry } from '../model/stockManagement/invoiceEntry.model.js';
import { Position } from '../model/stockManagement/position.model.js';
import { User } from '../model/user.model.js';
import { sequelize, Sequelize } from '../config/database.js';
const Op = Sequelize.Op;

/**
 * Returns a date string for the next day. E.g.: 2020-01-10 for input 2020-01-09
 * @param {String} date The date string with the format YYYY-MM-DD
 * @returns {String} the date string of the next day
 */
const nextDay = (date) => {
    date = new Date(date);
    date.setDate(date.getDate() + 1);
    return date.toISOString().substring(0, 10);
};


// Post a Stock Change
export function create(req, res) {
    StockChange.create({ ...req.body, userId: req.user.id })
        .then(o => res.status(201).send(o))
        .catch(e => res.status(400).send(e));
}

export async function changeStockChange(req, res) {
    try {
        const stockChange = await StockChange.findByPk(req.params.id);
        if (!stockChange) {
            res.status(404).send("StockChange not found.");
            return;
        }
        const changes = {};
        for (const key in req.body.change) {
            if (req.body.change[key] !== stockChange[key]) {
                changes[key] = [stockChange[key], req.body.change[key]];
                stockChange[key] = req.body.change[key];
            }
        }
        if (Object.keys(changes).length !== 0) {
            StockChangeLog.create({
                stockChangeId: stockChange.id,
                userId: req.user.id,
                changedFields: changes,
                note: req.body.note,
            });
        }
        await stockChange.save();
        res.status(200).send(stockChange);
    } catch (err) {
        res.status(500).send("Error -> " + err);
    }
}

export function deleteStockChange(req, res) {
    if (req.body.reason?.length < 6 ?? false) {
        res.status(400).send("Reason must be at least 6 characters long.");
        return;
    }
    req.body = { change: { amount: 0 }, note: req.body.reason };
    changeStockChange(req, res);
}

export function getStockChangeLog(req, res) {
    StockChangeLog.findAll({
        where: {
            stockChangeId: req.params.id,
        },
        include: [{
            model: User,
            attributes: ['name'],
        }],
        order: [['createdAt', 'DESC']],
    }).then(logs => {
        res.send(logs);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
}

// get Stock Changes
export function getStockChanges(req, res) {
    let where;
    const date = /\d{4}-(0\d|1[0-2])-([0-2]\d|30|31)/;
    if (req.query.from || req.query.to) {
        if (!date.test(req.query.from) || !date.test(req.query.to)) {
            res.status(400).send("Invalid request, only one date given (from or to) or a date has an invalid format (must be YYYY-MM-DD)");
            return;
        }
        if (req.query.from > req.query.to) {
            const to = req.query.from;
            req.query.from = req.query.to;
            req.query.to = nextDay(to);
        } else {
            req.query.to = nextDay(req.query.to);
        }
        req.query.limit = 1000000;
        where = {
            date: {
                [Op.and]: {
                    [Op.gte]: req.query.from,
                    [Op.lt]: req.query.to,
                }
            }
        };
    }
    const attributes = {
        include: [],
    };
    if (req.query.highlight) {
        if (!date.test(req.query.highlight)) {
            res.status(400).send("Invalid request, the highlight date has an invalid format (must be YYYY-MM-DD)");
            return;
        }
        attributes.include.push([sequelize.literal("CASE WHEN Date(date, 'localtime') = '" + req.query.highlight + "' THEN true ELSE false END"), "highlight"]);
    }
    StockChange.findAll({
        limit: req.query.limit || 1000,
        offset: req.query.offset,
        where: where,
        attributes,
        include: [{
            model: User,
            attributes: ['id', 'name'],
        }, {
            model: Item,
            attributes: ['id', 'name'],
        }, {
            model: InvoiceEntry,
            attributes: ['invoiceId'],
        }],
        order: [
            ['date', "DESC"],
        ],
    }).then(changes => {
        res.send(changes);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
}

export function getStockChange(req, res) {
    StockChange.findByPk(req.params.id, {
        include: [{
            model: User,
            attributes: ['name'],
        }, {
            model: Item,
            attributes: ['name'],
        }, {
            model: InvoiceEntry,
            attributes: ['invoiceId'],
            include: [{
                model: Invoice,
                attributes: ['seller', 'invoiceDate'],
            }],
        }],
    }).then(change => {
        res.send(change);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
}


// get current Stock
export function getItemStock(req, res) {
    Item.findAll({
        attributes: {
            include: [
                [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('stockChanges.amount')), 0), "inStock"],
                [sequelize.fn('ROUND', sequelize.fn('MIN', sequelize.col('brottoPrice')), 2), "minBrottoPrice"],
                [sequelize.fn('ROUND', sequelize.fn('MAX', sequelize.col('brottoPrice')), 2), "maxBrottoPrice"],
                [sequelize.fn('ROUND', sequelize.fn('AVG', sequelize.col('brottoPrice')), 2), "avgBrottoPrice"],
            ],
        },
        include: [{
            model: ItemGroup,
            include: [{ model: Position }]
        }, {
            model: Position,
        }, {
            model: StockChange,
            attributes: [],
        }],
        group: ["itemId", "itemGroup.id"],
        order: [['name', 'ASC']],
    }).then(stock => {
        res.send(stock);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
}

export function getStockForItem(req, res) {
    Item.findAll({
        where: {
            id: req.params.itemId,
        },
        attributes: [],
        include: [{
            model: StockChange,
            attributes: [
                [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('stockChanges.amount')), 0), "inStock"]
            ],
        }],
        group: "itemId",
    }).then(stock => {
        res.send(stock[0].stockChanges[0] ?? { inStock: 0 });
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
}

export function getStockChangesForItem(req, res) {
    StockChange.findAll({
        where: {
            itemId: req.params.itemId,
        },
        order: [
            ['id', "DESC"],
        ],
        include: [{
            model: User,
            attributes: ["name"]
        }, {
            model: InvoiceEntry,
            attributes: ['invoiceId'],
        }],
    }).then(changes => {
        res.send(changes);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
}

export function getItemStockForItemGroup(req, res) {
    sequelize.query(`Select stockItems.*, itemsWithChanges.*, stockItems.id as id from stockItems left join ( 
                        Select itemId as id,
                               SUM(stockChanges.amount) as inStock, 
                               ROUND(MIN(brottoPrice),2) as minBrottoPrice, 
                               ROUND(MAX(brottoPrice),2) as maxBrottoPrice, 
                               ROUND(AVG(brottoPrice),2) as avgBrottoPrice from stockChanges 
                            inner join stockItems as items on stockChanges.itemId = items.id AND items.itemGroupId = :itemGroupId
                        group by itemId
                     ) as itemsWithChanges on stockItems.id = itemsWithChanges.id where itemGroupId = :itemGroupId`, {
        replacements: { itemGroupId: req.params.itemGroupId },
        type: sequelize.QueryTypes.SELECT
    }).then(stock => res.send(stock)).catch(err => res.status(500).send("Error -> " + err));
}

export function getItemStockForPosition(req, res) {
    sequelize.query(`WITH searchedItems as (
                        Select stockitems.*, stockitems.stockPositionId as itemPos, itemGroups.stockpositionId as groupPos
                        From stockitems left join itemGroups on stockitems.itemGroupId = itemGroups.id
                        Where (itemPos = :positionId OR (itemPos is NULL AND groupPos = :positionId) )
                    )
                    Select * from searchedItems left join (
                        Select itemId,
                               SUM(amount) as inStock, 
                               ROUND(MIN(brottoPrice),2) as minBrottoPrice, 
                               ROUND(MAX(brottoPrice),2) as maxBrottoPrice, 
                               ROUND(AVG(brottoPrice),2) as avgBrottoPrice
                        from stockChanges group by itemId
                    ) as changes on searchedItems.id = changes.itemId
                      left join (Select id as itemGroupId, name as itemGroupName from itemGroups) as itemGroups on searchedItems.itemGroupId = itemGroups.itemGroupId`, {
        replacements: { positionId: req.params.positionId },
        type: sequelize.QueryTypes.SELECT
    }).then(stock => res.send(stock)).catch(err => res.status(500).send("Error -> " + err));
}

export function getStockChangesForItemGroup(req, res) {
    StockChange.findAll({
        include: [{
            model: Item,
            required: true,
            attributes: ['id', 'name'],
            include: [{
                model: ItemGroup,
                required: true,
                attributes: [],
                where: {
                    id: req.params.itemGroupId,
                },
            }],
        }, {
            model: InvoiceEntry,
            attributes: ['invoiceId'],
        }, {
            model: User,
            attributes: ['id', 'name'],
        }],
        order: [['date', 'DESC']],
    }).then(changes => {
        res.send(changes);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
}

export function getItemGroupStock(req, res) {
    ItemGroup.findAll({
        include: [
            {
                model: Item,
                attributes: [],
                include: [
                    {
                        model: StockChange,
                        attributes: [],
                    },
                ],
            },
        ],
        attributes: {
            include: [
                [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('stockItems.stockChanges.amount')), 0), 'inStock'],
            ]
        },
        group: ['itemGroup.id'],
    }).then(stock => {
        res.send(stock);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
}

export function getAllDatesWhereChangesHappen(req, res) {
    StockChange.findAll({
        attributes: [
            [sequelize.fn('DATE', sequelize.col('date'), 'localtime'), "realDate"],
        ],
        group: ["realDate"],
        raw: true,
    }).then(dates => {
        res.send(dates.map(d => d.realDate));
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
}

export function getAllChangesAtDay(req, res) {
    StockChange.findAll({
        where: {
            date: {
                [Op.and]: {
                    [Op.gte]: req.params.date,
                    [Op.lt]: nextDay(req.params.date),
                }
            }
        },
        attributes: {
            include: [
                [sequelize.literal("true"), "highlight"],
            ]
        },
        include: [{
            model: User,
            attributes: ['id', 'name'],
        }, {
            model: Item,
            attributes: ['id', 'name'],
        }, {
            model: InvoiceEntry,
            attributes: ['invoiceId'],
        }],
        order: [
            ['date', "DESC"],
        ],
    }).then(changes => {
        res.send(changes);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
}

export function getAllChangesFromInvoice(req, res) {
    StockChange.findAll({
        where: {
            invoiceId: req.params.invoiceId,
        },
        include: [{
            model: User,
            attributes: ['id', 'name'],
        }, {
            model: Item,
            attributes: ['id', 'name'],
        }],
        order: [
            ['date', "DESC"],
        ],
    }).then(changes => {
        res.send(changes);
    }).catch(err => {
        res.status(500).send("Error -> " + err);
    });
}