const clients = {};
const controllers = [];

function sendMessageToController(msg) {
    controllers.filter(c => c.readyState === 1 /*WebSocket.OPEN*/ ).forEach(c => c.send(msg));
}

exports.registerClients = function(app) {
    app.ws('/volumeClient', (ws, req) => {
        let name = "unnamed";
        clients[name] = ws;
        ws.on('message', msg => {
            if (msg.startsWith("Name:")) {
                const newName = msg.substring(5);
                if (name === "unnamed") {
                    sendMessageToController("Add:" + newName);
                } else {
                    sendMessageToController("Rename:" + name + ":" + newName);
                }
                delete clients[name];
                name = newName;
                clients[name] = ws;
            } else if (msg.startsWith("Value:")) {
                if (name !== "unnamed") {
                    sendMessageToController("Value:" + name + ":" + msg.substring(6));
                }
            }
        });
        ws.on('close', (code, reason) => {
            delete clients[name];
            sendMessageToController("Remove:" + name);
        });
    });
};
exports.registerMasters = app => {
    app.ws('/volumeMaster', (ws, req) => {
        controllers.push(ws);
        ws.on('message', msg => {
            const strings = msg.split(":");
            if (clients[strings[0]] !== undefined) {
                clients[strings[0]].send(strings[1]);
                controllers.filter(c => c !== ws && c.readyState === 1 /*WebSocket.OPEN*/ ).forEach(c => {
                    c.send("Value:" + msg);
                });
            }
        });
        ws.on('close', (code, reason) => {
            const index = controllers.indexOf(ws);
            if (index > -1) {
                controllers.splice(index, 1);
            }
        });
    });
};