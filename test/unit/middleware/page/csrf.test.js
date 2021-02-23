const proxyquire = require('proxyquire');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const sinon = require('sinon');

const { expect } = chai;
chai.use(sinonChai);

const { request, response } = require('../../helpers/express-mocks.js');

const mwCsrf = require('../../../../middleware/page/csrf.js');

describe('Middleware: page/csrf', () => {
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    mockRequest = request();
    mockResponse = response();
  });

  describe('csrf', () => {
    it('should be configured to not use cookies and uses "session" as request property', () => {
      const stubCsurf = sinon.stub();
      proxyquire('../../../../middleware/page/csrf.js', {
        csurf: stubCsurf,
      });

      expect(stubCsurf).to.be.calledOnceWith({
        cookie: false,
        sessionKey: 'session',
        value: sinon.match.func,
      });
    });

    it('should extract and return the req.body._csrf value', () => {
      const stubCsurf = sinon.stub().callsFake((config) => {
        expect(config.value).is.an.instanceOf(Function);
        mockRequest.body = {
          _csrf: 'test-token',
        };
        const token = config.value(mockRequest);
        expect(mockRequest).to.not.have.property('_csrf');
        expect(token).to.equal('test-token');
      });
      proxyquire('../../../../middleware/page/csrf.js', {
        csurf: stubCsurf,
      });
    });
  });

  describe('supply token', () => {
    it('should set res.locals.casa.csrfToken containing csrf token', () => {
      // The token-supplying middleware is the last in the array of functions
      const middleware = mwCsrf[mwCsrf.length - 1];
      const stubNext = sinon.stub();
      mockRequest.csrfToken = sinon.stub().returns('test-token');
      mockResponse.locals.casa = {};
      middleware(mockRequest, mockResponse, stubNext);
      expect(mockResponse.locals.casa).has.property('csrfToken').that.equals('test-token');
      expect(stubNext).is.calledOnceWithExactly();
    });
  });
});
