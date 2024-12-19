const NavigationDataService = {
  _data: null,

  set(data) {
    this._data = data;
  },

  get() {
    const data = this._data;
    this._data = null; // Clear after retrieval
    return data;
  },
};

export default NavigationDataService;
