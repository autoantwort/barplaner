module.exports = function(app) {
    const itemGroup = require('../controller/itemgroup.controller');

    app.get('/api/itemGroups', itemGroup.getAll);
    app.get('/api/itemGroup/:id', itemGroup.findById);
    app.get('/api/itemGroupsForSelect', itemGroup.getAllForSelect);
    app.get('/api/itemGroupsWithPositions', itemGroup.getAllWithPositions);
    app.get('/api/position/:positionId/itemGroups', itemGroup.getAllItemGroupsAtPosition);

    app.post('/api/itemGroup', itemGroup.create);
    app.put('/api/itemGroup/:id', itemGroup.update);
};