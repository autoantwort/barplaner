<template>
  <b-card no-body class="border-info">
    <b-tabs card v-model="positionTabIndex">
      <b-tab title="Position:" title-link-class="text-dark" disabled></b-tab>
      <b-tab title="None" active>
        <b-card-text>
          <template v-if="usedForItem">Use the position of the item group if the item group has one.</template>
          <template v-else>The items in the group have no position or a own position.</template>
        </b-card-text>
      </b-tab>
      <b-tab title="Existing" lazy>
        <b-card-text>
          <v-select
            class="border-primary"
            :searchable="true"
            :options="realExistingPositions"
            v-model="selectedPosition"
            :filterFunction="phoneticsFilter"
          />
        </b-card-text>
      </b-tab>
      <b-tab title="New" lazy>
        <b-card-text>
          <add-position ref="itemPosition" :existingPositions="existingPositions" :embedded="true"></add-position>
        </b-card-text>
      </b-tab>
    </b-tabs>
    <b-card-footer class="bg-info border-info">
      <template v-if="usedForItem"
        >Every item (e.g. banana juice from one brand) can have a specific position. If a item has no position, the position
        of the item group (e.g. banana juice) is used.</template
      >
      <template v-else
        >Every item group can have a position. If a item group has no position, all items in the group has no position by
        default. Items can have a own position.</template
      >
    </b-card-footer>
  </b-card>
</template>

<script>
import http from "../../../http-common";
import VSelect from "./../../vue-bootstrap-select";
import phoneticsFilter from "./../../../phoneticsFilter";

import AddPosition from "../AddPosition";

export default {
  name: "position-card",
  components: {
    VSelect,
    AddPosition,
  },
  props: {
    existingPositions: {
      type: Array,
      default: null,
    },
    usedForItem: {
      // true => item, false => item group
      type: Boolean,
    },
  },
  data() {
    return {
      realExistingPositions: [],
      positionTabIndex: 1,
      selectedPosition: null,
      setPositionIdValue: null,
    };
  },
  methods: {
    /* eslint-disable no-console */
    phoneticsFilter,
    setPosition(position) {
      if (position === null) {
        this.positionTabIndex = 1 /* None */;
      } else {
        if (typeof position === "object") {
          this.setPositionIdValue = position.id;
        }
        if (this.existingPositions) {
          this.setPositionId(this.setPositionIdValue);
        }
      }
    },
    setPositionId(id) {
      if (id !== null) {
        this.positionTabIndex = 2 /* existing */;
        for (const pos of this.realExistingPositions) {
          if (pos.value === id) {
            this.selectedPosition = pos;
            return;
          }
        }
      }
      this.positionTabIndex = 1 /* None */;
    },
    /**
     * Creates a new position if necessary. Returns the id of the created or selected position or null.
     * @returns The id of the created or selected Position, null if "None" is selected or a String with a error message if a error occurred.
     *
     */
    async savePosition() {
      // handle item position
      if (this.positionTabIndex === 3 /* new position */) {
        const result = this.$refs.itemPosition.addPosition(true);
        try {
          const response = await result;
          if (response.status !== 201) {
            return "Error while creating position for item: " + response.data;
          } else {
            // add position to the existing ones
            this.realExistingPositions.push({
              value: response.data.id,
              text: response.data.name,
            });
            // select the new position, maybe there are other errors and when
            // the user press 'add item' again, the user wants to use the created position
            this.positionTabIndex = 2 /* Existing */;
            this.selectedPosition = this.realExistingPositions[this.realExistingPositions.length - 1]; // v-model of the select
            return response.data.id;
          }
        } catch (error) {
          return "Error while creating position for item: " + error;
        }
      }
      if (this.positionTabIndex === 2 /* existing position*/) {
        if (this.selectedPosition === null) {
          return "If you don't want to select a position, select the 'None' tab.";
        }
        return this.selectedPosition.value;
      }
      return null;
    },
    retrievePositions() {
      http
        .get("/positionsForSelect")
        .then((response) => {
          this.realExistingPositions = response.data;
          this.setPositionId(this.setPositionIdValue);
        })
        .catch((e) => {
          console.log(e);
        });
    },
    setupPositionNameValidation() {
      // get all name inputs for positions
      for (let input of document.querySelectorAll("input[name=positionName]")) {
        // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#the-constraint-validation-api
        input.oninput = () => {
          const value = input.value.trim();
          for (let obj of this.existingPositions) {
            if (obj.text === value) {
              input.setCustomValidity('A position with the name "' + obj.text + '" already exists.');
              return;
            }
          }
          input.setCustomValidity(""); // no error message
        };
      }
    },
  },
  mounted() {
    if (this.existingPositions === null) {
      this.retrievePositions();
    }
  },
};
</script>
<style>
</style>
