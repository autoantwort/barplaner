import phonetics from "../../Nodejs-RestAPIs/app/util/colognePhonetics";

export default (array, searchedValue) => {
    const v = phonetics.convert(searchedValue).split(" ");
    return array.filter(p => {
        for (let s of v) {
            if (p.nameColognePhonetics.indexOf(s) === -1) {
                return false;
            }
        }
        return true;
    });
};