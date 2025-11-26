import { create, getItemStock, getStockChanges, getStockChange, deleteStockChange, getStockChangeLog, getAllChangesAtDay, getItemGroupStock, getStockForItem, getStockChangesForItem, getItemStockForItemGroup, getStockChangesForItemGroup, getItemStockForPosition, getAllDatesWhereChangesHappen } from '../controller/stockChange.controller';
export default function (app) {

    app.post('/api/stockChange', create);

    app.get('/api/itemStock', getItemStock);
    app.get('/api/stockChanges', getStockChanges);
    app.get('/api/stockChange/:id', getStockChange);
    app.delete('/api/stockChange/:id', deleteStockChange);
    app.get('/api/stockChange/:id/changeLog', getStockChangeLog);
    app.get('/api/:date/stockChanges', getAllChangesAtDay);
    app.get('/api/itemGroupStock', getItemGroupStock);
    app.get('/api/item/:itemId/stock', getStockForItem);
    app.get('/api/item/:itemId/stockChanges', getStockChangesForItem);
    app.get('/api/itemGroup/:itemGroupId/itemStock', getItemStockForItemGroup);
    app.get('/api/itemGroup/:itemGroupId/stockChanges', getStockChangesForItemGroup);
    app.get('/api/position/:positionId/itemStock', getItemStockForPosition);
    app.get('/api/stockChanges/dates', getAllDatesWhereChangesHappen);
};
