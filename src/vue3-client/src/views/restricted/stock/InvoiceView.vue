<template>
  <div :class="{ container: !fluid, 'container-fluid': fluid }">
    <div class="row mt-3">
      <template v-if="realInvoice">
        <form ref="form" class="was-validated col-12 col-lg-8 offset-lg-2 col-md-10 offset-md-1">
          <div class="form-group row mb-2">
            <label class="col-3 col-form-label">From</label>
            <div class="col-9">
              <input v-if="realInvoice.seller" readonly class="form-control-plaintext" :value="realInvoice.seller" />
              <input v-else type="text" class="form-control" v-model="seller" required />
            </div>
          </div>
          <div class="form-group row mb-2">
            <label class="col-3 col-form-label">Invoice Date</label>
            <div class="col-9">
              <input v-if="realInvoice.invoiceDate" readonly class="form-control-plaintext" :value="$filters.asDayDateTime(realInvoice.invoiceDate)" />
              <input v-else class="form-control" required pattern="[0-3]\d\.[0-1]\d\.\d\d [0-2]\d:[0-5]\d" title="dd.mm.yy hh:mm" v-model="invoiceDate" />
              <div class="invalid-feedback">Required. Format: dd.mm.yy hh:mm</div>
            </div>
          </div>
          <div class="form-group row mb-2">
            <label class="col-3 col-form-label">Delivery Date</label>
            <div class="col-9">
              <input v-if="realInvoice.deliveryDate" readonly class="form-control-plaintext" :value="$filters.asDayDateTime(realInvoice.deliveryDate)" />
              <input v-else class="form-control" pattern="[0-3]\d\.[0-1]\d\.\d\d [0-2]\d:[0-5]\d" title="dd.mm.yy hh:mm" v-model="deliveryDate" />
              <div class="invalid-feedback">Format: dd.mm.yy hh:mm</div>
            </div>
          </div>
          <div class="form-group row" v-if="realInvoice.extraCostsDescription">
            <label class="col-4">Extra Costs</label>
            <label class="col-8">{{ realInvoice.extraCostsAmount }} für {{ realInvoice.extraCostsDescription }}</label>
          </div>
          <div class="form-group row" v-if="canSave">
            <div class="col-5 offset-3">
              <button v-on:click="save" class="col-12 btn btn-success">Save</button>
            </div>
          </div>
        </form>
        <div class="col-12" :class="{ 'col-xxl-6': pdfURL }" v-if="invoiceEntries && invoiceEntries.length > 0">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Change</th>
                  <th scope="col">Designation</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Net / Brot Price</th>
                  <th scope="col">Website</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in invoiceEntries" :key="entry.id">
                  <td>
                    <div v-if="entry.stockItem" style="display: inline-flex">
                      <router-link :title="entry.stockItem.name" class="text-max-width" :to="{ name: 'item', params: { itemId: entry.stockItem.id } }">{{
                        entry.stockItem.name
                      }}</router-link>

                      <button
                        style="display: inline-block"
                        class="ms-2 btn btn-sm btn-sm-flat btn-primary"
                        type="button"
                        title="Update existing Item"
                        v-on:click="editItem(entry)"
                      >
                        <i-fa-pen-to-square />
                      </button>
                      <button class="ms-2 btn btn-sm btn-sm-flat btn-danger" type="button" title="Unlink entry from Item" v-on:click="unlinkItem(entry)">
                        <i-fa-link-slash />
                      </button>
                    </div>
                    <div v-else>
                      <button class="btn btn-sm btn-sm-flat btn-success px-1 me-1" title="Create Item from this Invoice Entry" v-on:click="newItem(entry)">
                        <i-fa-square-plus />
                      </button>
                      <button class="btn btn-sm btn-sm-flat btn-primary px-1" title="Link this Invoice Entry to existing Item" v-on:click="linkItem(entry)">
                        <i-fa-link />
                      </button>
                    </div>
                  </td>
                  <td>
                    <!--<router-link v-if="entry.item" :to="{ name: 'item',params:{ itemId: entry.item.id } }">{{entry.item.name}}</router-link>-->
                    <span v-if="entry.stockChange">#{{ entry.stockChange.id }}</span>
                    <div v-else-if="entry.stockItemId">
                      <button class="btn btn-sm btn-success px-1 py-0 me-1" title="Create Change from this Invoice Entry" v-on:click="newChange(entry)">
                        <i-fa-square-plus />
                      </button>
                    </div>
                  </td>
                  <td>{{ entry.itemDescription }}</td>
                  <td>{{ entry.amount }} {{ entry.unit }}</td>
                  <td>{{ entry.quantity }}</td>
                  <td>{{ $filters.asEuro(entry.netPrice) }} / {{ $filters.asEuro(entry.brottoPrice) }}</td>
                  <td>
                    <a v-if="entry.productSite" target="_blank" :href="entry.productSite">{{ realInvoice.seller }}</a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-if="analysing" class="col-12 justify-content-center" style="display: flex">
          <span class="mt-1">Analysing invoice...</span>
          <b-spinner class="center ms-3"></b-spinner>
        </div>
        <div v-if="!pdfURL" class="col-12 justify-content-center mb-4" style="display: flex">
          <button class="btn btn-primary" v-on:click="showPDF">Show PDF</button>
        </div>
        <div class="col-12 col-xxl-6 mb-4" v-if="pdfURL">
          <iframe :src="pdfURL" style="width: 100%; height: 1300px" frameborder="0"></iframe>
        </div>
      </template>
    </div>
    <b-modal ref="deleteInvoice" centered title="Delete Invoice" ok-title="Delete Invoice" ok-variant="danger" v-on:ok="deleteInvoice"
      >Could not analyse Invoice. Do you want to delete the invoice? Otherwise you can inset the data manually.</b-modal
    >
    <b-modal
      ref="editInvoice"
      centered
      :title="currentItem ? 'Update Item' : 'Create Item'"
      :ok-title="currentItem ? 'Update Item' : 'Create Item'"
      :ok-variant="currentItem ? 'primary' : 'success'"
      lazy
      :size="modalSize"
      v-on:ok="updateModalClicked"
      :ok-disabled="!currentEntry?.gtin && !updatedItem.barcode"
    >
      <form ref="editForm" class="container-fluid">
        <div class="row mb-3" v-if="currentItem">
          <div class="col text-center text-underline">Invoice Entry</div>
          <div class="col text-center text-underline">Updated Value</div>
          <div class="col text-center text-underline">Item</div>
        </div>
        <div class="form-group">
          <label for="name">Name</label>
          <div class="row">
            <div class="col" v-if="currentEntry">
              <button class="btn btn-light" v-on:click="updatedItem.name = currentEntry.itemDescription">
                {{ currentEntry.itemDescription }}
              </button>
            </div>
            <div class="col">
              <input
                type="text"
                class="form-control"
                :class="{ 'border border-warning': currentEntry && updatedItem.name === currentEntry.itemDescription }"
                required
                v-model="updatedItem.name"
              />
            </div>
            <div class="col" v-if="currentItem">
              <button class="btn btn-light" v-on:click="updatedItem.name = currentItem.name">{{ currentItem.name }}</button>
            </div>
          </div>
        </div>
        <div class="form-group was-validated" v-if="!currentEntry?.gtin">
          <label for="name">Barcode of Bottle</label>
          <barcode-input v-model="updatedItem.barcode" required />
          <div class="invalid-feedback" :style="{ display: updatedItem.barcode ? 'none' : 'block' }">Required</div>
        </div>
        <div class="form-group">
          <label for="name">Content</label>
          <div class="row">
            <div class="col" v-if="currentEntry">
              <button
                v-if="currentEntry.amount"
                class="btn btn-light"
                v-on:click="
                  updatedItem.unit = currentEntry.unit;
                  updatedItem.amount = currentEntry.amount;
                "
              >
                {{ currentEntry.amount }} {{ currentEntry.unit }}
              </button>
            </div>
            <div class="col">
              <content-input :object="updatedItem" />
            </div>
            <div class="col" v-if="currentItem">
              <button
                v-if="currentItem.amount"
                class="btn btn-light"
                v-on:click="
                  updatedItem.unit = currentItem.unit;
                  updatedItem.amount = currentItem.amount;
                "
              >
                {{ currentItem.amount }} {{ currentItem.unit }}
              </button>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label for="name">Alcohol by volume</label>
          <div class="row">
            <div class="col" v-if="currentEntry">
              <button v-if="currentEntry.alcoholByVolume" class="btn btn-light" v-on:click="updatedItem.alcoholByVolume = currentEntry.alcoholByVolume">
                {{ currentEntry.alcoholByVolume }} %
              </button>
            </div>
            <div class="col">
              <percent-input v-model="updatedItem.alcoholByVolume" />
            </div>
            <div class="col" v-if="currentItem">
              <button v-if="currentItem.alcoholByVolume" class="btn btn-light" v-on:click="updatedItem.alcoholByVolume = currentItem.alcoholByVolume">
                {{ currentItem.alcoholByVolume }} %
              </button>
            </div>
          </div>
        </div>
        <div class="row row-cols-1 row-cols-md-2" v-if="currentEntry">
          <div v-for="(imageUrl, index) of currentEntry.images" :key="index" class="col mb-4">
            <div
              class="card"
              style="border-width: 2px !important"
              :class="{ 'border border-success': updatedItem.selectedImageIndex === index }"
              v-on:click="updatedItem.selectedImageIndex = index"
            >
              <img :src="imageUrl" class="card-img-top no-high-images" />
            </div>
          </div>
          <div v-if="currentItem && currentItem.image" class="col mb-4">
            <div
              title="Current Image"
              class="card"
              style="border-width: 2px !important"
              :class="{ 'border border-success': updatedItem.selectedImageIndex === -2 }"
              v-on:click="updatedItem.selectedImageIndex = -2"
            >
              <img :src="baseURL + '/file/' + currentItem.image.original" class="card-img-top no-high-images" />
            </div>
          </div>
        </div>
        <div class="form-group" v-if="currentItem === null">
          <item-group-card ref="itemGroupCard" />
        </div>
        <div
          class="alert alert-warning"
          role="alert"
          v-if="currentEntry && currentEntry.images && currentEntry.images.length > 0 && updatedItem.selectedImageIndex === null"
        >
          No Image selected. Click on a image to select it.
        </div>
        <div class="alert alert-warning" role="alert" v-if="currentEntry && currentEntry.itemDescription === updatedItem.name">
          The item name has not been changed. It can contain unwanted characters.
        </div>
      </form>
    </b-modal>
    <b-modal ref="linkModal" centered title="Link Item with existing one" ok-title="Cancel" ok-only ok-variant="secondary" lazy size="lg">
      <div v-if="filteredItems && currentEntry" class="table-responsive">
        <p>
          Entry Name: {{ currentEntry.itemDescription }}, {{ currentEntry.amount }} {{ currentEntry.unit }}, Art.Nr:
          {{ currentEntry.articleNumber }}
          <button
            v-for="(url, index) in currentEntry.images"
            :key="index"
            class="ms-2 btn btn-sm btn-sm-flat btn-secondary"
            type="button"
            v-on:click="openImageModalFromUrl(url)"
          >
            <i-fa-image />
          </button>
        </p>
        <div class="form-group mx-2">
          <input type="text" class="mt-3 form-control" placeholder="Search" v-on:input="filter" />
        </div>
        <table class="table table-hover">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Seller</th>
              <th scope="col">Content</th>
              <th scope="col">Article Number</th>
              <th scope="col"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in filteredItems"
              :key="item.id"
              :class="{
                'table-active':
                  (item.seller && item.seller !== realInvoice.seller) || (item.amount && currentEntry.amount && item.amount !== currentEntry.amount),
              }"
            >
              <td>
                <router-link :to="{ name: 'item', params: { itemId: item.id, item: item } }">{{ item.name }}</router-link>
                <button v-if="item.image !== null" class="ms-2 btn btn-sm btn-sm-flat btn-secondary" type="button" v-on:click="openImageModal(item)">
                  <i-fa-image />
                </button>
              </td>
              <td>{{ item.seller }}</td>
              <td>{{ item.amount }} {{ item.unit === 'unknown' ? '' : item.unit }}</td>
              <td>{{ item.articleNumber }}</td>
              <td class="px-0">
                <button class="ms-2 btn btn-sm py-0 btn-primary" type="button" v-on:click="linkItemClicked(item)">
                  Link
                  <i-fa-link class="icon-btn" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </b-modal>
    <b-modal ref="imageModal" hide-footer no-fade centered>
      <div v-if="loading === true" class="justify-content-center" style="display: flex">
        <b-spinner class="center" label="Loading..."></b-spinner>
      </div>
      <img v-show="!loading" :src="currentImageURL" style="width: 100%" v-on:load="loading = false" />
    </b-modal>
  </div>
</template>

<script>
import http from '@/http-common';
import phoneticsFilter from '@/phoneticsFilter';
import ContentInput from '@/components/ContentInput.vue';
import PercentInput from '@/components/PercentInput.vue';
import ItemGroupCard from '@/components/ItemGroupCard.vue';
import BarcodeInput from '@/components/BarcodeInput.vue';

function parseDate(input) {
  if (input === undefined) return undefined;
  let sub = function (start) {
    return input.substring(start, start + 2);
  };
  //"dd.mm.yy hh:mm"
  // 01 34 67 91 23
  return new Date('20' + sub(6), sub(3) - 1, sub(0), sub(9), sub(12));
}

export default {
  components: {
    ContentInput,
    PercentInput,
    ItemGroupCard,
    BarcodeInput,
  },
  props: {
    invoice: {
      type: Object,
      default: null,
    },
    isNew: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      realInvoice: null,
      invoiceEntries: [],
      seller: undefined,
      invoiceDate: undefined,
      deliveryDate: undefined,
      analysing: false,
      pdfURL: null,
      currentEntry: null,
      currentItem: null,
      modalSize: 'lg',
      updatedItem: {
        name: null,
        amount: null,
        unit: null,
        barcode: null,
        alcoholByVolume: null,
        selectedImageIndex: null,
      },
      loading: false,
      currentImageURL: null,
      existingItems: [],
      filteredItems: [],
    };
  },
  computed: {
    canSave: function () {
      if (this.realInvoice === null) return false;
      else {
        return this.realInvoice.seller === null || this.realInvoice.invoiceDate === null || this.realInvoice.deliveryDate === null;
      }
    },
    fluid() {
      return this.pdfURL && window.innerWidth >= 1850;
    },
  },
  methods: {
    filter(event) {
      this.filteredItems = phoneticsFilter(this.existingItems, event.target.value);
    },
    newChange(entry) {
      http
        .post('/stockChange', {
          itemId: entry.stockItemId,
          netPrice: entry.netPrice,
          brottoPrice: entry.brottoPrice,
          amount: entry.quantity,
          priceAccuracy: 'fromBill',
          reason: 'bought',
          invoiceEntryId: entry.id,
        })
        .then(res => {
          entry.stockChange = res.data;
        });
    },
    linkItem(entry) {
      this.currentEntry = entry;
      this.filteredItems = this.existingItems;
      this.$refs.linkModal.show();
    },
    linkItemClicked(item) {
      const linkItem = () => {
        this.$refs.linkModal.hide();
        http
          .post(`/invoice/entry/${this.currentEntry.id}/itemLink`, {
            itemId: item.id,
          })
          .then(() => {
            this.currentEntry.stockItem = item;
            this.currentEntry.stockItemId = item.id;
          })
          .catch(alert);
      };
      let extraText;
      if (this.currentEntry.amount && item.amount && this.currentEntry.amount !== item.amount) {
        extraText = `The content of the entry and the item is different!<br>${this.currentEntry.amount} ${this.currentEntry.unit} vs ${item.amount} ${item.unit}<br>`;
      }
      if (item.seller && item.seller !== this.realInvoice.seller) {
        extraText = `The seller of the item and the seller of the invoice is different!<br>${item.seller} vs ${this.realInvoice.seller}`;
      }
      if (extraText) {
        const htmlMessage = this.$createElement('div', {
          domProps: { innerHTML: extraText },
        });
        this.$bvModal
          .msgBoxConfirm(htmlMessage, {
            title: 'Link Item to Entry Warning',
            headerBgVariant: 'warning',
            okVariant: 'warning',
            okTitle: 'Link item to entry',
            centered: true,
          })
          .then(link => {
            if (link) {
              linkItem();
            }
          })
          .catch(console.error);
      } else {
        linkItem();
      }
    },
    unlinkItem(entry) {
      let extraText;
      if (entry.stockItem.barcode === entry.gtin) {
        extraText = 'This will delete the barcode for the item.';
      }
      this.$bvModal
        .msgBoxConfirm(
          `Do you really want to unlink entry "${entry.itemDescription}", Content: ${entry.amount} ${entry.unit} from Item "${entry.stockItem.name}", Content: ${entry.stockItem.amount} ${entry.stockItem.unit}. ${extraText}`,
          {
            title: 'Unlink Item',
            okVariant: 'danger',
            okTitle: 'Unlink',
            centered: true,
          },
        )
        .then(unlink => {
          if (unlink) {
            http
              .delete(`/invoice/entry/${entry.id}/itemLink`)
              .then(() => {
                entry.stockItem = null;
              })
              .catch(alert);
          }
        })
        .catch(console.error);
    },
    newItem(entry) {
      this.modalSize = 'lg';
      this.currentEntry = entry;
      this.currentItem = null;
      this.updatedItem.barcode = entry.gtin;
      this.updatedItem.name = entry.itemDescription;
      this.updatedItem.amount = entry.amount;
      this.updatedItem.unit = entry.unit || 'Units';
      this.updatedItem.alcoholByVolume = entry.alcoholByVolume;
      this.updatedItem.selectedImageIndex = null;
      this.$refs.editInvoice.show();
    },
    editItem(entry) {
      this.modalSize = 'lg';
      this.currentEntry = entry;
      this.currentItem = entry.stockItem;
      this.updatedItem.name = entry.stockItem.name;
      if (entry.stockItem.amount) {
        this.updatedItem.amount = entry.stockItem.amount;
        this.updatedItem.unit = entry.stockItem.unit;
      } else {
        this.updatedItem.amount = entry.amount;
        this.updatedItem.unit = entry.unit || 'Units';
      }
      if (this.currentItem.image) {
        this.updatedItem.selectedImageIndex = -2;
      } else {
        this.updatedItem.selectedImageIndex = null;
      }
      if (entry.stockItem.alcoholByVolume) {
        this.updatedItem.alcoholByVolume = entry.stockItem.alcoholByVolume;
      } else {
        this.updatedItem.alcoholByVolume = entry.alcoholByVolume;
      }
      this.$refs.editInvoice.show();
    },
    async updateModalClicked(bvModalEvent) {
      if (this.$refs.editForm.checkValidity() === false) {
        bvModalEvent.preventDefault();
        return;
      }
      const data = {
        name: this.updatedItem.name,
        barcode: this.currentEntry.gtin || this.updatedItem.barcode,
        barcodePack: this.currentEntry.gtinPack || this.updatedItem.barcodePack,
        articleNumber: this.currentEntry.articleNumber || this.updatedItem.articleNumber,
        seller: this.realInvoice.seller,
        amount: this.updatedItem.amount,
        unit: this.updatedItem.unit,
        alcoholByVolume: this.updatedItem.alcoholByVolume,
        website: this.currentEntry.productSite,
      };
      if (this.updatedItem.selectedImageIndex !== null) {
        data.itemImageURL = this.currentEntry.images[this.updatedItem.selectedImageIndex];
      }
      const onError = err => {
        alert('Fehler: ' + err);
        console.error(err);
      };
      if (this.$refs.itemGroupCard) {
        const result = await this.$refs.itemGroupCard.saveItemGroup();
        if (typeof result === 'number' || result === null) {
          data['itemGroupId'] = result;
        } else {
          onError(result);
        }
      }
      if (this.currentItem) {
        http
          .put('/item/' + this.currentItem.id, data)
          .then(response => {
            this.currentEntry.stockItem = response.data;
          })
          .catch(onError);
      } else {
        http
          .post('/item', data)
          .then(response => {
            this.currentEntry.stockItem = response.data;
            this.currentEntry.stockItemId = response.data.id;
            http.put('/invoiceEntry/' + this.currentEntry.id, {
              itemId: response.data.id,
            });
          })
          .catch(onError);
      }
    },
    openImageModal(item) {
      this.loading = true;
      this.currentImageURL = http.getImage(item.image.original);
      this.$refs.imageModal.show();
    },
    openImageModalFromUrl(url) {
      this.loading = true;
      this.currentImageURL = url;
      this.$refs.imageModal.show();
    },
    showPDF() {
      this.pdfURL = http.defaults.baseURL + '/file/' + this.realInvoice.fileId;
    },
    deleteInvoice() {
      http.delete('/invoice/' + this.realInvoice.id).then(() => {
        this.realInvoice = null;
        this.$router.push({ name: 'invoiceList' });
      });
    },
    save() {
      if (this.$refs.form.checkValidity() === false) {
        return;
      }
      http
        .put('/invoice/' + this.realInvoice.id, {
          seller: this.seller,
          invoiceDate: parseDate(this.invoiceDate),
          deliveryDate: parseDate(this.deliveryDate),
        })
        .then(res => {
          this.realInvoice = res.data;
        });
    },
    retrieveinvoice() {
      http
        .get('/invoice/' + this.$route.params.invoiceId)
        .then(response => {
          this.realInvoice = response.data;
        })
        .catch(e => {
          console.log(e);
        });
    },
    retrieveInvoiceEntries() {
      const invoiceId = this.invoice !== null ? this.invoice.id : this.$route.params.invoiceId;
      http
        .get('/invoice/' + invoiceId + '/entries')
        .then(response => {
          this.invoiceEntries = response.data;
          for (const e of this.invoiceEntries) {
            e.images = JSON.parse(e.images);
          }
        })
        .catch(console.error);
    },
    retrieveAnalysis() {
      this.analysing = true;
      const invoiceId = this.invoice !== null ? this.invoice.id : this.$route.params.invoiceId;
      http
        .get('/invoice/' + invoiceId + '/analyse')
        .then(response => {
          this.analysing = false;
          this.realInvoice = response.data.invoice;
          this.invoiceEntries = response.data.entries;
          for (const e of this.invoiceEntries) {
            e.images = JSON.parse(e.images);
          }
        })
        .catch((/*err*/) => {
          this.analysing = false;
          this.retrieveInvoiceEntries();
          this.$refs.deleteInvoice.show();
        });
    },
    retrieveItems() {
      http
        .get('/itemsWithImage')
        .then(response => {
          this.existingItems = response.data;
        })
        .catch(console.error);
    },
  },
  mounted() {
    this.baseURL = http.defaults.baseURL;
    if (this.invoice === null) {
      this.retrieveinvoice();
    } else {
      this.realInvoice = this.invoice;
    }
    if (this.isNew) {
      this.retrieveAnalysis();
    } else {
      this.retrieveInvoiceEntries();
    }
    this.retrieveItems();
  },
  beforeDeactivate: async function () {
    if (this.realInvoice && !this.realInvoice.seller) {
      await http.delete('/invoice/' + this.realInvoice.id);
    }
  },
};
</script>

<style scoped>
.no-high-images {
  object-fit: contain;
  max-height: 240px;
}

.btn-sm-flat {
  padding-top: 0 !important;
  padding-bottom: 0px !important;
}

.text-underline {
  text-decoration: underline;
}

td {
  white-space: nowrap;
}

.text-max-width {
  display: inline-block;
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media only screen and (min-width: 1850px) {
  .col-xxl-6 {
    -webkit-box-flex: 0;
    flex: 0 0 50%;
    max-width: 50%;
  }
}
</style>
