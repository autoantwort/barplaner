<template>
  <edit-component ref="edit" :onSave="save" :onEdit="edit">
    <router-link
      v-if="object.itemGroup"
      :to="{ name: 'itemGroup', params: { itemGroupId: object.itemGroup.id } }"
      @click="setNavigationData({ itemGroup: object.itemGroup })"
    >
      {{ object.itemGroup.name }}</router-link
    >
    <template v-else>None</template>
    <template v-slot:edit>
      <item-group-card ref="input" />
    </template>
  </edit-component>
</template>

<script>
import http from '@/http-common';
import EditComponent from './EditComponent.vue';
import ItemGroupCard from './ItemGroupCard.vue';
import NavigationDataService from '@/router/navigationDataService';

export default {
  name: 'edit-item-group-component',
  components: {
    EditComponent,
    ItemGroupCard,
  },
  props: {
    object: {
      type: Object,
    },
  },
  methods: {
    async save() {
      const result = await this.$refs.input.saveItemGroup();
      if (typeof result === 'number' || result === null) {
        http
          .put('/item/' + this.object.id, {
            itemGroupId: result,
          })
          .then(response => {
            // copy object
            for (const i in response.data) {
              this.object[i] = response.data[i];
            }
          })
          .catch(alert);
      } else {
        alert(result);
      }
    },
    edit() {
      this.$refs.input.setItemGroup(this.object.itemGroup);
    },
    setNavigationData(item) {
      NavigationDataService.set(item);
    },
  },
};
</script>
<style></style>
