import { client, retain } from './mqttClient.js';
import db, { Setting } from '../config/db.config.js';
import { bot } from './telegram.js';
import { StockAdminRole } from './roles.js';
const Item = db.stock.Item;
const ItemGroup = db.stock.ItemGroup;
const ItemRequest = db.stock.ItemRequest;

const sendMQTTError = () => {
    client.publish('barplaner/itemRequest/beep', '1');
};
const sendItemRequestQuere = async () => {
    const requests = await ItemRequest.findAll({
        include: [{
            model: Item,
            include: [{
                model: ItemGroup,
                include: [{
                    model: db.stock.Position,
                    include: [{
                        model: db.Image,
                    }],
                }]
            }, {
                model: db.stock.Position,
                include: [{
                    model: db.Image,
                }],
            }, {
                model: db.Image,
            }]
        }],
    });
    client.publish('barplaner/itemRequest/quere', JSON.stringify(requests), retain);
}
const sendItemRequestQuereNext = (index) => {
    client.publish('barplaner/itemRequest/next');
}
const sendItemRequestQuerePrevious = (index) => {
    client.publish('barplaner/itemRequest/previous');
}
const sendItemRequestGotReactionState = (gotReaction) => {
    client.publish('barplaner/itemRequest/gotReaction', gotReaction ? 1 : 0, retain);
}

const [chatIdSetting, created] = await Setting.findCreateFind({
    where: {
        name: "itemRequestsTelegramChatId",
    },
    defaults: {
        name: "itemRequestsTelegramChatId",
        description: "The telegram chat ID to which item requests should be send to",
        value: null,
        permission: StockAdminRole.name,
    }
})

const state = {
    gotReaction: false,
}

// Maybe the database was changed while the server was down
sendItemRequestQuere();

// TODO Check for reactions. See https://github.com/yagop/node-telegram-bot-api/issues/1266
// bot.addListener("", ())

bot.onText(/\/sendItemRequestsToThisChat/, msg => {
    chatIdSetting.value = msg.chat.id;
    chatIdSetting.save();
    bot.sendMessage(msg.chat.id, `Item Requests will now be sent to this chat.`);
});

/**
 * 
 * @param {int} amount How often is the item requested
 * @param {Item} item The requested item
 * @returns {string} The message to send to telegram
 */
function createTelegramMessage(amount, item) {
    return `${amount}x ${item.name} ${item.itemGroup ? item.itemGroup.name : ""}`;
}

/**
 * 
 * @param {Item} item The requested item
 */
async function createRequest(item) {
    const request = await ItemRequest.create({
        itemId: item.id,
        amount: 1,
    });
    const id = await chatIdSetting.reload();
    if (id.value !== null) {
        const message = await bot.sendMessage(id.value, createTelegramMessage(1, item));
        request.chatId = message.chat.id;
        request.messageId = message.message_id;
        request.save();
    }
    sendItemRequestQuere();
}

/**
 * Changes the amount of an item request, or deletes it if the amount is 0
 * 
 * @param {ItemRequest} itemRequest The request to change
 * @param {int} change The amount of change
 */
async function changeRequest(itemRequest, change) {
    itemRequest.amount += change;
    if (itemRequest.amount <= 0) {
        deleteRequest(itemRequest);
        return;
    }
    itemRequest.save();
    const item = await Item.findByPk(itemRequest.itemId, {
        include: [{
            model: ItemGroup
        }]
    });
    bot.editMessageText(createTelegramMessage(itemRequest.amount, item), {
        chat_id: itemRequest.chatId,
        message_id: itemRequest.messageId,
    }).catch(console.error);
    sendItemRequestQuere();
}

/**
 * 
 * @param {ItemRequest} itemRequest The request to delete
 */
async function deleteRequest(itemRequest) {
    bot.deleteMessage(itemRequest.chatId, itemRequest.messageId);
    await itemRequest.destroy();
    if (await ItemRequest.count() === 0) {
        state.gotReaction = false;
        sendItemRequestGotReactionState(false);
    }
    sendItemRequestQuere();
}

async function findRequest(item) {
    const request = await ItemRequest.findOne({
        where: {
            itemId: item.id,
        }
    });
    if (request) {
        return request;
    }
    return await ItemRequest.findOne({
        include: [
            {
                model: Item,
                required: true,
                where: {
                    itemGroupId: item.itemGroupId,
                }
            }
        ]
    });
}

export { createRequest, changeRequest, deleteRequest, findRequest, sendMQTTError, sendItemRequestQuereNext, sendItemRequestQuerePrevious };
