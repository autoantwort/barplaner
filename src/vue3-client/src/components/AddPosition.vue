<template>
  <div>
    <label>Optional: Select an image and a position on the image</label>
    <br />
    <div class="row row-cols-1 row-cols-md-2">
      <div v-for="image in existingImages" :key="image.id" class="col mb-4">
        <div class="card" :imageId="image.id">
          <img :src="baseURL + image.compressed" :original="image.original" class="card-img-top no-high-images" />
          <div class="card-body">
            <p class="card-text">{{ image.titel ? image.titel : 'No name' }}</p>
            <button type="button" class="btn btn-success" v-on:click="selectCard">Select</button>
          </div>
        </div>
      </div>
      <div class="col mb-4">
        <div class="card">
          <img ref="cardOutput" id="card-output" class="card-img-top no-high-images" />
          <div class="card-body">
            <input
              type="text"
              class="form-control"
              placeholder="Image Titel"
              v-model.trim="titelOfNewImage"
              v-bind:class="{ 'is-invalid': titelOfNewImage !== null ? titelOfNewImage.length === 0 : false }"
            />

            <div>
              <label class="btn btn-primary mt-2" ref="forFile" style="cursor: pointer; width: 60%" role="button">Upload Image</label>
              <button
                ref="buttonSelectUploaded"
                class="btn btn-success"
                style="width: 38%; margin-left: 2%; display: none"
                type="button"
                v-on:click="selectCard"
              >
                Select
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <form class="was-validated" ref="form">
      <div ref="positionDiv" v-show="selectedCard !== null" class="form-group">
        <div class="row">
          <label ref="scrollTo" class="col-4">Position auf dem Bild</label>
          <div class="col-8 text-right text-danger" style="text-decoration: underline; cursor: pointer" v-on:click="unselectCard">
            Keine Position auf dem Bild festlegen
            <i-fa-trash-can />
          </div>
        </div>
        <div class="alert alert-primary" role="alert">
          With Mouse: Click or drag to change the positon on the image.
          <br />Touch: Click to set a position, 'scroll' to move the position. Use two fingers to scroll.
        </div>
        <div
          id="selector"
          style="position: relative; width: 100%"
          v-on:mousemove="changeHoverPosition"
          v-on:drag="changePosition"
          v-on:click="changePosition"
          v-on:touchmove="changePositionByTouch"
          v-on:touchstart="touchStart"
          v-on:mouseout="hoverPosition.visible = false"
          v-on:mouseover="hoverPosition.visible = true"
        >
          <div
            style="height: 1px; width: 100%; background: gray; position: absolute"
            v-show="hoverPosition.visible"
            v-bind:style="{ top: hoverPosition.relativeYPosition }"
          ></div>
          <div
            style="width: 1px; height: 100%; background: gray; position: absolute"
            v-show="hoverPosition.visible"
            v-bind:style="{ left: hoverPosition.relativeXPosition }"
          ></div>
          <div style="height: 1px; width: 100%; background: red; position: absolute" v-bind:style="{ top: position.relativeYPosition }"></div>
          <div style="width: 1px; height: 100%; background: red; position: absolute" v-bind:style="{ left: position.relativeXPosition }"></div>
          <img ref="output" style="width: 100%" ondragstart="event.preventDefault()" />
        </div>
      </div>
      <div class="form-group">
        <label>Position name</label>
        <input type="text" class="form-control" required v-model.trim="position.name" name="positionName" v-on:input="validateName" />
        <div class="invalid-feedback" ref="nameFeedback">Required</div>
      </div>
      <div class="form-group">
        <label for="description">Description</label>
        <input type="text" class="form-control" id="description" v-model="position.description" name="description" />
      </div>
      <div class="form-group">
        <label for="room">Room</label>
        <select class="form-control" v-model="position.room" required>
          <option>K14</option>
          <option>K6</option>
          <option>K2</option>
          <option>Cocktaillager</option>
          <option>Techniklager</option>
          <option>Cocktailtheke</option>
          <option>Biertheke</option>
          <option>Anderer</option>
        </select>
      </div>
      <input type="file" accept="image/*" name="image" ref="file" v-on:change="loadFile" style="display: none" />
      <div class="alert alert-warning" role="alert" v-show="selectedCard && selectedCard.children[0].id === 'card-output' && titelOfNewImage.length === 0">
        <div style="padding-top: 4px; padding-bottom: 4px; display: inline-block">The uploaded image has no titel!</div>
        <button type="button" class="btn btn-success btn-sm" style="float: right" v-on:click="scrollToTitel">Set Titel</button>
      </div>
      <div class="mt-2 mb-2 text-danger" v-if="errorString.length !== 0">{{ errorString }}</div>
      <button v-if="!this.embedded" type="button" class="btn btn-success my-4" v-on:click="addPosition">Add Position</button>
    </form>
  </div>
</template>

<script>
import http from '@/http-common';
import smoothScroll from '@/smoothScroll';

export default {
  props: {
    embedded: {
      type: Boolean,
      default: false,
    },
    existingPositions: {
      type: Array,
      default: null,
    },
  },
  data() {
    return {
      position: {
        id: 0,
        name: '',
        description: '',
        relativeXPosition: '50%',
        relativeYPosition: '50%',
        room: null,
      },
      hoverPosition: {
        visible: false,
        relativeXPosition: '0%',
        relativeYPosition: '0%',
      },
      selectedCard: null,
      lastSelectButton: null,
      lastTouchEvent: null,
      existingImages: [],
      internalExistingPositions: null,
      titelOfNewImage: null,
      errorString: '',
    };
  },
  methods: {
    setPosition(object, event) {
      const image = this.$refs.output;
      const rect = image.parentElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      object.relativeYPosition = (y / image.height) * 100 + '%';
      object.relativeXPosition = (x / image.width) * 100 + '%';
    },
    movePosition(changeX, changeY) {
      const image = this.$refs.output;
      let x = Number(this.position.relativeXPosition.slice(0, -1));
      let y = Number(this.position.relativeYPosition.slice(0, -1));
      x -= (changeX / image.width) * 100;
      y -= (changeY / image.height) * 100;
      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));
      this.position.relativeXPosition = x + '%';
      this.position.relativeYPosition = y + '%';
    },
    changeHoverPosition(event) {
      this.hoverPosition.visible = true;
      this.setPosition(this.hoverPosition, event);
      if (event.buttons & 1) {
        // when the left mouse button is pressed and we drag
        this.setPosition(this.position, event);
      }
    },
    changePosition(event) {
      this.setPosition(this.position, event);
      this.hoverPosition.visible = false;
    },
    changePositionByTouch(event) {
      // we ignore 'scroll' events with two fingers
      if (this.lastTouchEvent) {
        const e = event.touches[0];
        this.movePosition(this.lastTouchEvent.pageX - e.pageX, this.lastTouchEvent.pageY - e.pageY);
        this.lastTouchEvent = e;
        event.preventDefault();
      }
    },
    touchStart(event) {
      if (event.touches.length === 1) {
        this.lastTouchEvent = event.touches[0];
      } else {
        this.lastTouchEvent = null;
      }
    },
    selectCard(event) {
      if (this.selectedCard) {
        this.selectedCard.classList.remove('bg-success');
        this.lastSelectButton.style.visibility = '';
      }
      this.lastSelectButton = event.target;
      this.lastSelectButton.style.visibility = 'hidden';
      const p = event.target.parentElement.parentElement;
      // the 'upload' card is nested n+1 levels
      this.selectedCard = p.classList.contains('card') ? p : p.parentElement;
      this.selectedCard.classList.add('bg-success');

      const image = this.$refs.output;
      const original = this.selectedCard.children[0].getAttribute('original');
      if (original !== null) {
        image.src = this.baseURL + original;
      } else {
        // the uploaded image:
        image.src = this.selectedCard.children[0].src;
      }

      // unhide the positon div container so that we can scroll to the element
      this.$refs.positionDiv.style.display = '';
      const label = this.$refs.scrollTo;
      smoothScroll(label, 1000, 200);
    },
    unselectCard() {
      if (this.selectedCard) {
        this.selectedCard.classList.remove('bg-success');
        this.lastSelectButton.style.visibility = '';
        this.selectedCard = null;
        this.lastSelectButton = null;
      }
    },
    loadFile(event) {
      const image = this.$refs.output;
      image.src = URL.createObjectURL(event.target.files[0]);

      const cardImg = this.$refs.cardOutput;
      cardImg.src = URL.createObjectURL(event.target.files[0]);

      // display the select button of the upload card
      this.$refs.buttonSelectUploaded.style.display = '';
      this.titelOfNewImage = '';

      // click 'select'
      this.selectCard({
        target: this.$refs.buttonSelectUploaded,
      });
    },
    scrollToTitel() {
      smoothScroll(this.$refs.cardOutput, 500);
    },
    validateName(e) {
      const value = e.target.value.trim();
      if (value.length === 0) {
        e.target.setCustomValidity('Required');
        this.$refs.nameFeedback.innerText = 'Required';
        return;
      }
      for (let obj of this.internalExistingPositions) {
        if (obj.text === value) {
          this.$refs.nameFeedback.innerText = 'A position with the name "' + obj.text + '" already exists.';
          e.target.setCustomValidity('A position with the name "' + obj.text + '" already exists.');
          return;
        }
      }
      e.target.setCustomValidity(''); // no error message
    },
    addPosition(returnResponse = false) {
      //check if form is valid
      if (this.$refs.form.checkValidity() === false) {
        return null;
      }
      this.position.name = this.position.name.trim();

      const formData = new FormData();
      formData.append('titel', this.titelOfNewImage);
      formData.append('name', this.position.name);
      formData.append('description', this.position.description);
      formData.append('room', this.position.room);
      const file = this.$refs.file.files[0];
      formData.append('file', file);
      if (this.selectedCard !== null && this.selectedCard.hasAttribute('imageId')) {
        formData.append('imageId', this.selectedCard.getAttribute('imageId'));
      }
      const xPositionOnImage = Number(this.position.relativeXPosition.slice(0, -1)) / 100;
      const yPositionOnImage = Number(this.position.relativeYPosition.slice(0, -1)) / 100;
      formData.append('xPositionOnImage', xPositionOnImage);
      formData.append('yPositionOnImage', yPositionOnImage);
      const promise = http.post('/position', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        validateStatus: () => true,
      });
      if (returnResponse && !(returnResponse instanceof Event)) {
        return promise;
      } else {
        promise.then(response => {
          if (response !== undefined) {
            if (response.status === 201) {
              this.errorString = 'Created';
              this.$router.push('positions');
            } else if (response.status === 200) {
              this.errorString = response.data.errors[0].message + ', value: ' + response.data.errors[0].value;
            } else {
              this.errorString = response.data;
            }
          } else {
            this.errorString = 'Network error :(';
          }
        });
      }
    },
    retrieveImages() {
      http
        .get('/positions/images')
        .then(response => {
          this.existingImages = response.data;
        })
        .catch(e => {
          console.log(e);
        });
    },
    retrieveExistingPositions() {
      if (this.existingPositions === null && this.internalExistingPositions === null) {
        http
          .get('/positionsForSelect')
          .then(response => {
            this.internalExistingPositions = response.data;
          })
          .catch(console.log);
      } else {
        this.internalExistingPositions = this.existingPositions;
      }
    },
  },
  created() {
    this.baseURL = http.defaults.baseURL + '/file/';
  },
  mounted() {
    this.retrieveImages();
    this.retrieveExistingPositions();
    // setup id of file input
    this.$refs.file.id = 'id_' + Math.random();
    this.$refs.forFile.setAttribute('for', this.$refs.file.id);
  },
};
</script>

<style>
.no-high-images {
  object-fit: contain;
  max-height: 240px;
}
</style>
