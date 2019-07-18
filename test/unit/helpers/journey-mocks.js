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

const graph = () => ({
  containsNode: sinon.stub().returns(false),
  traverse: sinon.stub().returns([]),
  traverseNextEdges: sinon.stub().returns([]),
  getOrigins: sinon.stub().returns([]),
});

module.exports = {
  map,
  data,
  graph,
};
