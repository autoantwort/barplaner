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

db.File = require('../model/file.model.js')(sequelize, Sequelize);
db.Image = require('../model/image.model.js')(sequelize, Sequelize, db.File);
db.stock = {};
db.stock.Position = require('../model/stockManagement/position.model')(sequelize, Sequelize, db.Image);
db.stock.ItemGroup = require('../model/stockManagement/itemGroup.model')(sequelize, Sequelize, db.stock.Position);
db.stock.Item = require('../model/stockManagement/item.model')(sequelize, Sequelize, db.Image, db.stock.ItemGroup, db.stock.Position);
db.stock.ItemRequest = require('../model/stockManagement/itemRequest.model.js')(sequelize, Sequelize, db.stock.Item);
db.stock.Invoice = require('../model/stockManagement/invoice.model')(sequelize, Sequelize, db.File);
db.stock.InvoiceEntry = require('../model/stockManagement/invoiceEntry.model')(sequelize, Sequelize, db.stock.Invoice, db.stock.Item);
db.stock.Change = require('../model/stockManagement/change.model')(sequelize, Sequelize, db.stock.Item, db.User, db.stock.InvoiceEntry);
db.stock.ChangeLog = require('../model/stockManagement/changeLog.model')(sequelize, Sequelize, db.User, db.stock.Change);


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

module.exports = db;