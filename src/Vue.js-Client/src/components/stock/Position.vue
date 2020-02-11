<template>
  <div class="container">
    <div class="row mt-3">
      <div v-if="realPosition" class="col-12 col-md-8 offset-md-2">
        <div class="form-group row">
          <label class="col-4">Name</label>
          <label class="col-8">{{realPosition.name}}</label>
        </div>
        <div class="form-group row">
          <label class="col-4">Description</label>
          <label class="col-8">{{realPosition.description}}</label>
        </div>
        <div class="form-group row">
          <label class="col-4">Room</label>
          <label class="col-8">{{realPosition.room}}</label>
        </div>
        <positionImage ref="image" v-bind:position="realPosition"></positionImage>
      </div>
    </div>
  </div>
</template>

<script>
import http from "../../http-common";
import PositionImage from "./PositionImage";

export default {
  name: "position",
  props: {
    position: {
      type: Object,
      default: null
    }
  },
  components: { PositionImage },
  data() {
    return {
      items: "",
      realPosition: null
    };
  },
  methods: {
    /* eslint-disable no-console */
    retrievePosition() {
      http
        .get("/position/" + this.$route.params.positionId)
        .then(response => {
          this.realPosition = response.data;
        })
        .catch(e => {
          console.log(e);
        });
    }
  },
  mounted() {
    if (this.realPosition === null) {
      this.retrievePosition();
    } else {
      this.realPosition = this.position;
    }
  }
  /* eslint-enable no-console */
};
</script>

<style>
</style>
