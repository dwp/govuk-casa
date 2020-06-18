const makeEditLink = require('./makeEditLink.js');
const validate = require('./validate.js');
const sanitise = require('./sanitise.js');

module.exports = {
  makeEditLink,
  ...sanitise,
  ...validate,
};
