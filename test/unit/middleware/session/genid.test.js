const chai = require('chai');
const sinonChai = require('sinon-chai');

const { expect } = chai;
chai.use(sinonChai);

const { request } = require('../../helpers/express-mocks.js');
const logger = require('../../helpers/logger-mock.js');

const mwGenid = require('../../../../middleware/session/genid.js');

describe('Middleware: session/expiry', () => {
  let mockLogger;
  let mockRequest;
  let genid;

  beforeEach(() => {
    mockLogger = logger();
    mockRequest = request();
    genid = mwGenid(mockLogger);
  });

  it('should generate a 256bit, base64-encoded identifier', () => {
    const sessionId = genid(mockRequest);
    expect(sessionId).to.be.a('string');

    const decoded = Buffer.from(sessionId, 'base64');
    expect(decoded.length).to.equal(256 / 8);
  });

  it('should set req.casaSessionExpired when encountering a missing session', () => {
    mockRequest.sessionID = 'test-session';
    delete mockRequest.session;
    genid(mockRequest);
    expect(mockRequest.casaSessionExpired).to.be.a('string').and.equals('test-session');
  });

  it('should create a debug log when encountering a missing session', () => {
    mockRequest.sessionID = 'test-session';
    delete mockRequest.session;
    genid(mockRequest);
    expect(mockLogger.debug).to.be.calledOnceWithExactly(
      'Server session %s has expired. Flagging for destruction.',
      'test-session',
    );
  });

  it('should not set req.casaSessionExpired when encountering an empty session', () => {
    delete mockRequest.session;
    genid(mockRequest);
    expect(mockRequest.casaSessionExpired).to.be.undefined;
    expect(mockLogger.debug).to.not.be.called;

    mockRequest.session = {};
    mockRequest.sessionID = undefined;
    genid(mockRequest);
    expect(mockRequest.casaSessionExpired).to.be.undefined;
    expect(mockLogger.debug).to.not.be.called;
  });
});
