/**
 * Gets the property value and Trims white space from it
 *
 * @param {object} value Address object to mung
 * @param {string} prop file property name
 * @return {string} munged property
 */
function transferAndTrim(value, prop) {
  if (typeof value === 'object' && prop in value && typeof value[prop] === 'string') {
    return value[prop].trim();
  }
  return '';
}

/**
 * Reformats a postcode into the standard form, as long as this results in a valid postcode
 *
 * It removes all the spaces from the postcode, converts it to uppercase and then
 * puts a single space back in to separate the last three characters.
 *
 * We found during user testing that some accessibility software
 * automatically adds spaces when entering letters and numbers, resulting in an invalid post code.
 * So the remedy is to remove all the spaces from the string and then to add one space back.
 *
 * If this results in a valid postcode then great it returns the new postcode
 * If not then it returns the original value.
 *
 * So if someone has made a mistake then they are not asked to correct the reformatted
 * text, but instead are asked to correct their original
 *
 * @param {object} value Address object to test
 * @return {object} GatherModifiered version of the Address object
 */
function reformatPostcodeIfValid(value) {
  // convert to upper case
  let postcode = value.toUpperCase();

  // remove any double spaces
  postcode = postcode.replace(/\s+/g, '');

  // add a space in the middle if the user did not add one
  if (postcode.length >= 4) {
    postcode = `${postcode.slice(0, postcode.length - 3)} ${postcode.slice(postcode.length - 3)}`;
  }

  const pc = /^(?![QVX])[A-Z]((?![IJZ])[A-Z][0-9](([0-9]?)|([ABEHMNPRVWXY]?))|([0-9]([0-9]?|[ABCDEFGHJKPSTUW]?))) ?[0-9]((?![CIKMOV])[A-Z]){2}$|^(BFPO)[ ]?[0-9]{1,4}$/i;

  if (pc.test(postcode)) {
    return postcode;
  }

  return value;
}

/**
 * Works hand in hand with the core CASA `postalAddressObject` form macro.
 *
 * Trims white space from the address items and reformats the post code.
 *
 * @param {object} value Address object to test
 * @return {object} GatherModifiered version of the Address object
 */
function trimPostalAddressObject(value) {
  // copy only the expected address properties

  return {
    address1: transferAndTrim(value.fieldValue, 'address1'),
    address2: transferAndTrim(value.fieldValue, 'address2'),
    address3: transferAndTrim(value.fieldValue, 'address3'),
    address4: transferAndTrim(value.fieldValue, 'address4'),
    postcode: reformatPostcodeIfValid(transferAndTrim(value.fieldValue, 'postcode')),
  };
}

module.exports = trimPostalAddressObject;
