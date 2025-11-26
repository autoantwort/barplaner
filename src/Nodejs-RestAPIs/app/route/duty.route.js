import { list, sendTelegramNewsletter } from '../controller/duty.controller.js';
export default function (app) {
    app.get('/api/duty', list);
    app.post('/api/duty/:id/sendTelegramNewsletter', sendTelegramNewsletter);
};
