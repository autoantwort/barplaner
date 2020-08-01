<template>
  <div>
    <div class="input-group">
      <input
        ref="imageInput"
        type="url"
        class="form-control"
        placeholder="Paste image or url of image"
        aria-label="Paste image or url of image"
        onkeypress="return false;"
      />
      <div class="input-group-append">
        <input type="file" accept="image/*" id="uploadImage" v-on:change="loadImageFromFile" style="display: none;" />
        <label class="btn btn-outline-secondary" for="uploadImage" style="cursor: pointer" role="button">Upload Image</label>
      </div>
    </div>
    <b-alert
      :show="imageError"
      v-on:dismissed="imageError = false"
      dismissible
      fade
      variant="danger"
    >The pasted URL does not point to an image!</b-alert>
    <div v-if="imageURL !== null" class="col mb-4 text-center">
      <img
        class="border border-success rounded no-high-images"
        :src="imageURL"
        v-on:load="imageError = false"
        v-on:error="imageError = true; imageURL = null"
      />
      <div class="text-center text-danger" style="text-decoration: underline;cursor:pointer" v-on:click="imageURL = null">
        Delete Image
        <font-awesome-icon icon="trash-alt" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "image-input",
  data() {
    return {
      imageBlob: null,
      imageURL: null,
      imageError: false,
    };
  },
  methods: {
    getData() {
      return {
        imageBlob: this.imageBlob,
        imageURL: this.imageURL,
      };
    },
    loadImageFromFile(event) {
      this.imageURL = URL.createObjectURL(event.target.files[0]);
      this.imageBlob = event.target.files[0];
    },
    setupImagePaste() {
      // from http://jsfiddle.net/viliusl/xq2aLj4b/5/
      // linked at https://stackoverflow.com/questions/18377891/how-can-i-let-user-paste-image-data-from-the-clipboard-into-a-canvas-element-in
      this.$refs.imageInput.addEventListener(
        "paste",
        (e) => {
          if (e.clipboardData) {
            const items = e.clipboardData.items;
            if (!items) return;

            //access data directly
            let is_image = false;
            for (let i = 0; i < items.length; i++) {
              if (items[i].type.indexOf("image") !== -1) {
                this.imageBlob = items[i].getAsFile();
                this.imageURL = URL.createObjectURL(this.imageBlob);
                is_image = true;
              } else if (items[i].type.indexOf("text/plain") !== -1) {
                items[i].getAsString((s) => {
                  this.imageURL = s;
                  this.$refs.imageInput.value = "";
                });
              }
            }
            if (is_image) {
              e.preventDefault();
            }
          }
        },
        false
      );
    },
  },
  mounted() {
    this.setupImagePaste();
  },
};
</script>
<style>
</style>
