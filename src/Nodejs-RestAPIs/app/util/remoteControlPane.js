const clients = {};
const controllers = [];

function sendMessageToController(msg) {
    controllers.filter(c => c.readyState === 1 /*WebSocket.OPEN*/ ).forEach(c => c.send(msg));
}

export function registerClients(app) {
    app.ws('/controlPaneClient', (ws, req) => {
        ws.on('error', err => {
            console.error("Fehler bei einem Websocket unter /controlPaneClient", err);
        });
        let name = "unnamed";
        clients[name] = { ws, data: {} };
        ws.on('message', msg => {
            if (ArrayBuffer.isView(msg)) {
                const decoder = new TextDecoder();
                msg = decoder.decode(msg);
            }
            if (msg.startsWith("name:")) {
                const newName = msg.substring(5);
                if (newName === "add" || newName === "remove" || clients[newName] !== undefined) {
                    // new name is not allowed
                    return;
                }
                if (name === "unnamed") {
                    sendMessageToController("add:" + newName);
                } else {
                    sendMessageToController("rename:" + name + ":" + newName);
                }
                clients[newName] = clients[name];
                delete clients[name];
                name = newName;
            } else if (msg.startsWith("add:")) {
                // save all items, so that new controllers get all existing items
                const newItem = JSON.parse(msg.substring(4));
                clients[name].data[newItem.id] = newItem;
                sendMessageToController(name + "." + msg);
            } else if (msg.startsWith("remove:")) {
                const id = JSON.parse(msg.substring(7));
                delete clients[name].data[id];
                sendMessageToController(name + "." + msg);
            } else if (msg.startsWith("canMoveItems:")) {
                clients[name].canMoveItems = msg.substring(13);
                sendMessageToController(name + "." + msg);
            } else {
                // example message: "34.value:55"
                const first = msg.split('.');
                const id = first[0];
                const second = first[1].split(':');
                const property = second[0];
                const value = second[1];
                // update internal cache
                clients[name].data[id][property] = value;
                // send update to controllers
                sendMessageToController(name + "." + msg);
            }
        });
        ws.on('close', (code, reason) => {
            delete clients[name];
            sendMessageToController("remove:" + name);
        });
    });
}
export function registerMasters(app) {
    app.ws('/controlPaneMaster', (ws, req) => {
        ws.on('error', err => {
            console.error("Fehler bei einem Websocket unter /controlPaneMaster", err);
        });
        controllers.push(ws);
        // send all know clients to the new master
        for (let c in clients) {
            ws.send("add:" + c);
            ws.send(c + ".canMoveItems:" + clients[c].canMoveItems);
            for (let id in clients[c].data) {
                ws.send(c + ".add:" + JSON.stringify(clients[c].data[id]));
            }
        }
        ws.on('message', msg => {
            if (ArrayBuffer.isView(msg)) {
                const decoder = new TextDecoder();
                msg = decoder.decode(msg);
            }
            // example message: "BarPC.34.value:55"
            const strings = msg.split(".");
            if (clients[strings[0]] !== undefined) {
                clients[strings[0]].ws.send(strings[1] + '.' + strings[2]);
                const keyValue = strings[2].split(":");
                clients[strings[0]].data[strings[1]][keyValue[0]] = keyValue[1];
                controllers.filter(c => c !== ws && c.readyState === 1 /*WebSocket.OPEN*/ ).forEach(c => {
                    c.send(msg);
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
}