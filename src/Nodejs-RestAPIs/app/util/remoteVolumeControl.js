import { client, retain } from "./mqttClient";

const clients = {};
const controllers = [];

function sendMessageToController(msg) {
    controllers.filter(c => c.readyState === 1 /*WebSocket.OPEN*/ ).forEach(c => c.send(msg));
}

export function registerClients(app) {
    app.ws('/volumeClient', (ws, req) => {
        let name = "unnamed";
        clients[name] = ws;
        ws.on('error', err => {
            console.error("Fehler bei einem Websocket unter /volumeClient", err);
        });
        ws.on('message', msg => {
            if (ArrayBuffer.isView(msg)) {
                const decoder = new TextDecoder();
                msg = decoder.decode(msg);
            }
            if (msg.startsWith("Name:")) {
                const newName = msg.substring(5);
                if (name === "unnamed") {
                    sendMessageToController("Add:" + newName);
                } else {
                    client.publish(`barplaner/volume/${name}/online`, '0', retain);
                    sendMessageToController("Rename:" + name + ":" + newName);
                }
                delete clients[name];
                name = newName;
                clients[name] = ws;
                client.publish(`barplaner/volume/${name}/online`, '1', retain);
            } else if (msg.startsWith("Value:")) {
                if (name !== "unnamed") {
                    // save last volume, so that new mastern know the current volume
                    const value = msg.substring(6);
                    clients[name].lastValue = value;
                    sendMessageToController("Value:" + name + ":" + value);
                    client.publish(`barplaner/volume/${name}/value`, value, retain);
                }
            }
        });
        ws.on('close', (code, reason) => {
            delete clients[name];
            sendMessageToController("Remove:" + name);
            client.publish(`barplaner/volume/${name}/value`, 'None', retain);
            client.publish(`barplaner/volume/${name}/online`, '0', retain);
        });
    });
}
export function registerMasters(app) {
    app.ws('/volumeMaster', (ws, req) => {
        ws.on('error', err => {
            console.error("Fehler bei einem Websocket unter /volumeMaster", err);
        });
        controllers.push(ws);
        // send all know clients to the new master
        for (let c in clients) {
            ws.send("Add:" + c);
            ws.send("Value:" + c + ":" + clients[c].lastValue);
        }
        ws.on('message', msg => {
            if (ArrayBuffer.isView(msg)) {
                const decoder = new TextDecoder();
                msg = decoder.decode(msg);
            }
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
}
