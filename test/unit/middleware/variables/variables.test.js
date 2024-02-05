const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const { expect } = chai;
chai.use(sinonChai);

const { request, response } = require('../../helpers/express-mocks.js');
const logger = require('../../helpers/logger-mock.js');

const mwVariables = require('../../../../middleware/variables/variables.js');

describe('Middleware: session/expiry', () => {
  let mockLogger;
  let mockRequest;
  let mockResponse;
  let stubNext;

  beforeEach(() => {
    mockLogger = logger();
    mockRequest = request();
    mockRequest.i18nTranslator = {
      t: sinon.stub().callsFake((s) => (`${s}_translated`)),
    };
    mockResponse = response();
    mockResponse.locals.casa = {};
    stubNext = sinon.stub();
  });

  it('should create a trace log', () => {
    const middlewareWithConfig = mwVariables({
      logger: mockLogger,
      mountUrl: '/test-mount/',
      serviceName: 'test-service',
      govukFrontendVirtualUrl: '/govuk/url',
      phase: 'beta',
    });
    middlewareWithConfig(mockRequest, mockResponse, stubNext);
    expect(mockLogger.trace).to.be.calledOnceWithExactly(
      'Setting template variables (govukFrontendVirtualUrl: %s, serviceName: %s, mountUrl: %s, phase: %s)',
      '/govuk/url',
      'test-service',
      '/test-mount/',
      'beta',
    );
  });

  it('should create res.locals.govuk', () => {
    const middlewareWithConfig = mwVariables({
      logger: mockLogger,
      mountUrl: '/test-mount/',
      serviceName: 'test-service',
      govukFrontendVirtualUrl: '/govuk/url',
      phase: 'beta',
    });
    middlewareWithConfig(mockRequest, mockResponse, stubNext);
    expect(mockResponse.locals).to.have.property('govuk').that.eql({
      assetPath: '/govuk/url/assets',
      components: {
        header: {
          assetsPath: '/govuk/url/assets/images',
          serviceName: 'test-service_translated',
          serviceUrl: '/test-mount/',
          homepageUrl: 'https://www.gov.uk/',
          useTudorCrown: true,
        },
      },
    });
  });

  it('should create res.locals.casa.* properties', () => {
    const middlewareWithConfig = mwVariables({
      logger: mockLogger,
      mountUrl: '/test-mount/',
      serviceName: 'test-service',
      govukFrontendVirtualUrl: '/govuk/url',
      phase: 'beta',
    });
    middlewareWithConfig(mockRequest, mockResponse, stubNext);
    expect(mockResponse.locals).to.have.property('casa').that.eql({
      mountUrl: '/test-mount/',
      phase: 'beta',
    });
  });
});
