module.exports = function(app) {

    const bar = require('../controller/bar.controller.js');

    // Create a new Bar
    app.post('/api/bar', bar.create);

    // Retrieve all Bars
    app.get('/api/bars', bar.findAll);

    // Retrieve all Bars with Barduties
    app.get('/api/bars/duties', bar.getAllBarsWithBarduties);
    // update cleaning
    app.put('/api/bar/:barID/duty/:userID/cleaning', bar.updateCleaning);
    // update cleaning
    app.put('/api/bar/:barID/duty/:userID', bar.updateDuty);

    // update duty
    app.post('/api/bar/:barID/duty', bar.distributeCleaningDuty);

    // Retrieve a single bar by Id
    app.get('/api/bar/:barID', bar.findById);

    // Update a bar with Id
    app.put('/api/bar/:barID', bar.update);

    // Delete a Bar with Id
    app.delete('/api/bar/:barID', bar.delete);
};