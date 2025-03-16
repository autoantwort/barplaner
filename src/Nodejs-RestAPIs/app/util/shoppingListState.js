const clients = new Set();
const selectedItems = new Set();


exports.registerWebSocketListener = function (app) {
    app.ws('/shoppingListState', (ws, req) => {
        clients.add(ws);
        ws.send("Init:" + Array.from(selectedItems).join(","));
        ws.on('error', err => {
            console.error("Fehler bei einem Websocket unter /shoppingListState", err);
        });
        ws.on('message', msg => {
            if (ArrayBuffer.isView(msg)) {
                const decoder = new TextDecoder();
                msg = decoder.decode(msg);
            }
            if (msg.startsWith("Add:")) {
                selectedItems.add(msg.substring(4));
            } else if (msg.startsWith("Remove:")) {
                selectedItems.delete(msg.substring(7));
            } else if (msg.startsWith("Clear")) {
                selectedItems.clear();
            }
            clients.forEach(c => {
                if (c !== ws) {
                    c.send(msg)
                }
            });
        });
        ws.on('close', (code, reason) => {
            clients.delete(ws);
        });
    });
};