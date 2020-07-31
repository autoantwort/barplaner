<template>
  <b-card no-body class="border-info">
    <b-tabs card v-model="itemGroupTabIndex">
      <b-tab title="Item Group:" title-link-class="text-dark" disabled></b-tab>
      <b-tab title="None" active>
        <b-card-text>The item is in no item group.</b-card-text>
      </b-tab>
      <b-tab title="Existing" lazy>
        <b-card-text>
          <v-select
            class="border-primary"
            :searchable="true"
            :options="existingItemGroups"
            v-model="selectedItemGroup"
            :filterFunction="phoneticsFilter"
            required
          />
        </b-card-text>
      </b-tab>
      <b-tab title="New" lazy>
        <b-card-text>
          <form ref="form">
            <div class="form-group">
              <label for="name">Name</label>
              <input type="text" class="form-control" id="name" v-model="itemGroup.name" required />
            </div>
            <div class="form-group">
              <label for="min">Minimum Number in Stock</label>
              <input
                type="number"
                class="form-control"
                id="min"
                min="0"
                :max="itemGroup.idealCount"
                v-model="itemGroup.minimumCount"
                required
              />
            </div>
            <div class="form-group">
              <label for="ideal">Ideal Number in Stock</label>
              <input type="number" class="form-control" id="ideal" :min="itemGroup.minimumCount" v-model="itemGroup.idealCount" />
            </div>
            <div class="form-group">
              <position-card ref="position" :usedForItem="false" />
            </div>
          </form>
        </b-card-text>
      </b-tab>
    </b-tabs>
    <b-card-footer
      class="bg-info border-info"
    >A item group is a collection of items (e.g. orange juice as group for orange juice from differend brands). The minimum number should be at the minimum in the stock (e.g. the minimum is 2 and we only have one orange juice bottle in the stock, we get a warning that we have to buy orange juice. We should buy orange juice until we have the ideal number in stock.</b-card-footer>
  </b-card>
</template>

<script>
import http from "../../../http-common";
import VSelect from "./../../vue-bootstrap-select";
import phoneticsFilter from "./../../../phoneticsFilter";

import PositionCard from "./PositionCard";

export default {
  name: "item-group-card",
  components: {
    VSelect,
    PositionCard,
  },
  data() {
    return {
      itemGroupTabIndex: 1,
      itemGroup: {
        name: "",
        minimumCount: 0,
        idealCount: null,
      },
      selectedItemGroup: null,
      setItemGroupIdValue: null,
      existingItemGroups: null,
    };
  },
  methods: {
    phoneticsFilter,
    setItemGroup(itemGroup) {
      if (itemGroup === null) {
        this.itemGroupTabIndex = 1 /* None */;
      } else {
        if (typeof itemGroup === "object") {
          this.setItemGroupIdValue = itemGroup.id;
        }
        if (this.existingItemGroups) {
          this.setItemGroupId(this.setItemGroupIdValue);
        }
      }
    },
    setItemGroupId(id) {
      if (id !== null) {
        this.itemGroupTabIndex = 2 /* existing */;
        for (const itemGroup of this.existingItemGroups) {
          if (itemGroup.value === id) {
            this.selectedItemGroup = itemGroup;
            return;
          }
        }
      }
      this.itemGroupTabIndex = 1 /* None */;
    },
    /**
     * Creates a new item group if necessary. Returns the id of the created or selected item group or null.
     * @returns The id of the created or selected item group, null if "None" is selected or a String with a error message if a error occurred.
     */
    async saveItemGroup() {
      // handle item item group
      if (this.itemGroupTabIndex === 3 /* new item group */) {
        if (this.$refs.form.checkValidity() === false) {
          return "The form has invalid fields.";
        }
        const position = await this.$refs.position.savePosition();
        if (position !== null && typeof position !== "number") {
          return "Error while creating Position: " + position;
        }
        const data = this.itemGroup;
        data.stockPositionId = position;
        try {
          const response = await http.post("/itemGroup", data);
          if (response.status !== 201) {
            return "Error while creating item group: " + response.data;
          } else {
            // add item group to the existing ones
            this.existingItemGroups.push({
              value: response.data.id,
              text: response.data.name,
            });
            // select the new item group, maybe there are other errors and when
            // the user press 'add item' again, the user wants to use the created item group
            this.itemGroupTabIndex = 2 /* Existing */;
            this.selectedItemGroup = this.existingItemGroups[
              this.existingItemGroups.length - 1
            ]; // v-model of the select
            return response.data.id;
          }
        } catch (error) {
          return "Error while creating item group: " + error;
        }
      }
      if (this.itemGroupTabIndex === 2 /* existing item group */) {
        if (this.selectedItemGroup === null /* but nothing selected */) {
          this.itemGroupTabIndex = 1; /* None */
          return null;
        }
        return this.selectedItemGroup.value;
      }
      return null;
    },
    async retrieveItemGroups() {
      try {
        this.existingItemGroups = (await http.get("/itemGroupsForSelect")).data;
        this.setItemGroupId(this.setItemGroupIdValue);
      } catch (error) {
        alert(error);
      }
    },
  },
  mounted() {
    this.retrieveItemGroups();
  },
};
</script>
<style>
</style>
