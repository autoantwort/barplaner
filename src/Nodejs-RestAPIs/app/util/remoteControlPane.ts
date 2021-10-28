namespace RemoteControlPane {
  export const clients = {};
  export const controllers = [];

  export function sendMessageToController(msg) {
    controllers
      .filter((c) => c.readyState === 1 /*WebSocket.OPEN*/)
      .forEach((c) => c.send(msg));
  }
}

exports.registerClients = function (app) {
  app.ws("/controlPaneClient", (ws, req) => {
    let name = "unnamed";
    RemoteControlPane.clients[name] = { ws, data: {} };
    ws.on("message", (msg) => {
      if (msg.startsWith("name:")) {
        const newName = msg.substring(5);
        if (
          newName === "add" ||
          newName === "remove" ||
          RemoteControlPane.clients[newName] !== undefined
        ) {
          // new name is not allowed
          return;
        }
        if (name === "unnamed") {
          RemoteControlPane.sendMessageToController("add:" + newName);
        } else {
          RemoteControlPane.sendMessageToController(
            "rename:" + name + ":" + newName
          );
        }
        RemoteControlPane.clients[newName] = RemoteControlPane.clients[name];
        delete RemoteControlPane.clients[name];
        name = newName;
      } else if (msg.startsWith("add:")) {
        // save all items, so that new controllers get all existing items
        const newItem = JSON.parse(msg.substring(4));
        RemoteControlPane.clients[name].data[newItem.id] = newItem;
        RemoteControlPane.sendMessageToController(name + "." + msg);
      } else if (msg.startsWith("remove:")) {
        const id = JSON.parse(msg.substring(7));
        delete RemoteControlPane.clients[name].data[id];
        RemoteControlPane.sendMessageToController(name + "." + msg);
      } else if (msg.startsWith("canMoveItems:")) {
        RemoteControlPane.clients[name].canMoveItems = msg.substring(13);
        RemoteControlPane.sendMessageToController(name + "." + msg);
      } else {
        // example message: "34.value:55"
        const first = msg.split(".");
        const id = first[0];
        const second = first[1].split(":");
        const property = second[0];
        const value = second[1];
        // update internal cache
        RemoteControlPane.clients[name].data[id][property] = value;
        // send update to controllers
        RemoteControlPane.sendMessageToController(name + "." + msg);
      }
    });
    ws.on("close", (code, reason) => {
      delete RemoteControlPane.clients[name];
      RemoteControlPane.sendMessageToController("remove:" + name);
    });
  });
};
exports.registerMasters = (app) => {
  app.ws("/controlPaneMaster", (ws, req) => {
    RemoteControlPane.controllers.push(ws);
    // send all know clients to the new master
    for (let c in RemoteControlPane.clients) {
      ws.send("add:" + c);
      ws.send(c + ".canMoveItems:" + RemoteControlPane.clients[c].canMoveItems);
      for (let id in RemoteControlPane.clients[c].data) {
        ws.send(
          c + ".add:" + JSON.stringify(RemoteControlPane.clients[c].data[id])
        );
      }
    }
    ws.on("message", (msg) => {
      // example message: "BarPC.34.value:55"
      const strings = msg.split(".");
      if (RemoteControlPane.clients[strings[0]] !== undefined) {
        RemoteControlPane.clients[strings[0]].ws.send(
          strings[1] + "." + strings[2]
        );
        const keyValue = strings[2].split(":");
        RemoteControlPane.clients[strings[0]].data[strings[1]][keyValue[0]] =
          keyValue[1];
        RemoteControlPane.controllers
          .filter((c) => c !== ws && c.readyState === 1 /*WebSocket.OPEN*/)
          .forEach((c) => {
            c.send(msg);
          });
      }
    });
    ws.on("close", (code, reason) => {
      const index = RemoteControlPane.controllers.indexOf(ws);
      if (index > -1) {
        RemoteControlPane.controllers.splice(index, 1);
      }
    });
  });
};
