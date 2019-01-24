var bars = undefined;

export default {
    getBars: function() {
        if (bars === undefined) {
            bars = JSON.parse(localStorage.getItem("bars"));
        }
        return bars !== null ? bars : [];
    },
    setBars: function(val) {
        if (!Array.isArray(val)) {
            throw "val is not an array of bars";
        }
        bars = val;
        localStorage.setItem("bars", JSON.stringify(bars));
    },
}