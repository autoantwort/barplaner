import { getAll, getAllWithGroupsAndPositions, getAllForSelect, getAllWithImage, findById, create, update } from '../controller/item.controller';
export default function (app) {

    app.get('/api/items', getAll);
    app.get('/api/itemsWithGroupsAndPositions', getAllWithGroupsAndPositions);
    app.get('/api/itemsForSelect', getAllForSelect);
    app.get('/api/itemsWithImage', getAllWithImage);
    app.get('/api/item/:id', findById);

    app.post('/api/item', create);
    app.put('/api/item/:id', update);
};
