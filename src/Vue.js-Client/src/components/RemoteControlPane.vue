<template>
  <div class="container">
    <div class="row mt-2">
      <div class="col-12">
        <div
          v-if="!connected"
          class="alert alert-danger text-center"
          role="alert"
        >Currently not connected</div>
        <p v-if="isTouch" class="alert alert-info text-center" role="alert">
          Hold a item to move it.
          <br />
          <input type="checkbox" id="move" v-model="enableMove" />
          <label for="move" style="margin-left: 5px">Enable move</label>
        </p>
        <div
          v-if="cantMoveCount>0"
          class="alert alert-warning text-center"
          role="alert"
        >In some control panels you don't have the rights to move the items</div>
        <div v-for="(client, key) in clients" :key="key">
          <h2>{{client.name}}</h2>
          <div
            class="pane"
            v-on:drop="handleDrop"
            v-on:dragover="handleDragOver"
            v-on:touchmove="handleTouchMove"
            v-on:touchend="handleTouchEnd"
            v-on:touchcancel="handleTouchEnd"
            v-bind:style="{'touch-action'  : draggedItem !==null ? 'none':''}"
            :canMoveItems="client.canMoveItems"
          >
            <div
              class="item"
              v-for="(item, ikey) in client.data"
              :key="ikey"
              v-bind:style="{ left: (mobilePositions ? item.mobileX : item.x)*70+'px', top: (mobilePositions ? item.mobileY : item.y)*70+'px', height: (item.type === 'DIMMER_GROUP') * 210  + 70 + 'px', width: (item.type !== 'DIMMER_GROUP') * 140  + 70 + 'px' }"
              :id="key+ikey+'Root'"
              v-on:dragstart="handleDragStart($event,client.name+'.'+ikey+'.')"
              draggable="true"
              v-on:touchstart="handleTouchStart($event,client.name+'.'+ikey+'.')"
            >
              <h5
                class="text-center"
                v-bind:class="{'vertical-name':item.type !== 'DIMMER_GROUP'}"
              >{{item.name}}</h5>

              <div
                v-if="item.type === 'DIMMER_GROUP'"
                style="top:25%; position:absolute;width:100%;height:75%"
              >
                <input
                  type="range"
                  orient="vertical"
                  v-model="item.value"
                  min="0"
                  max="255"
                  step="1"
                  v-on:input="webSocket.send(client.name + '.' + ikey + '.' + 'value:' + item.value)"
                />
                <div class="text-center" style="height:20%;width:100%;">{{item.value}}</div>
              </div>
              <div v-else-if="item.type === 'PROGRAMM'" class="icon-div">
                <font-awesome-icon
                  class="icon"
                  v-show="item.running === 'false'"
                  icon="play"
                  v-on:click="webSocket.send(client.name + '.' + ikey + '.running:true');item.running='true';"
                />
                <font-awesome-icon
                  class="icon"
                  v-show="item.running === 'true'"
                  icon="pause"
                  v-on:click="webSocket.send(client.name + '.' + ikey + '.running:false');item.running='false';"
                />
              </div>
              <div v-else-if="item.type === 'SWITCH_GROUP'" class="icon-div" :id="key+ikey">
                <font-awesome-icon
                  class="icon"
                  v-show="item.activated === 'false'"
                  icon="play"
                  v-on:click="item.activated='true';webSocket.send(client.name + '.' + ikey + '.activated:true');"
                />
                <font-awesome-icon
                  class="icon"
                  v-show="switchShow(item.activated === 'true', key+ikey, item.activateCooldown, item.deactivateCooldown)"
                  icon="pause"
                  v-on:click="item.activated='false';webSocket.send(client.name + '.' + ikey + '.activated:false');"
                />
              </div>
              <div v-else-if="item.type === 'PROGRAM_BLOCK'" class="icon-div" :id="key+ikey">
                <font-awesome-icon
                  title="Play"
                  class="icon"
                  v-show="item.state === 'Stopped'"
                  icon="play"
                  v-on:click="webSocket.send(client.name + '.' + ikey + '.state:start');"
                />
                <div v-show="item.state === 'Running'" style="width:100%;height:100%">
                  <font-awesome-icon
                    title="Stop"
                    class="half-icon"
                    icon="stop"
                    v-on:click="webSocket.send(client.name + '.' + ikey + '.state:stop');"
                  />
                  <font-awesome-icon
                    title="Pause"
                    class="half-icon"
                    icon="pause"
                    v-on:click="webSocket.send(client.name + '.' + ikey + '.state:pause');"
                  />
                </div>
                <div v-show="item.state === 'Paused'" style="width:100%;height:100%">
                  <font-awesome-icon
                    title="Restart"
                    class="half-icon"
                    icon="redo"
                    v-on:click="webSocket.send(client.name + '.' + ikey + '.state:restart');"
                  />
                  <font-awesome-icon
                    title="Resume"
                    class="half-icon"
                    icon="step-forward"
                    v-on:click="webSocket.send(client.name + '.' + ikey + '.state:resume');"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "remote-control-pane",
  data() {
    return {
      connected: false,
      clients: {},
      draggedItem: null,
      draggedItemPath: null,
      offsetX: 0,
      offsetY: 0,
      isTouch: false,
      enableMove: false,
      mobilePositions: false,
      cantMoveCount: 0
    };
  },
  methods: {
    /* eslint-disable no-console */
    handleTouchStart(e, item) {
      if (this.enableMove) {
        let target = e.target;
        while (target !== null && !target.classList.contains("item")) {
          target = target.parentElement;
        }
        if (target.parentElement.getAttribute("canMoveItems") !== "true")
          return;

        this.draggedItem = target;
        const rect = target.getBoundingClientRect();
        this.offsetX = e.touches[0].clientX - rect.left;
        this.offsetY = e.touches[0].clientY - rect.top;
        target.style["border-color"] = "red";
        e.preventDefault();
        this.draggedItemPath = item;
      }
    },
    handleTouchMove(e) {
      if (this.draggedItem !== null) {
        e.clientX = e.touches[0].clientX;
        e.clientY = e.touches[0].clientY;
        this.handleDragOver(e);
      }
    },
    handleTouchEnd(e) {
      if (this.draggedItem !== null) {
        e.preventDefault();
        this.draggedItem.style["border-color"] = "blue";
        this.draggedItem = null;
      }
    },
    handleDragStart(e, item) {
      if (e.target.parentElement.getAttribute("canMoveItems") !== "true")
        return;
      this.draggedItem = e.target;
      this.draggedItemPath = item;
      const rect = e.target.getBoundingClientRect();
      this.offsetX = e.clientX - rect.left;
      this.offsetY = e.clientY - rect.top;
      e.target.style["border-color"] = "red";
    },
    handleDrop(e) {
      e.preventDefault();
      this.draggedItem.style["border-color"] = "blue";
      this.draggedItem = null;
    },
    handleDragOver(e) {
      e.preventDefault();
      e.stopPropagation();
      const item = this.draggedItem;
      const rect = item.parentElement.getBoundingClientRect();
      const x = e.clientX - rect.left - this.offsetX;
      const y = e.clientY - rect.top - this.offsetY;
      item.style.left = (x / 70).toFixed() * 70 + "px";
      item.style.top = (y / 70).toFixed() * 70 + "px";
      const xName = this.mobilePositions ? "mobileX" : "x";
      const yName = this.mobilePositions ? "mobileY" : "y";
      this.webSocket.send(
        this.draggedItemPath + xName + ":" + (x / 70).toFixed()
      );
      this.webSocket.send(
        this.draggedItemPath + yName + ":" + (y / 70).toFixed()
      );
    },
    switchShow(activated, id, activateCooldown, deactivateCooldown) {
      const iconDiv = document.getElementById(id);
      if (iconDiv === null)
        // while first call
        return activated;
      const attr = iconDiv.getAttribute("activated");

      // if (attr === null):the first time we don't know if the user clicked the button or some other property changed

      if (attr === "" + activated) {
        return activated;
      }
      iconDiv.setAttribute("activated", activated);

      this.cooldown(iconDiv, activated ? activateCooldown : deactivateCooldown);
      return activated;
    },
    cooldown(iconDiv, duration) {
      iconDiv.style["pointer-events"] = "none";
      for (let icon of iconDiv.children) {
        icon.style.color = "#505050";
      }
      const start = performance.now();
      const callback = timestamp => {
        const progress = ((timestamp - start) / duration) * 100;
        if (progress >= 100) {
          iconDiv.style["pointer-events"] = "";
          iconDiv.style.background = "";
          for (let icon of iconDiv.children) {
            icon.style.color = "";
          }
        } else {
          iconDiv.style.background =
            "linear-gradient(#fff " +
            progress +
            "%, #808080 " +
            progress +
            "%)";
          requestAnimationFrame(callback);
        }
      };
      requestAnimationFrame(callback);
    },
    initialize() {
      this.webSocket.onopen = () => {
        this.connected = true;
      };
      this.webSocket.onerror = function(event) {
        console.error("WebSocket error observed:", event);
      };
      this.webSocket.onclose = () => {
        this.connected = false;
      };
      this.webSocket.onmessage = event => {
        // https://vuejs.org/v2/guide/list.html#Object-Change-Detection-Caveats
        // https://vuejs.org/v2/api/#vm-set
        const msg = event.data.split(":");
        if (msg[0] === "add") {
          this.$root.$set(this.clients, msg[1].replace(" ", "_"), {
            name: msg[1],
            data: {}
          });
        } else if (msg[0] === "remove") {
          // delete this.clients[msg[1].replace(' ', '_')];
          this.$root.$delete(this.clients, msg[1].replace(" ", "_"));
        } else if (msg[0] === "rename") {
          this.$root.$set(
            this.clients,
            msg[2].replace(" ", "_"),
            this.clients[msg[1].replace(" ", "_")]
          );
          this.$root.$delete(this.clients, msg[1].replace(" ", "_"));
          //this.clients[msg[2].replace(' ', '_')] = this.clients[msg[1].replace(' ', '_')];
          //delete this.clients[msg[1].replace(' ', '_')];
          this.clients[msg[2].replace(" ", "_")].name = msg[2];
        } else {
          // example message: "BarPC.add:{"id":3, ...}"
          // example message: "BarPC.remove:23"
          // example message: "BarPC.23.value:255"
          const keys = msg[0].split(".");
          keys[0] = keys[0].replace(" ", "_");
          if (keys[1] === "add") {
            const item = JSON.parse(
              event.data.substring(event.data.indexOf(":") + 1)
            );
            //this.clients[keys[0]].data[item.id] = item;
            this.$root.$set(this.clients[keys[0]].data, item.id, item);
          } else if (keys[1] === "remove") {
            // delete this.clients[keys[0]][msg[1]] ;
            this.$root.$delete(this.clients[keys[0]].data, msg[1]);
          } else if (keys[1] === "canMoveItems") {
            if (this.clients[keys[0]].canMoveItems !== undefined) {
              if (this.clients[keys[0]].canMoveItems != msg[1]) {
                if (msg[1] === "true") this.cantMoveCount--;
                else this.cantMoveCount++;
              }
            } else {
              if (msg[1] === "false") this.cantMoveCount++;
            }
            this.$root.$set(this.clients[keys[0]], "canMoveItems", msg[1]);
          } else {
            // this.clients[keys[0]].data[keys[1]][keys[2]] = msg[1];
            this.$root.$set(
              this.clients[keys[0]].data[keys[1]],
              keys[2],
              msg[1]
            );
          }
        }
      };
    }
    /* eslint-enable no-console */
  },
  created() {
    this.webSocket = new WebSocket(
      "wss://orga.symposion.hilton.rwth-aachen.de/controlPaneMaster"      
    );
    this.initialize();
    this.isTouch = "ontouchstart" in window;
    window.onresize = () => (this.mobilePositions = window.innerWidth < 500);
    this.mobilePositions = window.innerWidth < 500;
  },
  beforeDestroy() {
    this.webSocket.close();
  }
};
</script>

<style>
.pane {
  position: relative;
  height: 500px;
}
.item {
  user-select: none;
  position: absolute;
  border-style: solid !important;
  border-color: blue;
  border-width: 2px;
  border-radius: 4px;
}
.vertical-name {
  left: 70px;
  height: 100%;
  text-align: center;
  line-height: 65px;
  position: absolute;
}
.icon-div {
  width: 33%;
  height: 100%;
}
.icon {
  width: 100% !important  ;
  height: 100%;
  padding: 7px;
}
.half-icon {
  width: 50% !important;
  height: 100%;
  padding: 4px;
}
/*from https://stackoverflow.com/questions/15935837/how-to-display-a-range-input-slider-vertically */
input[type="range"][orient="vertical"] {
  writing-mode: bt-lr; /* IE */
  -webkit-appearance: slider-vertical; /* WebKit */
  width: 100%;
  height: 80%;
}
</style>
