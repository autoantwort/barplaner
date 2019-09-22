module.exports = function(app) {

    const survey = require('../controller/survey.controller.js');

    // Create a new Survey
    app.post('/api/survey', survey.create);
    // Retrieve all Surveys
    app.get('/api/surveys', survey.getAll);
};