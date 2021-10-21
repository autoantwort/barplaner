module.exports = function(app) {
    const position = require('../controller/position.controller');

    app.get('/api/positions', position.findAll);
    app.get('/api/positionsForSelect', position.getAllForSelect);
    app.get('/api/positionsWithImages', position.getAllWithImages);
    app.get('/api/position/:id', position.findById);

    app.get('/api/positions/images', position.getAllUsedImages);

    app.post('/api/position', position.create);
    app.put('/api/position/:id', position.update);
    app.delete('/api/position/:id', position.delete);
};