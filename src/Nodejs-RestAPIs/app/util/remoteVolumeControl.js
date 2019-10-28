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
                    // save last volume, so that new mastern know the current volume
                    clients[name].lastValue = msg.substring(6);
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
        // send all know clients to the new master
        for (let c in clients) {
            ws.send("Add:" + c);
            ws.send("Value:" + c + ":" + clients[c].lastValue);
        }
        ws.on('message', msg => {
            // master setting volume, format: <name>:<value>
            const strings = msg.split(":");
            if (clients[strings[0]] !== undefined) {
                clients[strings[0]].send(strings[1]);
                clients[strings[0]].lastValue = strings[1];
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
