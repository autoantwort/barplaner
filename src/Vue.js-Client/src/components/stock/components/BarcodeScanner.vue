<template>
  <div ref="scanner" :style="{ display: running ? 'block' : 'none' }">
    <div class="row mb-2">
      <div class="col-md-10">
        <select ref="cameraSelect" class="form-control form-control-sm" :on-change="onCameraChanged"></select>
      </div>
      <div class="col-md-2">
        <button id="closeButton" class="btn btn-danger btn-sm float-right" @click="stop">Close</button>
      </div>
    </div>
    <video ref="camera" class="rounded" style="width: 100%; height: 100%;" muted autoplay="autoplay" playsinline="playsinline" webkit-playsinline></video>
  </div>
</template>

<script>
// Code adapted from https://github.com/xulihang/barcode-detection-api-demo/blob/cc7210d65b31fad129a97a1a2177fe69add13d76/scanner.js
export default {
  name: "barcode-scanner",
  props: ["callback"],
  methods: {
    loadDevicesAndPlay() {
      if (this.barcodeDetector == null) {
        alert(
          "Barcode Detection API is not supported in this browser (Probably Safari or Firefox). " +
          "Please use Chrome or some Chromium-based browser (e.g. Edge, Opera, Brave, Vivaldi, ...)\n\n" +
          "You can also use a Scanner App and specify https://orga.symposion.hilton.rwth-aachen.de/#/addStockChange?barcode={code} as the search URL.\n" +
          "On IOS you can for example use 'QRbot' (Settings ➔ Search Options) , on Android 'Qr & Barcode Scanner von Simple Design Ltd.' (Einstallungen ➔ Scrollen ➔ Kundenspezifische Maßnahme). Select 'Products' as category in both apps."
        );
        return;
      }
      var constraints = { video: true, audio: false };
      navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        stream.getVideoTracks().forEach(track => {
          console.log("track state", track.readyState, track.enabled, track.muted, track.kind, track.label, track.id);
          track.enabled = true;
        });
        this.localStream = stream;
        var cameraselect = this.$refs.cameraSelect;
        cameraselect.innerHTML = "";
        navigator.mediaDevices.enumerateDevices().then((devices) => {
          var count = 0;
          var cameraDevices = [];
          var defaultIndex = 0;
          for (var i = 0; i < devices.length; i++) {
            var device = devices[i];
            if (device.kind == 'videoinput') {
              cameraDevices.push(device);
              var label = device.label || `Camera ${count++}`;
              cameraselect.add(new Option(label, device.deviceId));
              if (label.toLowerCase().indexOf("back") != -1) {
                defaultIndex = cameraDevices.length - 1;
              }
            }
          }

          if (cameraDevices.length > 0) {
            cameraselect.selectedIndex = defaultIndex;
            this.play(cameraDevices[defaultIndex].deviceId);
          } else {
            alert("No camera detected.");
          }
        });

      });
    },

    play(deviceId, HDUnsupported) {
      this.stop();
      this.running = true;
      var constraints = {};

      if (!!deviceId) {
        constraints = {
          video: { deviceId: deviceId },
          audio: false
        }
      } else {
        constraints = {
          video: true,
          audio: false
        }
      }

      navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        this.localStream = stream;
        var camera = this.$refs.camera;
        // Attach local stream to video element
        camera.srcObject = stream;

      }).catch((err) => {
        console.error('getUserMediaError', err, err.stack);
        alert(err.message);
      });
    },
    stop() {
      this.running = false;
      clearInterval(this.interval);
      try {
        if (this.localStream) {
          this.localStream.getTracks().forEach(track => track.stop());
        }
      } catch (e) {
        alert(e.message);
      }
    },
    onCameraChanged() {
      var cameraselect = this.$refs.cameraSelect;
      var deviceId = cameraselect.selectedOptions[0].value;
      this.play(deviceId);
    },
    onPlayed() {
      this.startDecoding();
    },
    startDecoding() {
      clearInterval(this.interval);
      //1000/25=40
      this.interval = setInterval(this.decode, 40);
    },
    async decode() {
      if (!this.decoding) {
        var video = this.$refs.camera;
        this.decoding = true;
        var barcodes = await this.barcodeDetector.detect(video);
        this.decoding = false;
        if (barcodes.length > 0) {
          var barcode = barcodes[0];
          if (this.callback) {
            this.callback(barcode.rawValue);
          }
          this.stop();
        }
      }
    }
  },
  data() {
    return {
      running: false,
      decoding: false,
      barcodeDetector: null,
    };
  },
  mounted() {
    this.$refs.camera.addEventListener('loadeddata', this.onPlayed, false);
  },
  async created() {
    if ('BarcodeDetector' in window) {
      let formats = await window.BarcodeDetector.getSupportedFormats();
      if (formats.length > 0) {
        this.barcodeDetector = new window.BarcodeDetector();
      }
    }
  },
  beforeDestroy() {
    this.stop();
  },
};
</script>
<style></style>
