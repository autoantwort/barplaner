module.exports = function(app) {

    const duty = require('../controller/duty.controller.js');


    app.get('/api/duty', duty.list);

};