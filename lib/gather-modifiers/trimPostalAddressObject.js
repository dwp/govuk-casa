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
 * Works hand in hand with the core CASA `postalAddressObject` form macro.
 *
 * Trims white space from the address items and reformats the post code
 * to fit the standard pattern. e.g. puts the space in if the user leaves it out.
 *
 *
 * @param {object} value Address object to test
 * @return {object} GatherModifiered version of the Address object
 */
function trimPostalAddressObject(value) {
  // copy only the expected address properties
  const address = {
    address1: transferAndTrim(value.fieldValue, 'address1'),
    address2: transferAndTrim(value.fieldValue, 'address2'),
    address3: transferAndTrim(value.fieldValue, 'address3'),
    address4: transferAndTrim(value.fieldValue, 'address4'),
    postcode: transferAndTrim(value.fieldValue, 'postcode'),
  };

  // convert to upper case
  address.postcode = address.postcode.toUpperCase();

  // remove any double spaces
  address.postcode = address.postcode.replace(/\s{2,}/, ' ');

  // add a space in the middle if the user did not add one
  if (address.postcode.length >= 4 && !address.postcode.includes(' ')) {
    address.postcode = `${address.postcode.slice(
      0,
      address.postcode.length - 3,
    )} ${address.postcode.slice(address.postcode.length - 3)}`;
  }

  return address;
}

module.exports = trimPostalAddressObject;
