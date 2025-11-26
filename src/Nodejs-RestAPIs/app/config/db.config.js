const { sequelize, Sequelize } = require('./database.js');

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

//Models/tables
db.User = require('../model/user.model.js').User;
db.Bar = require('../model/bar.model.js').Bar;
db.Role = require('../model/role.model.js').Role;
db.BarDuty = require('../model/barduty.model.js').Barduty;
db.UserRoles = require('../model/userroles.model.js').UserRoles;
db.Setting = require('../model/setting.model.js').Setting;
db.ShouldDelete = require('../model/shouldDelete.model.js').ShouldDelete;
db.TelegramNewsletter = require('../model/telegramNewsletter.model').TelegramNewsletter;
db.WebPushSubscription = require('../model/webPushSubscription.model').WebPushSubscription;
db.TelegramMetroPromoSubscription = require('../model/telegramMetroPromoSubscription.model.js').TelegramMetroPromoSubscription;

db.File = require('../model/file.model.js').File;
db.Image = require('../model/image.model.js').Image;
db.stock = {};
db.stock.Position = require('../model/stockManagement/position.model').Position;
db.stock.ItemGroup = require('../model/stockManagement/itemGroup.model').ItemGroup;
db.stock.Item = require('../model/stockManagement/item.model').Item;
db.stock.ItemRequest = require('../model/stockManagement/itemRequest.model.js').ItemRequest;
db.stock.Invoice = require('../model/stockManagement/invoice.model').Invoice;
db.stock.InvoiceEntry = require('../model/stockManagement/invoiceEntry.model').InvoiceEntry;
db.stock.Change = require('../model/stockManagement/change.model').StockChange;
db.stock.ChangeLog = require('../model/stockManagement/changeLog.model').StockChangeLog;


let funcArray = [];

db.addSyncCallback = function (func) {
    if (funcArray === null)
        func();
    else
        funcArray.push(func);
};

db.callSyncCallbacks = function () {
    for (let func of funcArray) {
        func();
    }
    funcArray = null;
};

export default db;
