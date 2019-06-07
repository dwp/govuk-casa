const chai = require('chai');
const sinonChai = require('sinon-chai');

const { expect } = chai;
chai.use(sinonChai);

const { request, response } = require('../../helpers/express-mocks.js');
const logger = require('../../helpers/logger-mock.js');

const mwMount = require('../../../../middleware/mount/mount.js');

describe('Middleware: mount', () => {
  let mockLogger;
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    mockLogger = logger();
    mockRequest = request();
    mockResponse = response();
  });

  it('should create a trace log', () => {
    const middleware = mwMount(mockLogger, '/test-mount/');
    middleware(mockRequest, mockResponse);
    expect(mockLogger.trace).to.have.been.calledOnceWithExactly('Redirecting to mountUrl %s', '/test-mount/');
  });

  it('should 302 redirect to mount url', () => {
    const middleware = mwMount(mockLogger, '/test-mount/');
    middleware(mockRequest, mockResponse);
    expect(mockResponse.status).to.have.been.calledWithExactly(302);
    expect(mockResponse.redirect).to.have.been.calledWithExactly('/test-mount/');
  });
});
