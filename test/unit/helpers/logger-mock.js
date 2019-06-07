const sinon = require('sinon');

module.exports = () => ({
  trace: sinon.stub(),
  debug: sinon.stub(),
  info: sinon.stub(),
  error: sinon.stub(),
  warn: sinon.stub(),
  fatal: sinon.stub(),
  setSessionId: sinon.stub(),
});
