const sinon = require('sinon');

const map = () => ({
  guid: null,
  traverse: sinon.stub().returns([]),
  containsWaypoint: sinon.stub().returns(false),
});

const data = () => ({
  getData: sinon.stub().returns({}),
  getDataForPage: sinon.stub().returns({}),
  getValidationErrors: sinon.stub().returns({}),
  getValidationErrorsForPage: sinon.stub().returns({}),
  clearValidationErrorsForPage: sinon.stub(),
  setDataForPage: sinon.stub(),
  setValidationErrorsForPage: sinon.stub(),
});

module.exports = {
  map,
  data,
};
