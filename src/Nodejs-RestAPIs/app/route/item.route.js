module.exports = function(app) {
    const item = require('../controller/item.controller');

    app.get('/api/items', item.getAll);
    app.get('/api/itemsWithGroupsAndPositions', item.getAllWithGroupsAndPositions);
    app.get('/api/itemsForSelect', item.getAllForSelect);
    app.get('/api/itemsWithImage', item.getAllWithImage);
    app.get('/api/item/:id', item.findById);

    app.post('/api/item', item.create);
    app.put('/api/item/:id', item.update);
};