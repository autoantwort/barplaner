import { getAll, getOne, updateOne } from '../controller/setting.controller.js';
export default function (app) {

    // Retrieve all settings
    app.get('/api/settings', getAll);

    // Retrieve a setting by name
    app.get('/api/setting/:name', getOne);

    // Update a setting by name
    app.put('/api/setting/:name', updateOne);

};
