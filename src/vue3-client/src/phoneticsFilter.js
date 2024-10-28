import phonetics from '../../Nodejs-RestAPIs/app/util/colognePhonetics';

export default (array, searchedValue, additionalExactFilter, additionalPhoneticsFilter) => {
  const otherExactFilter = additionalExactFilter ?? (() => false);
  const otherPhoneticsFilter = additionalPhoneticsFilter ?? (() => false);
  const v = phonetics
    .convert(searchedValue)
    .split(' ')
    .map(s => new RegExp(`(^| )${s}`));
  const r = new RegExp(searchedValue, 'i');
  const exactMatches = [];
  const matchesExactName = name => name.search(r) !== -1;
  const matchesColognePhoneticsName = nameColognePhonetics => {
    for (let s of v) {
      if (nameColognePhonetics.search(s) === -1) {
        return false;
      }
    }
    return true;
  };
  return exactMatches.concat(
    array.filter(p => {
      if (matchesExactName(p.name ?? p.text) || otherExactFilter(p, matchesExactName)) {
        exactMatches.push(p);
        return false;
      }
      return matchesColognePhoneticsName(p.nameColognePhonetics) || otherPhoneticsFilter(p, matchesColognePhoneticsName);
    }),
  );
};
