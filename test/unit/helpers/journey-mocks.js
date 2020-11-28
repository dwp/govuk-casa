const sinon = require('sinon');

const { DEFAULT_CONTEXT_ID } = require('../../../lib/enums.js');

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
  toObject: sinon.stub().returns({}),
  fromObject: sinon.stub().callsFake(() => data()),
  isDefault: sinon.stub().returns(true),
  identity: { id: DEFAULT_CONTEXT_ID },
});

data.putContext = sinon.stub().returns();

const plan = () => ({
  containsWaypoint: sinon.stub().returns(false),
  traverse: sinon.stub().returns([]),
  traverseNextRoutes: sinon.stub().returns([]),
  traversePrevRoutes: sinon.stub().returns([]),
  getOrigins: sinon.stub().returns([]),
  getPrevOutwardRoutes: sinon.stub().returns([]),
});

module.exports = {
  map,
  data,
  plan,
};
