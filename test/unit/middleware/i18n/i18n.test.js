const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const { expect } = chai;
chai.use(sinonChai);

const { request, response } = require('../../helpers/express-mocks.js');
const { translator } = require('../../helpers/i18n-mocks.js');
const logger = require('../../helpers/logger-mock.js');

const mwI18n = require('../../../../middleware/i18n/i18n.js');

describe('Middleware: i18n/i18n', () => {
  let mockLogger;
  let middleware;
  let mockRequest;
  let mockResponse;
  let stubNext;
  let stubTranslatorFactory;

  beforeEach(() => {
    mockLogger = logger();
    stubTranslatorFactory = sinon.stub().returns(translator());
    middleware = mwI18n(mockLogger, ['en', 'cy', 'de'], stubTranslatorFactory);
    mockRequest = request();
    mockResponse = response();
    stubNext = sinon.stub();
  });

  it('should use language specified in query when query and session are non-empty', () => {
    mockRequest.query.lang = 'de';
    mockRequest.session.language = 'cy';
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockRequest).to.have.property('language').and.equals('de');
  });

  it('should use language specified in session when query is empty and session is non-empty', () => {
    mockRequest.session.language = 'cy';
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockRequest).to.have.property('language').and.equals('cy');
  });

  it('should use default language when query and session are empty', () => {
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockRequest).to.have.property('language').and.equals('en');
  });

  it('should use default language when query and session have unsupported locales', () => {
    mockRequest.query.lang = 'xx';
    mockRequest.session.language = 'yy';
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockRequest).to.have.property('language').and.equals('en');
  });

  it('should create a translator instance on req.i18nTranslator', () => {
    middleware(mockRequest, mockResponse, stubNext);
    expect(stubTranslatorFactory).to.have.been.calledOnceWithExactly('en');
    expect(mockRequest).to.have.property('i18nTranslator').and.is.an('object');
  });

  it('should create a res.locals.t function bound to translator function', () => {
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockResponse.locals).to.have.property('t');
    // Bound functions do not have `prototype`
    return expect(Object.hasOwnProperty.call(mockResponse.locals.t, 'prototype')).to.be.false;
  });

  it('should create a res.locals.htmlLang variable set to req.language', () => {
    mockRequest.query.lang = 'de';
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockResponse.locals).to.have.property('htmlLang').and.equals(mockRequest.language).and.equals('de');
  });

  it('should not attempt to save language in session if the language has not changed and call next', () => {
    mockRequest.query.lang = 'cy';
    mockRequest.session.language = 'cy';
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockRequest.session.save).to.not.have.been.called; /* eslint-disable-line */
    expect(stubNext).to.have.been.calledOnceWithExactly();
  });

  it('should save language in session if the language has changed and call next if successful', () => {
    mockRequest.session.save = sinon.stub().callsFake(cb => cb());
    mockRequest.query.lang = 'cy';
    mockRequest.session.language = 'en';
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockRequest.session.save).to.have.been.calledOnce; /* eslint-disable-line */
    expect(stubNext).to.have.been.calledOnceWithExactly(undefined);
  });

  it('should call next with an error if session fails to save', () => {
    const error = new Error('TEST ERROR');
    mockRequest.session.save = sinon.stub().callsFake(cb => cb(error));
    mockRequest.query.lang = 'cy';
    mockRequest.session.language = 'en';
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockRequest.session.save).to.have.been.calledOnce; /* eslint-disable-line */
    expect(stubNext).to.have.been.calledOnceWithExactly(error);
  });
});
