const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const proxyquire = require('proxyquire');

const { expect } = chai;
chai.use(sinonChai);

const logger = require('../../helpers/logger-mock.js');

describe('Middleware: session/init', () => {
  let mockLogger;

  const stubExpressSession = sinon.stub();

  const mwInit = proxyquire('../../../../middleware/session/init.js', {
    'express-session': stubExpressSession,
  });

  beforeEach(() => {
    mockLogger = logger();
  });

  afterEach(() => {
    stubExpressSession.resetHistory();
  });

  it('should configure the session correctly', () => {
    mwInit(mockLogger, {
      store: 'test-store',
      secret: 'test-secret',
      secure: 'test-secure',
      cookiePath: 'test-cookie-path',
      name: 'test-name',
    });
    expect(stubExpressSession).to.be.calledOnceWith(sinon.match({
      store: 'test-store',
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: 'test-secure',
        httpOnly: true,
        path: 'test-cookie-path',
        maxAge: null,
      },
      name: 'test-name',
      unset: 'destroy',
      genid: sinon.match.func,
    }));
  });
});
