const chai = require('chai');
const sinonChai = require('sinon-chai');

const { expect } = chai;
chai.use(sinonChai);

const { request, response } = require('../../helpers/express-mocks.js');
const logger = require('../../helpers/logger-mock.js');

const mw404 = require('../../../../middleware/errors/404.js');

describe('Middleware: errors/404', () => {
  const mockLogger = logger();
  let middleware;
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    middleware = mw404(mockLogger);
    mockRequest = request();
    mockResponse = response();
  });

  it('should create an info log', () => {
    mockRequest.url = '/test/url';
    middleware(mockRequest, mockResponse);
    expect(mockLogger.info).to.have.been.calledOnceWithExactly('[404] %s', '/test/url');
  });

  it('should set HTTP status to 404', () => {
    middleware(mockRequest, mockResponse);
    expect(mockResponse.status).to.have.been.calledOnceWithExactly(404);
  });

  it('should render the casa/errors/404.njk template', () => {
    middleware(mockRequest, mockResponse);
    expect(mockResponse.render).to.have.been.calledOnceWithExactly('casa/errors/404.njk');
  });
});
