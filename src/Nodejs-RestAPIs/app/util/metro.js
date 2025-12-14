import axios from "axios";
import { Op } from 'sequelize';
import { bot } from './telegram.js';
import { CronJob } from 'cron';
import { Item } from "../model/stockManagement/item.model.js";
import { InvoiceEntry } from "../model/stockManagement/invoiceEntry.model.js";
import { TelegramMetroPromoSubscription } from "../model/telegramMetroPromoSubscription.model.js";

const storeId = "00017";

const getItemsFromMetro = async (ids, cookie) => {
    const qids = ids.map(i => "ids=" + i).join("&");
    res = await axios.get(`https://produkte.metro.de/evaluate.article.v1/betty-variants?country=DE&locale=de-DE&storeIds=${storeId}&details=true&${qids}`, {
        headers: {
            "CallTreeId": "||BTEX-E09F8846-A50C-425A-8EA5-C9CFF22EC701",
            "Host": "produkte.metro.de",
            "Cookie": cookie,
        },
    });
    return res.data
}

const linkPrefix = 'https://produkte.metro.de/shop/pv/';

const getLinksForAllMetroItems = async () => {
    const links = await Item.findAll({
        attributes: ['website'],
        where: {
            website: {
                [Op.like]: linkPrefix + '%'
            }
        },
        raw: true,
    });
    return links.concat(await InvoiceEntry.findAll({
        attributes: [['productSite', 'website']],
        where: {
            productSite: {
                [Op.like]: linkPrefix + '%'
            }
        },
        raw: true,
    })).map(i => i.website);
}

const getPromotionInfo = (store) => {
    if (store.sellingPriceInfo?.appliedAdjustments.indexOf("promotion") > -1) {
        const promotion = store.sellingPriceInfo.promotionLabels.promotion;
        return {
            startDate: new Date(promotion.start),
            endDate: new Date(promotion.end),
        }
    }
    return null;
}

function splitListIntoChunks(array, chunkSize) {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        const chunk = array.slice(i, i + chunkSize);
        result.push(chunk);
    }
    return result;
}

const getCurrentPromotions = async (cookie) => {
    const links = await getLinksForAllMetroItems();
    const seenIds = new Set();
    const ids = links.map(link => link.substring(linkPrefix.length)).map(link => {
        const res = link.split('/');
        return {
            id: res[0],
            variantId: res[1],
            searchId: res[0] + res[1],
        };
    }).filter(id => {
        if (seenIds.has(id.searchId)) {
            return false;
        }
        seenIds.add(id.searchId);
        return true;
    });
    const currentPromotions = [];
    for (let chunk of splitListIntoChunks(ids, 20)) {
        const result = await getItemsFromMetro(chunk.map(id => id.searchId), cookie);
        for (let id of chunk) {
            if (!result.result[id.id]) {
                continue;
            }
            const bundleMap = result.result[id.id].variants[id.variantId].bundles;
            const bundles = Object.values(bundleMap).sort((a, b) => Number(a.bundleSize) - Number(b.bundleSize));
            if (bundles.length === 0) {
                console.error(`No bundle for ${id.id}`);
                console.log(id.bundleId, " ## ", result.result[id.id].variants[id.variantId].bundles);
                continue;
            }
            const bundle = bundles[0];
            const store = bundle.stores[storeId];
            const promoInfo = getPromotionInfo(store);
            if (promoInfo) {
                promoInfo.url = `https://produkte.metro.de/shop/pv/${id.id}/${id.variantId}/${bundle.bundleId.bundleNumber}`;
                promoInfo.name = bundle.description;
                promoInfo.originalPrice = store.sellingPriceInfo.grossStrikeThrough || (store.sellingPriceInfo.shelfPrice * 1.19);
                if (!promoInfo.originalPrice) {
                    console.error(`No original price for ${id.id}`);
                    console.log(JSON.stringify(store.sellingPriceInfo));
                }
                promoInfo.discountPrice = store.sellingPriceInfo.listGrossPrice;
                currentPromotions.push(promoInfo);

            }
        }
    }
    return currentPromotions;
};

function escapeString(str) {
    const charsToEscape = /[_*\[\]()~`>#+=\-|{}\.!]/g;
    return str.replace(charsToEscape, match => '\\' + match);
}

const formatPromotions = (promotions) => {
    // Group promotions by end date
    const groupedPromotions = promotions.reduce((acc, promo) => {
        const endDate = promo.endDate.toISOString().split('T')[0];
        if (!acc[endDate]) acc[endDate] = [];
        acc[endDate].push(promo);
        return acc;
    }, {});

    // Sort end dates
    const sortedDates = Object.keys(groupedPromotions).sort();

    const e = escapeString;
    // Format message
    let message = '';
    sortedDates.forEach(endDate => {
        const startDate = groupedPromotions[endDate][0].startDate;
        const formattedStartDate = startDate.toLocaleDateString('de-DE');
        const formattedEndDate = new Date(endDate).toLocaleDateString('de-DE');

        message += `*Promotions from ${e(formattedStartDate)} to ${e(formattedEndDate)}*\n`;

        groupedPromotions[endDate].forEach(promo => {
            const discountPercentage = ((promo.originalPrice - promo.discountPrice) / promo.originalPrice * 100).toFixed(1);
            message += `• [${e(promo.name)}](${promo.url}) `;
            message += `  ~${e(promo.originalPrice.toFixed(2))}€~ → ${e(promo.discountPrice.toFixed(2))}€ \\(\\-${e(discountPercentage)}%\\)\n`;
        });
    });

    return message.trim();
};



bot.onText(/\/metro/, msg => {
    cookieRegex = /-H 'Cookie: ([^']*)/;
    const cookie = msg.text.match(cookieRegex);
    let cookieString = "";
    if (cookie && cookie[1]) {
        cookieString = cookie[1];
    }
    let waitMsg = bot.sendMessage(msg.chat.id, `Rufe Angebote ab (${cookieString ? "mit" : "ohne"} Cookie) ...`);
    getCurrentPromotions(cookieString).then(async p => {
        if (p.length > 0) {
            let message = formatPromotions(p);
            message += '\n\n Send /subscribeMetro to subscribe to Metro promotions\\.';
            bot.editMessageText(message, { chat_id: msg.chat.id, message_id: (await waitMsg).message_id, parse_mode: 'MarkdownV2', disable_web_page_preview: true }).catch(console.error);
        } else {
            bot.editMessageText("No promotions found.", { chat_id: msg.chat.id, message_id: (await waitMsg).message_id }).catch(console.error);
        }
    }).catch(console.error);
});

bot.onText(/\/subscribeMetro/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        await TelegramMetroPromoSubscription.findOrCreate({
            where: { chatId: chatId },
            defaults: { chatId: chatId }
        });
        await bot.sendMessage(chatId, 'You have successfully subscribed to Metro promotions!');
    } catch (error) {
        console.error('Error in subscribeMetro:', error);
        await bot.sendMessage(chatId, 'Sorry, there was an error processing your subscription. Please try again later.');
    }
});

bot.onText(/\/unsubscribeMetro/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        await TelegramMetroPromoSubscription.destroy({
            where: { chatId: chatId }
        });
        await bot.sendMessage(chatId, 'You have successfully unsubscribed from Metro promotions\\.');
    } catch (error) {
        console.error('Error in unsubscribeMetro:', error);
        await bot.sendMessage(chatId, 'Sorry, there was an error processing your unsubscription. Please try again later.');
    }
});

// Jeden Donnerstag um 12 Uhr
const issueCronJob = new CronJob('00 39 17 * * 4', function () {
    getCurrentPromotions().then(async p => {
        if (p.length > 0) {
            let message = formatPromotions(p);
            message += '\n\n Send /unsubscribeMetro to unsubscribe from Metro promotions\\.';
            for (let chat of await TelegramMetroPromoSubscription.findAll()) {
                bot.sendMessage(chat.chatId, message, { parse_mode: 'MarkdownV2', disable_web_page_preview: true }).catch(console.error);
            }
        }
    }).catch(console.error);
}, null, true);
