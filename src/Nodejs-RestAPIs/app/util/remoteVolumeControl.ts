namespace RemoteControlVolume {
  export const clients = {};
  export const controllers = [];

  export function sendMessageToController(msg) {
    controllers
      .filter((c) => c.readyState === 1 /*WebSocket.OPEN*/)
      .forEach((c) => c.send(msg));
  }
}

exports.registerClients = function (app) {
  app.ws("/volumeClient", (ws, req) => {
    let name = "unnamed";
    RemoteControlVolume.clients[name] = ws;
    ws.on("message", (msg) => {
      if (msg.startsWith("Name:")) {
        const newName = msg.substring(5);
        if (name === "unnamed") {
          RemoteControlVolume.sendMessageToController("Add:" + newName);
        } else {
          RemoteControlVolume.sendMessageToController(
            "Rename:" + name + ":" + newName
          );
        }
        delete RemoteControlVolume.clients[name];
        name = newName;
        RemoteControlVolume.clients[name] = ws;
      } else if (msg.startsWith("Value:")) {
        if (name !== "unnamed") {
          // save last volume, so that new mastern know the current volume
          RemoteControlVolume.clients[name].lastValue = msg.substring(6);
          RemoteControlVolume.sendMessageToController(
            "Value:" + name + ":" + msg.substring(6)
          );
        }
      }
    });
    ws.on("close", (code, reason) => {
      delete RemoteControlVolume.clients[name];
      RemoteControlVolume.sendMessageToController("Remove:" + name);
    });
  });
};

exports.registerMasters = (app) => {
  app.ws("/volumeMaster", (ws, req) => {
    RemoteControlVolume.controllers.push(ws);
    // send all know clients to the new master
    for (let c in RemoteControlVolume.clients) {
      ws.send("Add:" + c);
      ws.send("Value:" + c + ":" + RemoteControlVolume.clients[c].lastValue);
    }
    ws.on("message", (msg) => {
      // master setting volume, format: <name>:<value>
      const strings = msg.split(":");
      if (RemoteControlVolume.clients[strings[0]] !== undefined) {
        RemoteControlVolume.clients[strings[0]].send(strings[1]);
        RemoteControlVolume.clients[strings[0]].lastValue = strings[1];
        RemoteControlVolume.controllers
          .filter((c) => c !== ws && c.readyState === 1 /*WebSocket.OPEN*/)
          .forEach((c) => {
            c.send("Value:" + msg);
          });
      }
    });
    ws.on("close", (code, reason) => {
      const index = RemoteControlVolume.controllers.indexOf(ws);
      if (index > -1) {
        RemoteControlVolume.controllers.splice(index, 1);
      }
    });
  });
};
