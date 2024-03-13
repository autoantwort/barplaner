import phonetics from "../../Nodejs-RestAPIs/app/util/colognePhonetics";

export default (array, searchedValue, additionalFilter) => {
    const otherFilter = additionalFilter ? additionalFilter : () => false;
    const v = phonetics.convert(searchedValue).split(" ");
    return array.filter(p => {
        const resultColognePhonetics = () => {
            for (let s of v) {
                if (p.nameColognePhonetics.indexOf(s) === -1) {
                    return false;
                }
            }
            return true;
        }
        return resultColognePhonetics() || otherFilter(p);
    });
};