import { getAll, findById, getAllForSelect, getAllWithPositions, getAllItemGroupsAtPosition, create, update } from '../controller/itemgroup.controller';
export default function (app) {

    app.get('/api/itemGroups', getAll);
    app.get('/api/itemGroup/:id', findById);
    app.get('/api/itemGroupsForSelect', getAllForSelect);
    app.get('/api/itemGroupsWithPositions', getAllWithPositions);
    app.get('/api/position/:positionId/itemGroups', getAllItemGroupsAtPosition);

    app.post('/api/itemGroup', create);
    app.put('/api/itemGroup/:id', update);
};
