const chai = require('chai');
const httpMocks = require('node-mocks-http');
const I18n = require('../../../lib/I18n');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const { expect } = chai;
chai.use(sinonChai);

const middleware = require('../../../app/middleware/i18n.js');

describe('Middleware: i18n', () => {
  const mockExpressApp = {
    use: () => {},
    set: () => {}
  };

  it('should throw an exception if no locales are provided', () => {
    expect(() => middleware(mockExpressApp, [])).to.throw(TypeError, 'supported locale');
    expect(() => middleware(mockExpressApp, {})).to.throw(TypeError, 'supported locale');
  });

  it('should throw an exception if no I18n utility is provided', () => {
    expect(() => middleware(mockExpressApp, [ 'en' ])).to.throw(TypeError, 'I18n utility');
    expect(() => middleware(mockExpressApp, [ 'en' ], {})).to.throw(TypeError, 'invalid type');
  });

  it('should initialise correctly with valid parameters', () => {
    const I18nUtility = I18n([], [ 'en' ]);
    expect(() => middleware(mockExpressApp, [ 'en' ], I18nUtility)).to.not.throw();
  });

  describe('store the language specified in the query parameter when it is a supported language', () => {
    it('should store on the request object when there is no session', (done) => {
      const req = httpMocks.createRequest({
        query: {
          lang: 'en'
        }
      });

      const res = httpMocks.createResponse();

      const I18nUtility = I18n([ '../tesdata/locales' ], [ 'en' ]);
      const mi = middleware(mockExpressApp, [ 'en', 'es' ], I18nUtility);

      mi.handleRequestInit(req, res, () => {
        expect(req.language).to.equal('en');
        expect(req.session).to.be.undefined; /* eslint-disable-line no-unused-expressions */
        done();
      });
    });

    it('should store on the request and session objects when a session is present', (done) => {
      const req = httpMocks.createRequest({
        query: {
          lang: 'en'
        },
        session: {
          save: cb => cb()
        }
      });

      const res = httpMocks.createResponse();

      const I18nUtility = I18n([ '../tesdata/locales' ], [ 'en' ]);
      const mi = middleware(mockExpressApp, [ 'en', 'es' ], I18nUtility);

      mi.handleRequestInit(req, res, () => {
        expect(req.language).to.equal('en');
        expect(req.session.language).to.equal('en');
        done();
      });
    });
  });

  describe('default to the first supported language when an unsupported language is specified in query parameter', () => {
    it('should store on the request object when there is no session', (done) => {
      const req = httpMocks.createRequest({
        query: {
          lang: 'UNSUPPORTED'
        }
      });

      const res = httpMocks.createResponse();

      const I18nUtility = I18n([ '../tesdata/locales' ], [ 'en' ]);
      const mi = middleware(mockExpressApp, [ 'xx', 'yy' ], I18nUtility);

      mi.handleRequestInit(req, res, () => {
        expect(req.language).to.equal('xx');
        expect(req.session).to.be.undefined; /* eslint-disable-line no-unused-expressions */
        done();
      });
    });

    it('should store on the request and session objects when a session is present', (done) => {
      const req = httpMocks.createRequest({
        query: {
          lang: 'UNSUPPORTED'
        },
        session: {
          save: cb => cb()
        }
      });

      const res = httpMocks.createResponse();

      const I18nUtility = I18n([ '../tesdata/locales' ], [ 'en' ]);
      const mi = middleware(mockExpressApp, [ 'xx', 'yy' ], I18nUtility);

      mi.handleRequestInit(req, res, () => {
        expect(req.language).to.equal('xx');
        expect(req.session.language).to.equal('xx');
        done();
      });
    });
  });

  describe('store the language from the session into the request when no query parameter is set', () => {
    it('should store the session language when it is present', (done) => {
      const req = httpMocks.createRequest({
        session: {
          language: 'stored-lang',
          save: cb => cb()
        }
      });

      const res = httpMocks.createResponse();

      const I18nUtility = I18n([ '../tesdata/locales' ], [ 'en' ]);
      const mi = middleware(mockExpressApp, [ 'stored-lang' ], I18nUtility);

      mi.handleRequestInit(req, res, () => {
        expect(req.language).to.equal('stored-lang');
        expect(req.session.language).to.equal('stored-lang');
        done();
      });
    });

    it('should store the default language when there is no language already stored in the session', (done) => {
      const req = httpMocks.createRequest({
        session: {
          language: undefined,
          save: cb => cb()
        }
      });

      const res = httpMocks.createResponse();

      const I18nUtility = I18n([ '../tesdata/locales' ], [ 'en' ]);
      const mi = middleware(mockExpressApp, [ 'default0', 'es' ], I18nUtility);

      mi.handleRequestInit(req, res, () => {
        expect(req.language).to.equal('default0');
        expect(req.session.language).to.equal('default0');
        done();
      });
    });
  });

  it('should continue the request lifecycle even if session save fails', (done) => {
    const req = httpMocks.createRequest({
      session: {
        save: cb => cb(new Error('FAKE ERROR'))
      }
    });

    const res = httpMocks.createResponse();

    const I18nUtility = I18n([ '../tesdata/locales' ], [ 'en' ]);
    const mi = middleware(mockExpressApp, [ 'default0', 'es' ], I18nUtility);

    mi.handleRequestInit(req, res, () => {
      done();
    });
  });

  it('should not save the session if the language has not change during a request', () => {
    const spySave = sinon.spy();
    const req = httpMocks.createRequest({
      query: {
        lang: 'en'
      },
      session: {
        language: 'en',
        save: spySave
      }
    });

    const res = httpMocks.createResponse();

    const I18nUtility = I18n([ '../tesdata/locales' ], [ 'en' ]);
    const mi = middleware(mockExpressApp, [ 'en' ], I18nUtility);

    mi.handleRequestInit(req, res, () => {});
    expect(spySave).to.not.have.been.called; /* eslint-disable-line no-unused-expressions */
  });

  it('should save the session if the language has changed during a request', () => {
    const spySave = sinon.spy();
    const req = httpMocks.createRequest({
      query: {
        lang: 'de'
      },
      session: {
        language: 'en',
        save: spySave
      }
    });

    const res = httpMocks.createResponse();

    const I18nUtility = I18n([ '../tesdata/locales' ], [ 'en', 'de' ]);
    const mi = middleware(mockExpressApp, [ 'en', 'de' ], I18nUtility);

    mi.handleRequestInit(req, res, () => {});
    expect(spySave).to.have.been.called; /* eslint-disable-line no-unused-expressions */
  });

  it('should add the t() function to the Nunjucks environment', (done) => {
    const req = httpMocks.createRequest();
    req.i18nTranslator = {
      t: () => {}
    };

    const res = httpMocks.createResponse();
    res.nunjucksEnvironment = {
      addGlobal: (fname, func) => {
        res.__testOutput = {
          fname,
          func
        };
      }
    };

    const I18nUtility = I18n([ '../tesdata/locales' ], [ 'en' ]);
    const mi = middleware(mockExpressApp, [ 'en' ], I18nUtility);

    mi.handleNunjucksSeeding(req, res, () => {
      expect(res.__testOutput).to.have.property('fname');
      expect(res.__testOutput.fname).to.equal('t');
      expect(res.__testOutput).to.have.property('func');
      expect(res.__testOutput.func).to.be.a('function');
      done();
    });
  });
});
