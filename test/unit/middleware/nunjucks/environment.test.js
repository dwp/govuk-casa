const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const proxyquire = require('proxyquire');

const { expect } = chai;
chai.use(sinonChai);

const logger = require('../../helpers/logger-mock.js');
const { app } = require('../../helpers/express-mocks.js');
const { environment } = require('../../helpers/nunjucks-mocks.js');

describe('Middleware: nunjucks/index', () => {
  let mockLogger;
  let mockApp;
  let mockNunjucksLoader;
  let mockNunjucksEnv;

  const stubNunjucks = {
    FileSystemLoader: sinon.stub().callsFake(() => (mockNunjucksLoader)),
    Environment: sinon.stub().callsFake(() => (mockNunjucksEnv)),
  };

  const mwNunjucks = proxyquire('../../../../middleware/nunjucks/environment.js', {
    nunjucks: stubNunjucks,
  });

  beforeEach(() => {
    mockLogger = logger();
    mockApp = app();
    mockNunjucksLoader = {};
    mockNunjucksEnv = environment();
  });

  afterEach(() => {
    stubNunjucks.FileSystemLoader.resetHistory();
    stubNunjucks.Environment.resetHistory();
  });

  it('should create a template file loader with directories resolved to full paths, in correct order', () => {
    const cwd = process.cwd();
    mwNunjucks(mockLogger, mockApp, ['a', 'b'], 'govuk-frontend');
    expect(stubNunjucks.FileSystemLoader).to.be.calledOnceWith([
      `${cwd}/a`,
      `${cwd}/b`,
      `${cwd}/views`,
      `${cwd}/govuk-frontend`,
    ]);
  });

  it('should configure template loader with correct configuration', () => {
    mwNunjucks(mockLogger, mockApp);
    const call = stubNunjucks.FileSystemLoader.getCall(0);
    expect(call.args[1]).to.eql({
      watch: false,
      noCache: false,
    });
  });

  it('should create an environment with correct configuration', () => {
    mwNunjucks(mockLogger, mockApp);
    expect(stubNunjucks.Environment).to.be.calledOnceWithExactly(mockNunjucksLoader, {
      autoescape: true,
      throwOnUndefined: false,
      trimBlocks: false,
      lstripBlocks: false,
    });
  });

  it('should set express app', () => {
    mwNunjucks(mockLogger, mockApp);
    expect(mockNunjucksEnv.express).to.be.calledOnceWithExactly(mockApp);
  });

  it('should set "view engine" to "njk"', () => {
    mwNunjucks(mockLogger, mockApp);
    expect(mockApp.set).to.be.calledOnceWithExactly('view engine', 'njk');
  });

  it('should create info log', () => {
    mwNunjucks(mockLogger, mockApp);
    expect(mockLogger.info).to.be.calledOnceWithExactly('Nunjucks configured');
  });
});
