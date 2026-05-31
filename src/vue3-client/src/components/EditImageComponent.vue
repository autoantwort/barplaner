<template>
  <edit-component ref="edit" :onSave="save" :onEdit="edit">
    <span>
      <button v-if="object.imageId !== null" class="btn btn-sm btn-sm-flat btn-secondary" type="button" v-on:click="openModal">
        <i-fa-image />
      </button>
      <template v-else>None</template>
    </span>
    <b-modal ref="modal" no-footer no-fade centered :title="object.name">
      <div v-if="loading" class="justify-content-center" style="display: flex">
        <b-spinner label="Loading..." />
      </div>
      <img v-if="currentImageURL" style="width: 100%; height: 80dvh; object-fit: contain" :src="currentImageURL" v-on:load="loading = false" />
    </b-modal>
    <template v-slot:edit>
      <image-input ref="input" />
    </template>
  </edit-component>
</template>

<script>
import http from '@/http-common';
import EditComponent from './EditComponent.vue';
import ImageInput from './ImageInput.vue';

export default {
  name: 'edit-image-component',
  components: {
    EditComponent,
    ImageInput,
  },
  props: {
    object: {
      type: Object,
    },
  },
  data() {
    return {
      currentImageURL: null,
      loading: false,
      originalEditURL: null,
    };
  },
  methods: {
    openModal() {
      this.loading = true;
      this.currentImageURL = null;
      http
        .get('/image/' + this.object.imageId)
        .then(response => {
          this.currentImageURL = http.defaults.baseURL + '/file/' + response.data.original;
        })
        .catch(e => {
          console.log(e);
          this.loading = false;
        });
      this.$refs.modal.show();
    },
    async edit() {
      this.originalEditURL = null;
      this.$refs.input.setImageURL(null);
      if (this.object.imageId !== null) {
        try {
          const response = await http.get('/image/' + this.object.imageId);
          const url = http.defaults.baseURL + '/file/' + response.data.original;
          this.originalEditURL = url;
          this.$refs.input.setImageURL(url);
        } catch (e) {
          console.log(e);
        }
      }
    },
    async save() {
      const { imageBlob, imageURL } = this.$refs.input.getData();

      if (imageBlob !== null) {
        const formData = new FormData();
        formData.set('itemImage', imageBlob);
        return this.sendUpdate(formData);
      } else if (imageURL !== null && imageURL !== this.originalEditURL) {
        const formData = new FormData();
        formData.set('itemImageURL', imageURL);
        return this.sendUpdate(formData);
      } else if (imageURL === null && this.originalEditURL !== null) {
        return this.sendUpdate({ itemImageId: null });
      }
      return true;
    },
    async sendUpdate(body) {
      const isFormData = body instanceof FormData;
      try {
        const response = await http.put('/item/' + this.object.id, body, {
          headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
        });
        this.object.imageId = response.data.imageId;
        return true;
      } catch (e) {
        alert(e);
        return false;
      }
    },
  },
};
</script>
