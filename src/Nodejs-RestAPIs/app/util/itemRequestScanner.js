import { commands } from '../common/stockChangeReasons.js';
import { client } from './mqttClient.js';
import { changeRequest, createRequest, deleteRequest, sendMQTTError, sendItemRequestQuereNext, sendItemRequestQuerePrevious, findRequest } from './itemRequestUtil.js';
import { Item } from '../model/stockManagement/item.model.js';
import { ItemGroup } from '../model/stockManagement/itemGroup.model.js';
import { ItemRequest } from '../model/stockManagement/itemRequest.model.js';
import { Op } from 'sequelize';

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

if (client.connected) {
    client.subscribe("barplaner/itemRequestScanner");
} else {
    client.on("connect", () => {
        client.subscribe("barplaner/itemRequestScanner");
    });
}

client.on("message", (topic, message) => {
    if (topic === "barplaner/itemRequestScanner") {
        const decoder = new TextDecoder();
        message = decoder.decode(message);
        onBarcode(message);
    }
});
