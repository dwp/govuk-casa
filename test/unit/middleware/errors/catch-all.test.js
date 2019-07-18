const chai = require('chai');
const sinonChai = require('sinon-chai');

const { expect } = chai;
chai.use(sinonChai);

const { request, response } = require('../../helpers/express-mocks.js');
const logger = require('../../helpers/logger-mock.js');

const mwCatchAll = require('../../../../middleware/errors/catch-all.js');

describe('Middleware: errors/catch-all', () => {
  let mockLogger;
  let middleware;
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    mockLogger = logger();
    middleware = mwCatchAll(mockLogger);
    mockRequest = request();
    mockResponse = response();
  });

  describe('Bad CSRF token', () => {
    let mockError;

    beforeEach(() => {
      mockError = new Error();
      mockError.code = 'EBADCSRFTOKEN';
    });

    it('should create an info log', () => {
      middleware(mockError, mockRequest, mockResponse);
      expect(mockLogger.info).to.have.been.calledOnceWithExactly('[403] CSRF token missing/invalid');
    });

    it('should set HTTP status to 403', () => {
      middleware(mockError, mockRequest, mockResponse);
      expect(mockResponse.status).to.have.been.calledOnceWithExactly(403);
    });

    it('should render the casa/errors/403.njk template', () => {
      middleware(mockError, mockRequest, mockResponse);
      expect(mockResponse.render).to.have.been.calledOnceWithExactly('casa/errors/403.njk');
    });
  });

  describe('Other errors', () => {
    let mockError;

    beforeEach(() => {
      mockError = new Error('Test Error');
    });

    it('should create an error log', () => {
      middleware(mockError, mockRequest, mockResponse);
      expect(mockLogger.error).to.have.been.calledOnceWith('[500] Internal Server Error - %s - %s', 'Test Error');
    });

    it('should set HTTP status to 500', () => {
      middleware(mockError, mockRequest, mockResponse);
      expect(mockResponse.status).to.have.been.calledOnceWithExactly(500);
    });

    it('should render the casa/errors/500.njk template', () => {
      middleware(mockError, mockRequest, mockResponse);
      expect(mockResponse.render).to.have.been.calledOnceWithExactly('casa/errors/500.njk');
    });
  });
});
