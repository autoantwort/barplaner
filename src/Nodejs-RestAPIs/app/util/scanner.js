const mqtt = require('mqtt');
const config = require('../config/env');
const reasons = require('../common/stockChangeReasons.js');
const db = require('../config/db.config.js');
const User = db.User;
const Item = db.stock.Item;
const ItemGroup = db.stock.ItemGroup;
const StockChange = db.stock.Change;
const Position = db.stock.Position;
const Image = db.Image;
const Sequelize = db.Sequelize;
const Op = Sequelize.Op;

const controllers = [];

function sendMessageToController(msg) {
    controllers.filter(c => c.readyState === 1 /*WebSocket.OPEN*/).forEach(c => c.send(msg));
}

// MQTT broker credentials
const options = {
    username: config.mqtt.username,
    password: config.mqtt.password,
};

const retain = { retain: true };

// Create a MQTT client
const client = mqtt.connect(config.mqtt.url, options);

// Handle errors
client.on('error', (error) => {
    console.error('MQTT error:', error);
});

// When connected
client.on('connect', () => {
    console.log('Connected to MQTT broker');
});

const sendMQTTBeep = () => {
    client.publish('barplaner/beep', '1');
};
const sendMQTTUser = (user) => client.publish('barplaner/user', user?.name || "Guest", retain);
const sendMQTTClear = () => {
    client.publish('barplaner/user', "", retain);
    client.publish('barplaner/itemName', "", retain);
    client.publish('barplaner/reasonName', "", retain);
    client.publish('barplaner/reasonIndex', "0", retain);
    setChangeToNull();
};
const sendMQTTChangeAmount = (amount) => client.publish('barplaner/changeAmount', `${amount}`, retain);
const sendMQTTItemAmount = (amount) => client.publish('barplaner/itemAmount', `${amount}`, retain);
const sendMQTTGroupAmount = (amount) => client.publish('barplaner/groupAmount', `${amount}`, retain);
const sendMQTTItemNameAndPosition = (name, item) => {
    client.publish('barplaner/itemName', name, retain);
    client.publish('barplaner/item', JSON.stringify(item), retain);
    client.publish('barplaner/itemGroupName', item?.itemGroup?.name ?? "", retain);
    sendMQTTPosition(item?.stockPosition ?? item?.itemGroup?.stockPosition ?? null);
};
const sendMQTTPosition = (position) => {
    client.publish('barplaner/positionName', position?.name ?? null, retain);
    console.log('barplaner/position', JSON.stringify(position));
    client.publish('barplaner/position', JSON.stringify(position), retain);
};
const sendMQTTReason = (sign, reason) => {
    client.publish('barplaner/reasonName', reason.germanName, retain);
    if (reason == reasons.inventoryReason) {
        client.publish('barplaner/reasonIndex', `${1 + reasons.addReasons.length + 2 + 100}`, retain);
    } else {
        client.publish('barplaner/reasonIndex', `${(sign === '-' ? -1 : 1) * (1 + reasons.findIndex(reason.name, sign === '-' ? reasons.removeReasons : reasons.addReasons))}`, retain);
    }
    setChangeToNull();
};

// State Machine for the scanner
const state = {
    user: null,
    reason: null,
    change: null,
    sign: null,
    item: null,
}

const setChangeToNull = () => {
    state.change = null;
    state.item = null;
    sendMQTTGroupAmount(0);
    sendMQTTItemAmount(0);
    sendMQTTChangeAmount(0);
    sendMQTTItemNameAndPosition("", null);
}

const haveWebsiteConsumer = () => controllers.length > 0;

const determineDefaultReason = () => {
    const SUNDAY = 0;
    const MONDAY = 1;
    const TUESDAY = 2;
    const WEDNESDAY = 3;
    const THURSDAY = 4;
    const FRIDAY = 5;
    const SATURDAY = 6;

    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const inRangeAcrossDays = (startDay, startHour, endHour) => {
        return day === startDay && hour >= startHour || day === (startDay + 1) % 7 && hour < endHour;
    }
    const inRangeOneDays = (startDay, startHour, endHour) => {
        return day === startDay && hour >= startHour && hour < endHour;
    }
    if (inRangeAcrossDays(WEDNESDAY, 18, 8)) {
        return reasons.reasons.find(reason => reason.name === 'consumedDuringBar');
    }
    if (inRangeAcrossDays(FRIDAY, 15, 2) || inRangeAcrossDays(SATURDAY, 15, 2)) {
        return reasons.reasons.find(reason => reason.name === 'rentalConsumption');
    }
    if (inRangeOneDays(SATURDAY, 9, 15) || inRangeOneDays(SUNDAY, 9, 15)) {
        return reasons.reasons.find(reason => reason.name === 'correctedRentalConsumption');
    }
    return reasons.reasons.find(reason => reason.name === 'bought');
};
let idleTimeout = null;
const resetIdleTimeout = () => {
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => {
        state.user = null;
        state.reason = null;
        sendMQTTClear();
        setChangeToNull();
    }, 120 * 1000);
}

let itemTimeout = null;
const resetItemTimeout = () => {
    clearTimeout(itemTimeout);
    itemTimeout = setTimeout(() => {
        setChangeToNull();
    }, 30 * 1000);
}

const onBarcode = async (barcode) => {
    if (!isNaN(barcode)) {
        const code = Number(barcode);
        if (code > 10000 && code < 20000) {
            state.user = await User.findByPk(code - 10000);
            if (!state.user) {
                sendMQTTBeep();
            }
            sendMQTTUser(state.user);
            if (state.reason === null) {
                state.reason = determineDefaultReason();
                state.sign = state.reason.sign;
                sendMQTTReason(state.sign, state.reason);
            }
            resetIdleTimeout();
            return;
        } else if (code === reasons.commands.minusOne) {
            if (state.change) {
                const amount = Number(state.change.amount);
                if (Math.abs(amount) === 1) {
                    state.change.destroy();
                    return setChangeToNull();
                }
                state.change.amount = `${Math.sign(amount) * (Math.abs(amount) - 1)}`;
                sendMQTTChangeAmount(state.change.amount);
                state.change.save();
                return;
            } else {
                return sendMQTTBeep();
            }
        } else if (code === reasons.commands.cancel) {
            if (state.change) {
                state.change.destroy();
                return setChangeToNull();
            } else {
                return sendMQTTBeep();
            }
        } else if (code === reasons.commands.done) {
            state.user = null;
            state.reason = null;
            sendMQTTClear();
            return setChangeToNull();
        }
    }
    barcode = barcode.toString();
    if (barcode.length === 4 && (barcode[0] === '+' || barcode[0] === '-' || barcode[0] === 'i')) {
        state.sign = barcode[0];
        const id = Number(barcode.substring(1)) - 100;
        if (id === 0) {
            state.reason = reasons.inventoryReason;
        } else {
            state.reason = reasons.reasons.find(r => r.id === id);
        }
        if (!state.reason) {
            sendMQTTBeep();
        } else {
            sendMQTTReason(state.sign, state.reason);
        }
        resetIdleTimeout();
        return;
    }
    if (barcode.length > 3 && barcode.startsWith("pos") && barcode.substring(3).match(/^\d+$/)) {
        resetIdleTimeout();
        const position = await Position.findByPk(Number(barcode.substring(3)));
        if (!position) {
            return sendMQTTBeep();
        }
        sendMQTTPosition(position);
        if (state.item) {
            if (state.item.stockPositionId) {
                state.item.stockPositionId = position.id;
                state.item.save();
            } else if (state.item.itemGroup) {
                state.item.itemGroup.stockPositionId = position.id;
                state.item.itemGroup.save();
            } else {
                state.item.stockPositionId = position.id;
                state.item.save();
            }
        }
        return;
    }
    if (state.reason === null) {
        if (!haveWebsiteConsumer()) {
            sendMQTTBeep();
        }
        return;
    }
    resetIdleTimeout();
    const items = await Item.findAll({
        where: {
            [Op.or]: [
                { barcode: barcode },
                { barcodePack: barcode },
            ],
        },
        include: [{
            model: StockChange,
            attributes: [
                [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('stockChanges.amount')), 0), "inStock"]
            ],
        }, {
            model: ItemGroup,
            include: [{ model: Position }]
        }, {
            model: Position,
        }, {
            model: Image,
        }],
        group: "itemId",
    });
    if (items.length !== 1) {
        sendMQTTItemNameAndPosition("No Item found", null);
        return sendMQTTBeep();
    }
    resetItemTimeout();
    const item = items[0];
    if (state.change && state.change.itemId === item.id && state.change.reason === state.reason.name) {
        const amount = Number(state.change.amount);
        state.change.amount = `${Math.sign(amount) * (Math.abs(amount) + 1)}`;
        sendMQTTChangeAmount(state.change.amount);
        state.change.save();
        return;
    }
    state.item = item;
    sendMQTTItemNameAndPosition(item.name, item);
    sendMQTTItemAmount(item.stockChanges[0]?.dataValues.inStock || 0)
    if (item.itemGroupId) {
        const items = await Item.findAll({
            where: {
                itemGroupId: item.itemGroupId
            },
            attributes: [],
            include: [{
                model: StockChange,
                attributes: [
                    [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('stockChanges.amount')), 0), "inStock"]
                ],
            }],
            group: "itemGroupId",
            raw: true,
        });
        sendMQTTGroupAmount(items[0]["stockChanges.inStock"])
    } else {
        sendMQTTGroupAmount("0")
    }
    if (state.sign !== 'i') {
        state.change = await StockChange.create({
            itemId: item.id,
            userId: state.user?.id || null,
            reason: state.reason.name,
            amount: state.sign === '+' ? "1" : "-1",
        });
        sendMQTTChangeAmount(state.change.amount);
    } else {
        sendMQTTChangeAmount(0);
    }
}

exports.registerClients = function (app) {
    app.ws('/scanner', (ws, req) => {
        ws.on('error', err => {
            console.error("Fehler bei einem Websocket unter /scanner", err);
        });
        ws.on('message', msg => {
            if (ArrayBuffer.isView(msg)) {
                const decoder = new TextDecoder();
                msg = decoder.decode(msg);
            }
            sendMessageToController(msg);
            onBarcode(msg);
        });
        ws.on('close', (code, reason) => {
            // ignore
        });
    });
};
exports.registerMasters = app => {
    app.ws('/scannerConsumer', (ws, req) => {
        ws.on('error', err => {
            console.error("Fehler bei einem Websocket unter /scannerConsumer", err);
        });
        controllers.push(ws);
        ws.on('message', msg => {
            // I don't know what they want to send
        });
        ws.on('close', (code, reason) => {
            const index = controllers.indexOf(ws);
            if (index > -1) {
                controllers.splice(index, 1);
            }
        });
    });
};