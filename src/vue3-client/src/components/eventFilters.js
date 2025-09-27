export function onlyNumbers(evt) {
  const charCode = evt.which ? evt.which : evt.keyCode;
  // replace . by ,
  const CHAR_CODE_COMMA = 44;
  const CHAR_CODE_DOT = 46;
  if (charCode === CHAR_CODE_DOT || charCode === CHAR_CODE_COMMA) {
    if (evt.target.value.indexOf(',') !== -1 || evt.target.value.indexOf('.') !== -1) {
      evt.preventDefault();
    }
    return;
  }
  if ((charCode < 48 || charCode > 57) && charCode !== CHAR_CODE_DOT && charCode !== CHAR_CODE_COMMA) {
    evt.preventDefault();
  }
}
