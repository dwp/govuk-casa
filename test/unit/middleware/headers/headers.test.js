const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const { expect } = chai;
chai.use(sinonChai);

const { request, response } = require('../../helpers/express-mocks.js');
const logger = require('../../helpers/logger-mock.js');

const mwHeaders = require('../../../../middleware/headers/headers.js');

describe('Middleware: headers/headers', () => {
  let mockLogger;
  let middleware;
  let mockRequest;
  let mockResponse;
  let stubNext;

  beforeEach(() => {
    mockLogger = logger();
    middleware = mwHeaders(mockLogger);
    mockRequest = request();
    mockResponse = response();
    stubNext = sinon.stub();
  });

  it('should create a trace log', () => {
    mockRequest.url = '/test-url';
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockLogger.trace).to.have.been.calledOnceWithExactly('apply headers to %s %s', 'GET', '/test-url');
  });

  it('should set appropriate headers on non-static assets', () => {
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockResponse.setHeader).to.have.been.calledWithExactly('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    expect(mockResponse.setHeader).to.have.been.calledWithExactly('Pragma', 'no-cache');
    expect(mockResponse.setHeader).to.have.been.calledWithExactly('Expires', 0);
  });

  describe('should set appropriate headers when requesting a static asset', () => {
    let _now;

    beforeEach(() => {
      _now = Date.now;
      Date.now = () => (0); // Set "now" to unix epoch
    });

    afterEach(() => {
      Date.now = _now;
    });

    ['js', 'jpg', 'jpeg', 'css', 'png', 'svg', 'woff', 'woff2', 'eot', 'ttf', 'otf'].forEach((ext) => {
      it(`file extension: ${ext}`, () => {
        mockRequest.url = `asset.${ext}`;
        mockResponse = response();
        middleware(mockRequest, mockResponse, stubNext);
        expect(mockResponse.setHeader).to.have.been.calledWithExactly('Cache-Control', 'public');
        expect(mockResponse.setHeader).to.have.been.calledWithExactly('Pragma', 'cache');
        expect(mockResponse.setHeader).to.have.been.calledWithExactly('Expires', 'Fri, 02 Jan 1970 00:00:00 GMT');
      });
    });
  });

  it('should set specified default headers', () => {
    middleware = mwHeaders(mockLogger, {
      'Test-Header': 'TestValue',
    });
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockResponse.setHeader).to.have.been.calledWithExactly('Test-Header', 'TestValue');
  });

  it('should not set disabled headers', () => {
    middleware = mwHeaders(mockLogger, null, ['Expires']);
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockResponse.setHeader).to.not.have.been.calledWith('Expires');
  });
});
