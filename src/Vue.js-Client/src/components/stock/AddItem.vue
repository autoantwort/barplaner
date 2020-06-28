<template>
  <div class="container">
    <div class="row mt-2">
      <div class="col-12 col-md-8 offset-md-2 col-lg-6 offset-lg-3">
        <form class="was-validated" id="form">
          <div class="form-group">
            <label for="name">Name</label>
            <input type="text" class="form-control" id="name" required v-model.trim="item.name" name="name" />
            <div class="invalid-feedback">Required</div>
          </div>
          <div class="form-group">
            <label for="image">Image</label>
            <div class="input-group">
              <input
                id="imageInput"
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
          </div>
          <b-alert
            :show="item.imageError"
            v-on:dismissed="item.imageError = false"
            dismissible
            fade
            variant="danger"
          >The pasted URL does not point to an image!</b-alert>
          <div v-if="item.imageURL !== null" class="col mb-4 text-center">
            <img
              class="border border-success rounded no-high-images"
              :src="item.imageURL"
              v-on:load="item.imageError = false"
              v-on:error="item.imageError = true; item.imageURL = null"
            />
            <div class="text-center text-danger" style="text-decoration: underline;cursor:pointer" v-on:click="item.imageURL = null">
              Delete Image
              <font-awesome-icon icon="trash-alt" />
            </div>
          </div>
          <div class="form-group">
            <label for="barcode">Barcode (Scan with the barcode scanner)</label>
            <input type="text" class="form-control" id="barcode" v-model="item.barcode" name="barcode" />
          </div>
          <div class="form-group">
            <label for="articleNumber">Article Number (e.g. ASIN for Amazon, Art.-Nr. for Kachouri)</label>
            <input type="text" class="form-control" id="articleNumber" v-model="item.articleNumber" name="articleNumber" />
          </div>
          <div class="form-group">
            <label for="seller">Seller</label>
            <select class="form-control" id="seller" v-model="item.seller">
              <option>Amazon</option>
              <option>Metro</option>
              <option>Aldi</option>
              <option>Conalco</option>
              <option>Rewe</option>
              <option>Netto</option>
              <option>Donation</option>
              <option>Other</option>
              <option>Unknown</option>
            </select>
          </div>
          <div class="form-group">
            <b-card no-body class="border-info">
              <b-tabs card v-model="item.positionTabIndex">
                <b-tab title="Position:" title-link-class="text-dark" disabled></b-tab>
                <b-tab title="None" active>
                  <b-card-text>Use the position of the item group.</b-card-text>
                </b-tab>
                <b-tab title="Existing" lazy>
                  <b-card-text>
                    <v-select
                      class="border-primary"
                      :searchable="true"
                      :options="existingPositions"
                      v-model="item.selectedPosition"
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
              <b-card-footer
                class="bg-info border-info"
              >Every item (e.g. banana juice from one brand) can have a specific position. If a item has no position, the position of the item group (e.g. banana juice) is used.</b-card-footer>
            </b-card>
          </div>
          <div class="form-group">
            <label for="unit">Content</label>
            <div class="input-group">
              <input type="number" id="unit" class="form-control" aria-label="Text input with dropdown button" v-model="item.amount" />
              <div class="input-group-append">
                <b-dropdown v-bind:text="item.unit" v-model="item.unit">
                  <b-dropdown-item v-on:click="item.unit='Units'">Units</b-dropdown-item>
                  <b-dropdown-item v-on:click="item.unit='ml'">ml</b-dropdown-item>
                  <b-dropdown-item v-on:click="item.unit='Gramm'">Gramm</b-dropdown-item>
                </b-dropdown>
              </div>
            </div>
          </div>
          <div class="form-group">
            <b-card no-body class="border-info">
              <b-tabs card v-model="item.itemGroupIndex">
                <b-tab title="Item Group:" title-link-class="text-dark" disabled></b-tab>
                <b-tab title="None" active>
                  <b-card-text>The item is on no item group.</b-card-text>
                </b-tab>
                <b-tab title="Existing" lazy>
                  <b-card-text>
                    <v-select
                      class="border-primary"
                      :searchable="true"
                      :options="existingItemGroups"
                      v-model="item.itemGroup.selectedItemGroup"
                      :filterFunction="phoneticsFilter"
                      required
                    />
                  </b-card-text>
                </b-tab>
                <b-tab title="New" lazy>
                  <b-card-text>
                    <div class="form-group">
                      <label for="itemGroupName">Name</label>
                      <input type="text" class="form-control" id="itemGroupName" v-model="item.itemGroup.name" required />
                    </div>
                    <div class="form-group">
                      <label for="itemGroupMinCount">Minimum Number in Stock</label>
                      <input type="number" class="form-control" id="itemGroupMinCount" v-model="item.itemGroup.minimumCount" required />
                    </div>
                    <div class="form-group">
                      <label for="itemGroupIdealCount">Ideal Number in Stock</label>
                      <input type="number" class="form-control" id="itemGroupIdealCount" v-model="item.itemGroup.idealCount" />
                    </div>
                    <div class="form-group">
                      <b-card no-body class="border-info">
                        <b-tabs card v-model="item.itemGroup.positionTabIndex">
                          <b-tab title="Position:" title-link-class="text-dark" disabled></b-tab>
                          <b-tab title="None" active>
                            <b-card-text>The item group, respectively the items in the group have no position or a own position.</b-card-text>
                          </b-tab>
                          <b-tab title="Existing" lazy>
                            <b-card-text>
                              <v-select
                                class="border-primary"
                                :searchable="true"
                                :options="existingPositions"
                                v-model="item.itemGroup.selectedPosition"
                                :filterFunction="phoneticsFilter"
                              />
                            </b-card-text>
                          </b-tab>
                          <b-tab title="New" lazy>
                            <b-card-text>
                              <add-position ref="itemGroupPosition" :embedded="true" :existingPositions="existingPositions"></add-position>
                            </b-card-text>
                          </b-tab>
                        </b-tabs>
                        <b-card-footer
                          class="bg-info border-info"
                        >Every item group can have a position. If a item group has no position, the position of the item is used.</b-card-footer>
                      </b-card>
                    </div>
                  </b-card-text>
                </b-tab>
              </b-tabs>
              <b-card-footer
                class="bg-info border-info"
              >A item group is a collection of items (e.g. orange juice as group for orange juice from differend brands). The minimum number should be at the minimum in the stock (e.g. the minimum is 2 and we only have one orange juice bottle in the stock, we get a warning that we have to buy orange juice. We should buy orange juice until we have the ideal number in stock.</b-card-footer>
            </b-card>
          </div>
          <div
            class="alert alert-warning"
            role="alert"
            v-show="selectedCard && selectedCard.children[0].id === 'card-output' && titelOfNewImage.length === 0"
          >
            <div style="padding-top: 4px;padding-bottom: 4px; display:inline-block">The uploaded image has no titel!</div>
            <button type="button" class="btn btn-success btn-sm" style="float: right;" v-on:click="scrollToTitel">Set Titel</button>
          </div>
          <div class="my-2 text-danger" v-if="errorString.length !== 0">{{errorString}}</div>
          <button type="button" class="btn btn-success my-3" v-on:click="addPosition">Add and add another</button>
          <button type="button" class="btn btn-success ml-3 my-3" v-on:click="addPosition('items')">Add and view item list</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import http from "../../http-common";
import smoothScroll from "../../smoothScroll";
import VSelect from "./../vue-bootstrap-select";
import phoneticsFilter from "./../../phoneticsFilter";

import AddPosition from "./AddPosition";

export default {
  name: "add-item",
  components: {
    VSelect,
    AddPosition
  },
  data() {
    return {
      item: {
        id: 0,
        imageBlob: null,
        imageURL: null,
        imageError: false,
        name: "",
        barcode: null,
        articleNumber: null,
        seller: "Unknown",
        positionTabIndex: 1,
        selectedPosition: null,
        amount: null,
        unit: "Units",
        itemGroupIndex: 1,
        itemGroup: {
          name: "",
          minimumCount: 0,
          idealCount: null,
          positionTabIndex: 1,
          selectedPosition: null,
          selectedItemGroup: null
        }
      },
      selectedCard: null,
      lastSelectButton: null,
      lastTouchEvent: null,
      existingPositions: [],
      existingItemGroups: [],
      titelOfNewImage: null,
      errorString: ""
    };
  },
  methods: {
    /* eslint-disable no-console */
    phoneticsFilter,
    loadImageFromFile(event) {
      this.item.imageURL = URL.createObjectURL(event.target.files[0]);
      this.item.imageBlob = event.target.files[0];
    },
    scrollToTitel() {
      smoothScroll(document.getElementById("card-output"), 500);
    },
    async addPosition(redirectAfter) {
      //check if form is valid
      if (document.getElementById("form").checkValidity() === false) {
        this.errorString = "The form has invalid fields.\n";
        return;
      } else {
        this.errorString = "";
      }

      const formData = new FormData();
      // handle normal fields
      formData.set("name", this.item.name);
      if (this.item.barcode !== null) {
        formData.set("barcode", this.item.barcode);
      }
      if (this.item.articleNumber !== null) {
        formData.set("articleNumber", this.item.articleNumber);
      }
      if (this.item.seller !== "Unknown") {
        formData.set("seller", this.item.seller);
      }
      if (this.item.amount !== null) formData.set("amount", this.item.amount);
      if (this.item.unit !== "Units") {
        formData.set("unit", this.item.unit.toLowerCase());
      }

      // handle item position
      if (this.item.positionTabIndex === 3 /* new position */) {
        const result = this.$refs.itemPosition.addPosition(true);
        try {
          const response = await result;
          if (response.status !== 201) {
            this.errorString =
              "Error while creating position for item: " + response.data;
            return;
          } else {
            // add position to the existing ones
            this.existingPositions.push({
              value: response.data.id,
              text: response.data.name
            });
            // select the new position, maybe there are other errors and when
            // the user press 'add item' again, the user wants to use the created position
            this.item.positionTabIndex = 2 /* Existing */;
            this.item.selectedPosition = this.existingPositions[
              this.existingPositions.length - 1
            ]; // v-model of the select
          }
        } catch (error) {
          this.errorString = "Error while creating position for item: " + error;
          return;
        }
      }
      if (this.item.positionTabIndex === 2 /* existing position*/) {
        if (this.item.selectedPosition === null) {
          this.errorString =
            "If you don't want to select a position, select the 'None' tab.";
          return;
        }
        formData.set("itemPosition", this.item.selectedPosition.value);
      }

      // handle image
      if (this.item.imageBlob !== null) {
        formData.set("itemImage", this.item.imageBlob);
      } else if (this.item.imageURL !== null) {
        formData.set("itemImageURL", this.item.imageURL);
      }

      // handle item group
      if (this.item.itemGroupIndex === 3 /*new item group*/) {
        formData.set("itemGroup.name", this.item.itemGroup.name);
        formData.set(
          "itemGroup.minimumCount",
          this.item.itemGroup.minimumCount
        );
        if (this.item.itemGroup.idealCount !== null)
          formData.set("itemGroup.idealCount", this.item.itemGroup.idealCount);
        if (this.item.itemGroup.positionTabIndex === 3 /* new position */) {
          const result = this.$refs.itemGroupPosition.addPosition(true);
          try {
            const response = await result;
            if (response.status !== 201) {
              this.errorString =
                "Error while creating position for item group: " +
                response.data;
              return;
            } else {
              // add position to the existing ones
              this.existingPositions.push({
                value: response.data.id,
                text: response.data.name
              });
              // select the new position, maybe there are other errors and when
              // the user press 'add item' again, the user wants to use the created position
              this.item.itemGroup.positionTabIndex = 2 /* Existing */;
              this.item.itemGroup.selectedPosition = this.existingPositions[
                this.existingPositions.length - 1
              ]; // v-model of the select
            }
          } catch (error) {
            this.errorString =
              "Error while creating position for item group: " + error;
            return;
          }
        }
        if (this.item.itemGroup.positionTabIndex === 2 /* existing position*/) {
          if (this.item.itemGroup.selectedPosition === null) {
            this.errorString =
              "If you don't want to select a position for the new item group, select the 'None' tab.";
            return;
          }
          formData.set(
            "itemGroup.position",
            this.item.itemGroup.selectedPosition.value
          );
        }
      } else if (this.item.itemGroupIndex === 2 /*existing item group*/) {
        if (this.item.itemGroup.selectedItemGroup === null) {
          this.errorString =
            "If you don't want to select an item group, select the 'None' tab.";
          return;
        }
        formData.set(
          "itemGroup.id",
          this.item.itemGroup.selectedItemGroup.value
        );
      }
      http
        .post("/item", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          },
          validateStatus: () => true
        })
        .then(response => {
          if (response !== undefined) {
            if (response.status === 201) {
              if (redirectAfter !== undefined) {
                this.$router.push(redirectAfter);
              }
              this.errorString = "Item created";
              if (this.item.itemGroupIndex === 3 /* New */) {
                // if a new item group was created, update the UI so that the new item group is selected
                this.item.itemGroupIndex = 2 /* Existing */;
                this.existingItemGroups.push({
                  value: response.data.itemGroupId,
                  text: this.item.itemGroup.name
                });
                this.item.itemGroup.selectedPosition = this.existingPositions[
                  this.existingPositions.length - 1
                ]; // v-model of the select
              }
            } else {
              this.errorString = response.data;
            }
          } else {
            this.errorString = "Network error :(";
          }
        });
    },
    retrievePositions() {
      http
        .get("/positionsForSelect")
        .then(response => {
          this.existingPositions = response.data;
        })
        .catch(e => {
          console.log(e);
        });
    },
    retrieveItemGroups() {
      http
        .get("/itemGroupsForSelect")
        .then(response => {
          this.existingItemGroups = response.data;
        })
        .catch(e => {
          console.log(e);
        });
    },
    setupImagePaste() {
      // from http://jsfiddle.net/viliusl/xq2aLj4b/5/
      // linked at https://stackoverflow.com/questions/18377891/how-can-i-let-user-paste-image-data-from-the-clipboard-into-a-canvas-element-in
      document.getElementById("imageInput").addEventListener(
        "paste",
        e => {
          if (e.clipboardData) {
            const items = e.clipboardData.items;
            if (!items) return;

            //access data directly
            let is_image = false;
            for (let i = 0; i < items.length; i++) {
              if (items[i].type.indexOf("image") !== -1) {
                this.item.imageBlob = items[i].getAsFile();
                this.item.imageURL = URL.createObjectURL(this.item.imageBlob);
                is_image = true;
              } else if (items[i].type.indexOf("text/plain") !== -1) {
                items[i].getAsString(s => {
                  this.item.imageURL = s;
                  document.getElementById("imageInput").value = "";
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
    setupPositionNameValidation() {
      // get all name inputs for positions
      for (let input of document.querySelectorAll("input[name=positionName]")) {
        // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#the-constraint-validation-api
        input.oninput = () => {
          const value = input.value.trim();
          for (let obj of this.existingPositions) {
            if (obj.text === value) {
              input.setCustomValidity(
                'A position with the name "' + obj.text + '" already exists.'
              );
              return;
            }
          }
          input.setCustomValidity(""); // no error message
        };
      }
    }
    /* eslint-enable no-console */
  },
  mounted() {
    this.setupImagePaste();
    this.retrievePositions();
    this.retrieveItemGroups();
  },
  created() {
    this.webSocket = new WebSocket(
      http.defaults.baseWsURL + "/scannerConsumer"
    );
    this.webSocket.onmessage = e => {
      this.item.barcode = e.data;
    };
  },
  beforeDestroy() {
    this.webSocket.close();
  }
};
</script>

<style>
.no-high-images {
  object-fit: contain;
  max-height: 240px;
}
.v-select-toggle {
  border: 1px solid gray !important;
}
</style>
