import { getImageById } from '../controller/file.controller';
export default function (app) {

    app.get('/api/image/:id', getImageById);
};
