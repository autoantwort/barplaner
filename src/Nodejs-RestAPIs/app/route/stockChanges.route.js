module.exports = function(app) {
    const changes = require('../controller/stockChange.controller');

    app.post('/api/stockChange', changes.create);

    app.get('/api/itemStock', changes.getItemStock);
    app.get('/api/stockChanges', changes.getStockChanges);
    app.get('/api/:date/stockChanges', changes.getAllChangesAtDay);
    app.get('/api/itemGroupStock', changes.getItemGroupStock);
    app.get('/api/item/:itemId/stock', changes.getStockForItem);
    app.get('/api/item/:itemId/stockChanges', changes.getStockChangesForItem);
    app.get('/api/itemGroup/:itemGroupId/itemStock', changes.getItemStockForItemGroup);
    app.get('/api/itemGroup/:itemGroupId/stockChanges', changes.getStockChangesForItemGroup);
    app.get('/api/position/:positionId/itemStock', changes.getItemStockForPosition);
    app.get('/api/stockChanges/dates', changes.getAllDatesWhereChangesHappen);
};