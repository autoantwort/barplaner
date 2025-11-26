import { promises as fs } from 'fs';
import env from '../config/env';

const clients = new Set();

const filePath = env.fileStoragePath + '/shoppingListText.txt';
let shoppingListText = "";
(async () => {
    try {
        shoppingListText = await fs.readFile(filePath, 'utf-8');
    } catch (error) {
        console.error('Error reading file:', error);
    }
})();


export function registerWebSocketListener (app) {
    app.ws('/shoppingListText', (ws, req) => {
        clients.add(ws);
        ws.send(shoppingListText);
        ws.on('error', err => {
            console.error("Fehler bei einem Websocket unter /shoppingListText", err);
        });
        ws.on('message', msg => {
            if (ArrayBuffer.isView(msg)) {
                const decoder = new TextDecoder();
                msg = decoder.decode(msg);
            }
            clients.forEach(c => {
                if (c !== ws) {
                    c.send(msg)
                }
            });
            shoppingListText = msg;
            fs.writeFile(filePath, shoppingListText, 'utf-8');
        });
        ws.on('close', (code, reason) => {
            clients.delete(ws);
        });
    });
}
