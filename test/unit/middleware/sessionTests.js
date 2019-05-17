const { expect } = require('chai');
const httpMocks = require('node-mocks-http');
const { EventEmitter } = require('events');
const querystring = require('querystring');
const moment = require('moment');
const JourneyData = require('../../../lib/JourneyData');

const middleware = require('../../../app/middleware/session.js');

describe('Middleware: session', () => {
  const mockApp = {
    use: () => {},
    set: () => {},
  };

  /**
   * Mock moddleware to inject fixed data into session.
   *
   * @returns {void}
   */
  const mockExpressSession = () => (req, res, next) => {
    req.session = 'SESSION_OBJ'
    next();
  };
  const mountUrl = '/';
  const sessionConfig = {
    secure: false,
    store: null,
    name: 'SESS_NAME',
    secret: 'SESS_SECRET',
    cookiePath: '/',
    ttl: 60,
  };

  describe('Initialising session', () => {
    it('should setup a new session object on the request', (done) => {
      const mi = middleware(
        mockApp,
        mockExpressSession,
        mountUrl,
        sessionConfig,
      );

      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();

      mi.mwSessionInit(req, res, () => {
        expect(req).to.have.property('session', 'SESSION_OBJ');
        done();
      });
    });

    it('should initialise create an HttpOnly cookie', () => {
      middleware(
        mockApp,
        (config) => {
          expect(config).to.have.property('cookie');
          expect(config.cookie).to.have.property('httpOnly', true);
        },
        mountUrl,
        sessionConfig,
      );
    });

    it('should generate a session id using a custom function', () => {
      middleware(
        mockApp,
        (config) => {
          expect(config).to.have.property('genid');
          expect(config.genid).to.be.a('function');
          const id = config.genid({});
          expect(id).to.be.a('string');
          expect(id.length).to.be.at.least(24);
        },
        mountUrl,
        sessionConfig,
      );
    });

    it('should set the destruction flag if the session has expired', () => {
      middleware(
        mockApp,
        (config) => {
          const req = {
            sessionID: 'validId',
            session: undefined,
          };
          config.genid(req);
          expect(req).to.have.property('casaSessionExpired', 'validId');
        },
        mountUrl,
        sessionConfig,
      );
    });
  });

  describe('Expiring session', () => {
    let mi;

    beforeEach(() => {
      mi = middleware(
        mockApp,
        mockExpressSession,
        mountUrl,
        sessionConfig,
      );
    });

    it('should let unexpired sessions through to next handler, and update expiry date', (done) => {
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();
      req.session = {};
      const now = new Date();
      const oldNow = moment.now;
      moment.now = () => now;
      mi.mwSessionExpiry(req, res, () => {
        expect(req.session).to.have.property('dateExpire');
        expect(req.session.dateExpire).to.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/i);
        const dateExpiry = moment(req.session.dateExpire);
        expect(dateExpiry.diff(now, 's')).to.equal(sessionConfig.ttl);
        moment.now = oldNow;
        done();
      });
    });

    it('should destroy the session and redirect user to timeout page if the destruction flag is set', (done) => {
      const req = httpMocks.createRequest();
      req.originalUrl = '/test/url-here?with=some+query%2Fdata'
      req.casaSessionExpired = 'EXPIRED_SESSION_ID';
      req.session = {
        destroy: (cb) => {
          cb();
        },
      }
      const res = httpMocks.createResponse({
        eventEmitter: EventEmitter,
      });
      res.on('end', () => {
        expect(res._getStatusCode()).to.equal(302);
        expect(res._getRedirectUrl()).to.equal(`${mountUrl}session-timeout?referer=%2Ftest%2Furl-here%3Fwith%3Dsome%2Bquery%252Fdata`);
        expect(querystring.parse(res._getRedirectUrl().replace(/^.+\?/, ''))).to.deep.equal({
          referer: req.originalUrl,
        });
        expect(req).to.not.have.property('casaSessionExpired');
        done();
      });

      mi.mwSessionExpiry(req, res, () => {
        done(new Error('Should not call next handler'));
      });
    });

    it('should destroy the session and redirect user to timeout page if the session has timed out', (done) => {
      const req = httpMocks.createRequest();
      req.session = {
        destroy: (cb) => {
          cb();
        },
        dateExpire: moment().subtract(10, 's').toISOString(),
      }
      const res = httpMocks.createResponse({
        eventEmitter: EventEmitter,
      });
      res.on('end', () => {
        expect(res._getStatusCode()).to.equal(302);
        expect(res._getRedirectUrl()).to.equal(`${mountUrl}session-timeout#`);
        done();
      });

      mi.mwSessionExpiry(req, res, () => {
        done(new Error('Should not call next handler'));
      });
    });

    it('should skip when now session has been set on the request', (done) => {
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();

      mi.mwSessionExpiry(req, res, () => {
        expect(req).to.not.have.property('session');
        expect(req).to.not.have.property('casaSessionExpired');
        done();
      });
    });

    it('should clear cookie, even if the session destruction fails', (done) => {
      const req = httpMocks.createRequest();
      req.casaSessionExpired = 'EXPIRED_SESSION_ID';
      req.session = {
        destroy: (cb) => {
          cb(new Error('Mock failed save'));
        },
      }
      const res = httpMocks.createResponse({
        eventEmitter: EventEmitter,
      });
      res.clearCookie = (name, options) => {
        expect(name).to.equal(sessionConfig.name);
        expect(options).to.have.property('httpOnly', true);
        expect(options).to.have.property('path', sessionConfig.cookiePath);
        expect(options).to.have.property('secure', sessionConfig.secure);
      };
      res.on('end', () => {
        expect(res._getStatusCode()).to.equal(302);
        expect(res._getRedirectUrl()).to.equal(`${mountUrl}session-timeout#`);
        done();
      });

      mi.mwSessionExpiry(req, res, () => {
        done(new Error('Should not call next handler'));
      });
    });
  });

  describe('Seed session', () => {
    let mi;

    beforeEach(() => {
      mi = middleware(
        mockApp,
        mockExpressSession,
        mountUrl,
        sessionConfig,
      );
    });

    it('should set an journeyData object on the request object when session is empty', () => {
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();

      mi.mwSessionSeed(req, res, () => {
        expect(req).to.have.property('journeyData');
        /* eslint-disable-next-line no-unused-expressions */
        expect(req.journeyData instanceof JourneyData).to.be.true;
        expect(req.journeyData.getData()).to.eql({});
      });
    });

    it('should set a journeyData object on the request object that matches the session data', () => {
      const req = httpMocks.createRequest();
      req.session = {
        journeyData: {
          x: 1,
        },
      };
      const res = httpMocks.createResponse();

      mi.mwSessionSeed(req, res, () => {
        expect(req).to.have.property('journeyData');
        /* eslint-disable-next-line no-unused-expressions */
        expect(req.journeyData instanceof JourneyData).to.be.true;
        expect(req.journeyData.getData()).to.eql({ x: 1 });
      });
    });
  });
});
