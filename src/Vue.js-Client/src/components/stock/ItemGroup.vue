<template>
  <div class="container">
    <div class="row mt-3">
      <div v-if="realItemGroup" class="col-12 col-md-8 offset-md-2">
        <div class="form-group row">
          <label class="col-4">Name</label>
          <label class="col-8">{{realItemGroup.name}}</label>
        </div>
        <div class="form-group row">
          <label class="col-4">Minimum Count</label>
          <label class="col-8">{{realItemGroup.minimumCount}}</label>
        </div>
        <div class="form-group row">
          <label class="col-4">Ideal Count</label>
          <label class="col-8">{{realItemGroup.idealCount}}</label>
        </div>        
        <div class="form-group row">
          <label class="col-4">Position</label>
          <label class="col-8">
            <router-link v-if="realItemGroup.stockPosition" :to="{ name: 'position',params:{ positionId: realItemGroup.stockPosition.id , position:realItemGroup.stockPosition} }">{{realItemGroup.stockPosition.name}}</router-link>
            <span v-else>None</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import http from "../../http-common";

export default {
  name: "itemGroup",
  props: {
    itemGroup: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      items: "",
      realItemGroup: null,
    };
  },
  methods: {
    /* eslint-disable no-console */    
    retrieveitemGroup() {
      http
        .get("/itemGroup/" + this.$route.params.itemGroupId)
        .then(response => {
          this.realItemGroup = response.data;
        })
        .catch(e => {
          console.log(e);
        });
    }
  },
  mounted() {
    if (this.itemGroup === null) {
      this.retrieveitemGroup();
    } else {
      this.realItemGroup = this.itemGroup;
    }
  }
  /* eslint-enable no-console */
};
</script>

<style>
</style>
