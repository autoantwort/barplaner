import { create, distributeCleaningDuty, findAll, findById, getAllBarsWithBarduties, update, updateCleaning, updateDuty, deleteBar } from "../controller/bar.controller";


export default function (app) {
    // Create a new Bar
    app.post('/api/bar', create);

    // Retrieve all Bars
    app.get('/api/bars', findAll);

    // Retrieve all Bars with Barduties
    app.get('/api/bars/duties', getAllBarsWithBarduties);
    // update cleaning
    app.put('/api/bar/:barID/duty/:userID/cleaning', updateCleaning);
    // update cleaning
    app.put('/api/bar/:barID/duty/:userID', updateDuty);

    // update duty
    app.post('/api/bar/:barID/duty', distributeCleaningDuty);

    // Retrieve a single bar by Id
    app.get('/api/bar/:barID', findById);

    // Update a bar with Id
    app.put('/api/bar/:barID', update);

    // Delete a Bar with Id
    app.delete('/api/bar/:barID', deleteBar);
};
