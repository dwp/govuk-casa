const proxyquire = require('proxyquire');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const { expect } = chai;
chai.use(sinonChai);

const { app } = require('../../helpers/express-mocks.js');
const logger = require('../../helpers/logger-mock.js');

describe('Middleware: static/serve-assets', () => {
  let proxyStubs;
  let mockLogger;
  let mockApp;
  let mwServe;

  beforeEach(() => {
    proxyStubs = {
      express: {
        static: sinon.stub(),
      },
    };
    mwServe = proxyquire('../../../../middleware/static/serve-assets.js', proxyStubs);

    mockLogger = logger();
    mockApp = app();
  });

  describe('should mount static route handlers', () => {
    const mounts = [{
      url: '/test/casa/url',
      path: '/test/assets/dir/casa',
    }, {
      url: '/govuk/virtual/js/all.js',
      path: '/govuk/frontend/dir/govuk/all.js',
    }, {
      url: '/govuk/virtual/assets',
      path: '/govuk/frontend/dir/govuk/assets',
    }, {
      url: '/govuk/virtual/js/govuk-template.js',
      path: '/govuk/jinja/dir/assets/javascripts/govuk-template.js',
    }];

    mounts.forEach((m) => {
      it(`should mount ${m.url} onto ${m.path}`, () => {
        mwServe({
          logger: mockLogger,
          app: mockApp,
          compiledAssetsDir: '/test/assets/dir',
          prefixCasa: '/test/casa/url',
          govukFrontendVirtualUrl: '/govuk/virtual',
          npmGovukFrontend: '/govuk/frontend/dir',
          npmGovukTemplateJinja: '/govuk/jinja/dir',
          maxAge: 100,
        });

        expect(mockApp.use).to.be.calledWith(m.url);
        expect(proxyStubs.express.static).to.be.calledWith(m.path);
      });
    });
  });
});
