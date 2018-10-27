/**
 * Renders a given attributes object into a format suitable for adding to an
 * HTML element.
 */

const nunjucks = require('nunjucks');

/**
 * Attribute values will be HTML/attribute escaped.
 *
 * Example:
 *   Given: {class: 'basic', 'data-ga': 3}
 *   Output: class="basic" data-ga="3"
 *
 * @param  {object} attrsObject Attributes object (in name:value pairs)
 * @return {string} Formatted
 */
module.exports = function renderAsAttributes(attrsObject) {
  const attrsList = [];
  if (typeof attrsObject === 'object') {
    Object.keys(attrsObject).forEach((key) => {
      const value = String(attrsObject[key]).replace(/[<>"'&]/g, m => ({
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        '\'': '&#039;',
        '&': '&amp;'
      }[m]));
      attrsList.push(`${key}="${value}"`);
    });
  }
  return new nunjucks.runtime.SafeString(attrsList.join(' '));
};
