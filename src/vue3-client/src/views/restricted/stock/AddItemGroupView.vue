<template>
  <div class="container">
    <div class="row mt-2">
      <div class="col-12 col-md-8 offset-md-2 col-lg-6 offset-lg-3">
        <form class="was-validated" ref="form">
          <div class="form-group">
            <label for="itemGroupName">Name</label>
            <input type="text" class="form-control" id="itemGroupName" v-model="itemGroup.name" required />
          </div>
          <div class="form-group">
            <label for="itemGroupMinCount">Minimum Number in Stock</label>
            <input type="number" class="form-control" id="itemGroupMinCount" v-model="itemGroup.minimumCount" required />
          </div>
          <div class="form-group">
            <label for="itemGroupIdealCount">Ideal Number in Stock</label>
            <input type="number" class="form-control" id="itemGroupIdealCount" v-model="itemGroup.idealCount" />
          </div>
          <div class="form-group">
            <b-card no-body class="border-info">
              <b-tabs card v-model="itemGroup.positionTabIndex">
                <b-tab title="Position:" title-link-class="text-dark" disabled></b-tab>
                <b-tab title="None" active>
                  <b-card-text>The item group, respectively the items in the group have no position or a own position.</b-card-text>
                </b-tab>
                <b-tab title="Existing" lazy>
                  <b-card-text>
                    <SearchableSelect
                      class="border-primary"
                      :searchable="true"
                      :options="internalExistingPositions"
                      :filterFunction="phoneticsFilter"
                      v-model="itemGroup.selectedPosition"
                    />
                  </b-card-text>
                </b-tab>
                <b-tab title="New" lazy>
                  <b-card-text>
                    <add-position ref="itemGroupPosition" :embedded="true" :existingPositions="existingPositions"></add-position>
                  </b-card-text>
                </b-tab>
              </b-tabs>
              <b-card-footer class="bg-info border-info"
                >Every item group can have a position. If a item group has no position, the position of a item is used.</b-card-footer
              >
            </b-card>
          </div>

          <div class="mt-2 mb-2 text-danger" v-if="errorString.length !== 0">{{ errorString }}</div>
          <button type="button" class="btn btn-success my-4" v-on:click="addItemGroup">Add ItemGroup and add another</button>
          <button type="button" class="btn btn-success my-4 ml-2" v-on:click="addItemGroup('itemGroups')">Add ItemGroup and view list</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import http from '@/http-common';
import phoneticsFilter from '@/phoneticsFilter';
import AddPosition from '@/components/AddPosition.vue';

export default {
  name: 'add-itemGroup',
  components: {
    AddPosition,
  },
  props: {
    existingPositions: {
      type: Array,
      default: null,
    },
  },
  data() {
    return {
      itemGroup: {
        name: '',
        minimumCount: 0,
        idealCount: null,
        positionTabIndex: 1,
        selectedPosition: null,
        selectedItemGroup: null,
      },
      internalExistingPositions: null,
      errorString: '',
    };
  },
  methods: {
    phoneticsFilter,
    async addItemGroup(redirectAfter) {
      //check if form is valid
      if (this.$refs.form.checkValidity() === false) {
        this.errorString = 'The form has invalid fields.\n';
        return;
      } else {
        this.errorString = '';
      }
      const data = {
        name: this.itemGroup.name,
        minimumCount: this.itemGroup.minimumCount,
        idealCount: this.itemGroup.idealCount,
      };
      // handle itemGroup position
      if (this.itemGroup.positionTabIndex === 3 /* new position */) {
        const result = this.$refs.itemGroupPosition.addItemGroup(true);
        try {
          const response = await result;
          if (response.status !== 201) {
            this.errorString = 'Error while creating position for itemGroup: ' + response.data;
            return;
          } else {
            // add position to the existing ones
            this.internalExistingPositions.push({
              value: response.data.id,
              text: response.data.name,
            });
            // select the new position, maybe there are other errors and when
            // the user press 'add item group' again, the user wants to use the created position
            this.itemGroup.positionTabIndex = 2 /* Existing */;
            this.itemGroup.selectedPosition = this.internalExistingPositions[this.internalExistingPositions.length - 1]; // v-model of the select
          }
        } catch (error) {
          this.errorString = 'Error while creating position for itemGroup: ' + error;
          return;
        }
      }
      if (this.itemGroup.positionTabIndex === 2 /* existing position*/) {
        if (this.itemGroup.selectedPosition === null) {
          this.errorString = "If you don't want to select a position, select the 'None' tab.";
          return;
        }
        data['stockPositionId'] = this.itemGroup.selectedPosition.value;
      }
      http
        .post('/itemGroup', data, {
          validateStatus: () => true,
        })
        .then(response => {
          if (response !== undefined) {
            if (response.status === 201) {
              if (redirectAfter !== undefined) {
                this.$router.push(redirectAfter);
              }
              this.errorString = 'ItemGroup created';
            } else {
              this.errorString = response.data;
            }
          } else {
            this.errorString = 'Network error :(';
          }
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
  mounted() {
    this.retrieveExistingPositions();
  },
};
</script>

<style></style>
