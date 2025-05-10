import { commands } from '../common/stockChangeReasons.js';
import db from '../config/db.config.js';

const Item = db.stock.Item;
const ItemGroup = db.stock.ItemGroup;
const ItemRequest = db.stock.ItemRequest;
const Sequelize = db.Sequelize;
const Op = Sequelize.Op;

import { changeRequest, createRequest, deleteRequest, sendMQTTError, sendItemRequestQuereNext, sendItemRequestQuerePrevious, findRequest } from './itemRequestUtil.js';

const onBarcode = async (barcode) => {
    if (!isNaN(barcode)) {
        const code = Number(barcode);
        if (code === commands.minusOne) {
            const latestRequest = await ItemRequest.findOne({
                order: [['id', 'DESC']]
            });
            if (latestRequest) {
                if (latestRequest.amount === 1) {
                    deleteRequest(latestRequest);
                    return;
                }
                changeRequest(latestRequest, -1);
                return;
            } else {
                sendMQTTError();
                return;
            }
        } else if (code === commands.cancel) {
            const latestRequest = await ItemRequest.findOne({
                order: [['id', 'DESC']]
            });
            if (latestRequest) {
                deleteRequest(latestRequest);
                return;
            } else {
                return sendMQTTError();
            }
        } else if (code === commands.next) {
            sendItemRequestQuereNext();
        } else if (code === commands.previous) {
            sendItemRequestQuerePrevious();
        }
    }
    barcode = barcode.toString();
    const items = await Item.findAll({
        where: {
            [Op.or]: [
                { barcode: barcode },
                { barcodePack: barcode },
            ],
        },
        include: [{
            model: ItemGroup
        }]
    });
    if (items.length !== 1) {
        return sendMQTTError();
    }
    const item = items[0];
    const latestRequest = await findRequest(item);
    if (latestRequest) {
        changeRequest(latestRequest, +1);
    } else {
        createRequest(item);
    }
}

const registerWebSocketListener = function (app) {
    app.ws('/itemRequestScanner', (ws, req) => {
        ws.on('error', err => {
            console.error("Fehler bei einem Websocket unter /itemRequestScanner", err);
        });
        ws.on('message', msg => {
            if (ArrayBuffer.isView(msg)) {
                const decoder = new TextDecoder();
                msg = decoder.decode(msg);
            }
            onBarcode(msg);
        });
        ws.on('close', (code, reason) => {
            // ignore
        });
    });
};

export { registerWebSocketListener };
