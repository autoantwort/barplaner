module.exports = function(app) {

    const setting = require('../controller/setting.controller.js');


    // Retrieve all settings
    app.get('/api/settings', setting.getAll);

    // Retrieve a setting by name
    app.get('/api/setting/:name', setting.getOne);

    // Update a setting by name
    app.put('/api/setting/:name', setting.updateOne);

};