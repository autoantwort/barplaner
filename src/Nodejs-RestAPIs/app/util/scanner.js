const controllers = [];

function sendMessageToController(msg) {
    controllers.filter(c => c.readyState === 1 /*WebSocket.OPEN*/ ).forEach(c => c.send(msg));
}

exports.registerClients = function(app) {
    app.ws('/scanner', (ws, req) => {
        ws.on('message', msg => {
            sendMessageToController(msg);
        });
        ws.on('close', (code, reason) => {
            // ignore
        });
    });
};
exports.registerMasters = app => {
    app.ws('/scannerConsumer', (ws, req) => {
        controllers.push(ws);
        ws.on('message', msg => {
            // I don't know what they want to send
        });
        ws.on('close', (code, reason) => {
            const index = controllers.indexOf(ws);
            if (index > -1) {
                controllers.splice(index, 1);
            }
        });
    });
};