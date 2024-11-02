<template>
  <div class="col-9">
    <div class="row">
      <div class="col-9">
        <slot v-if="!editMode"></slot>
        <slot v-else name="edit"></slot>
      </div>
      <div class="col-3" style="text-align: right">
        <button v-if="editMode" class="btn btn-light" v-on:click="cancelClicked">
          <i-fa-xmark />
        </button>
        <button class="ml-2 btn btn-light" v-on:click="editSaveClicked">
          <i-fa-floppy-disk v-if="editMode" />
          <i-fa-pen-to-square v-else />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'edit-component',
  props: {
    onSave: {
      type: Function,
    },
    onEdit: {
      type: Function,
    },
  },
  data() {
    return {
      editMode: false,
    };
  },
  methods: {
    save() {
      if (this.editMode) {
        this.editSaveClicked();
      }
    },
    async editSaveClicked() {
      if (this.editMode) {
        const success = await this.onSave();
        if (success !== false) {
          this.editMode = false;
        }
      } else {
        this.editMode = true;
        this.$nextTick(async () => await this.onEdit());
      }
    },
    cancelClicked() {
      this.editMode = false;
    },
    keyPressed(event) {
      if (event.keyCode === 27) {
        this.cancelClicked();
      }
    },
  },
  mounted() {
    document.addEventListener('keyup', this.keyPressed);
  },
  beforeUnmount() {
    document.removeEventListener('keyup', this.keyPressed);
  },
};
</script>
<style></style>
