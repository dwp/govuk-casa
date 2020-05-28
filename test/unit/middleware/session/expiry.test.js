const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const { expect } = chai;
chai.use(sinonChai);

const { request, response } = require('../../helpers/express-mocks.js');
const logger = require('../../helpers/logger-mock.js');

const mwExpiry = require('../../../../middleware/session/expiry.js');

describe('Middleware: session/expiry', () => {
  let mockLogger;
  let mockRequest;
  let mockResponse;
  let mockSessionExpiryController;
  let stubNext;
  let middleware;
  let _now;

  beforeEach(() => {
    mockLogger = logger();
    mockRequest = request();
    mockResponse = response();
    mockSessionExpiryController = undefined;
    stubNext = sinon.stub().callsFake(() => mockResponse.send('Handled elsewhere'));
    middleware = mwExpiry(mockLogger);
    _now = Date.now;
    Date.now = () => (3600 * 1000);
  });

  afterEach(() => {
    Date.now = _now;
  });

  it('should chain to next middleware if there is no session', () => {
    middleware(mockRequest, mockResponse, stubNext);
    return expect(stubNext).to.be.calledOnce;
  });

  it('should set a new dateExpire attribute on the session if it has not expired', () => {
    const middlewareWithConfig = mwExpiry(mockLogger, '/', mockSessionExpiryController, {
      ttl: 3600,
    });
    mockRequest.session.dateExpire = '1970-01-01T01:30:00.000Z';
    middlewareWithConfig(mockRequest, mockResponse, stubNext);
    expect(mockRequest.session.dateExpire).to.be.a('string').and.equals('1970-01-01T02:00:00.000Z');
  });

  it('should create debug log when removing req.casaSessionExpired', () => {
    mockRequest.casaSessionExpired = 'test-removed-session';
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockLogger.debug).to.be.calledWithExactly('Auto-removed session %s will be cleared up', 'test-removed-session');
  });

  it('should destroy the session when req.casaSessionExpired is present', () => {
    mockRequest.casaSessionExpired = 'test-removed-session';
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockRequest.session.destroy).to.be.calledOnceWith(sinon.match.func);
    return expect(mockRequest.casaSessionExpired).to.be.undefined;
  });

  it('should destroy the session when req.session.dateExpire is present and has passed', () => {
    mockRequest.session.dateExpire = '1970-01-01T00:00:00.000Z';
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockRequest.session.destroy).to.be.calledOnceWith(sinon.match.func);
  });

  it('should create an error log when a destroy error occurs', () => {
    mockRequest.casaSessionExpired = 'trigger';
    mockRequest.session.destroy.reset();
    mockRequest.session.destroy = sinon.stub().callsFake((callback) => {
      callback(new Error('test-error'));
    });

    middleware(mockRequest, mockResponse, stubNext);
    expect(mockLogger.error).to.be.calledOnceWithExactly('Failed to destory session. Error: %s', 'test-error');
  });

  it('should use the correct config when clearing the session cookie', () => {
    const middlewareWithConfig = mwExpiry(mockLogger, '/', mockSessionExpiryController, {
      name: 'test-session-name',
      cookiePath: 'test-cookie-path',
      cookieSameSite: true,
      secure: true,
    });
    mockRequest.casaSessionExpired = 'trigger';
    middlewareWithConfig(mockRequest, mockResponse, stubNext);
    expect(mockResponse.clearCookie).to.be.calledOnceWithExactly('test-session-name', {
      path: 'test-cookie-path',
      sameSite: true,
      httpOnly: true,
      secure: true,
      maxAge: null,
    });
  });

  it('should redirect to session-timeout url', (done) => {
    const middlewareWithConfig = mwExpiry(mockLogger, '/test-mount/', mockSessionExpiryController);
    mockRequest.casaSessionExpired = 'trigger';
    middlewareWithConfig(mockRequest, mockResponse, stubNext);
    process.nextTick(() => {
      expect(mockResponse.status).to.be.calledOnceWithExactly(302);
      expect(mockResponse.redirect).to.be.calledOnceWithExactly('/test-mount/session-timeout#');
      done();
    });
  });

  it('should not redirect to session-timeout url when custom controller calls next()', (done) => {
    mockSessionExpiryController = (req, res, next) => next();
    const middlewareWithConfig = mwExpiry(mockLogger, '/test-mount/', mockSessionExpiryController);
    mockRequest.casaSessionExpired = 'trigger';
    middlewareWithConfig(mockRequest, mockResponse, stubNext);
    process.nextTick(() => {
      expect(mockResponse.status).to.not.be.called;
      expect(mockResponse.redirect).to.not.be.called;
      done();
    });
  });

  it('should not redirect to session-timeout url when custom controller calls res.send()', (done) => {
    mockSessionExpiryController = (req, res, next) => res.send('Do not redirect');
    const middlewareWithConfig = mwExpiry(mockLogger, '/test-mount/', mockSessionExpiryController);
    mockRequest.casaSessionExpired = 'trigger';
    middlewareWithConfig(mockRequest, mockResponse, stubNext);
    process.nextTick(() => {
      expect(mockResponse.status).to.not.be.called;
      expect(mockResponse.redirect).to.not.be.called;
      done();
    });
  });

  it('should redirect to custom session-timeout url when custom controller redirects', (done) => {
    mockSessionExpiryController = (req, res, next) => res.status(302).redirect('/custom-session-timeout');
    const middlewareWithConfig = mwExpiry(mockLogger, '/test-mount/', mockSessionExpiryController);
    mockRequest.casaSessionExpired = 'trigger';
    middlewareWithConfig(mockRequest, mockResponse, stubNext);
    process.nextTick(() => {
      expect(mockResponse.status).to.be.calledOnceWithExactly(302);
      expect(mockResponse.redirect).to.be.calledOnceWithExactly('/custom-session-timeout');
      done();
    });
  });

  it('should redirect to session-timeout url and append original url as query string', (done) => {
    const middlewareWithConfig = mwExpiry(mockLogger, '/test-mount/', mockSessionExpiryController);
    mockRequest.casaSessionExpired = 'trigger';
    mockRequest.originalUrl = '/test-url?with=some&query[bits]=true';
    middlewareWithConfig(mockRequest, mockResponse, stubNext);
    process.nextTick(() => {
      expect(mockResponse.status).to.be.calledOnceWithExactly(302);
      expect(mockResponse.redirect).to.be.calledOnceWithExactly('/test-mount/session-timeout?referer=%2Ftest-url%3Fwith%3Dsome%26query%5Bbits%5D%3Dtrue#');
      done();
    });
  });

  it('should redirect again to session-timeout url and append original url (minus existing referer) as query string', (done) => {
    const middlewareWithConfig = mwExpiry(mockLogger, '/test-mount/', mockSessionExpiryController);
    mockRequest.casaSessionExpired = 'trigger';
    mockRequest.originalUrl = '/session-timeout?referer=%2Fsession-timeout';
    middlewareWithConfig(mockRequest, mockResponse, stubNext);
    process.nextTick(() => {
      expect(mockResponse.status).to.be.calledOnceWithExactly(302);
      expect(mockResponse.redirect).to.be.calledOnceWithExactly('/test-mount/session-timeout?referer=%2Fsession-timeout#');
      done();
    });
  });
});
