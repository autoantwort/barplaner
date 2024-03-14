import phonetics from "../../Nodejs-RestAPIs/app/util/colognePhonetics";

export default (array, searchedValue, additionalFilter) => {
    const otherFilter = additionalFilter ? additionalFilter : () => false;
    const v = phonetics.convert(searchedValue).split(" ").map(s => new RegExp(`(^| )${s}`));
    const r = new RegExp(searchedValue, "i");
    const exactMatches = [];
    return exactMatches.concat(array.filter(p => {
        const resultColognePhonetics = () => {
            if (p.name.search(r) !== -1) {
                exactMatches.push(p);
                return false;
            }
            for (let s of v) {
                if (p.nameColognePhonetics.search(s) === -1) {
                    return false;
                }
            }
            return true;
        }
        return resultColognePhonetics() || otherFilter(p);
    }));
};