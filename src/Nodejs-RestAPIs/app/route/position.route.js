import { findAll, getAllForSelect, getAllWithImages, findById, getAllUsedImages, create, update, delete as delete_ } from '../controller/position.controller';
export default function (app) {

    app.get('/api/positions', findAll);
    app.get('/api/positionsForSelect', getAllForSelect);
    app.get('/api/positionsWithImages', getAllWithImages);
    app.get('/api/position/:id', findById);

    app.get('/api/positions/images', getAllUsedImages);

    app.post('/api/position', create);
    app.put('/api/position/:id', update);
    app.delete('/api/position/:id', delete_);
};
