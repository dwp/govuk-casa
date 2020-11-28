const createGetRequest = require('./createGetRequest.js');
const parseRequest = require('./parseRequest.js');
const validate = require('./validate.js');
const sanitise = require('./sanitise.js');

module.exports = {
  createGetRequest,
  parseRequest,
  ...sanitise,
  ...validate,
};
