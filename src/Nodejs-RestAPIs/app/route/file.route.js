module.exports = function(app) {
    const file = require('../controller/file.controller');

    app.get('/api/image/:id', file.getImageById);
};