const { expect } = require('chai');
const crypto = require('crypto');
const moment = require('moment');
const httpMocks = require('node-mocks-http');
const helpers = require('../templates/helpers');

const middleware = require('../../../app/middleware/headers.js');

describe('Middleware: headers', () => {
  const stdMiddleware = middleware({
    use: () => {},
    set: () => {},
  });

  /**
   * Convert all of an object's own keys into lowercase.
   *
   * @param {Object} headers Object to parse
   * @return {Object} Matching obejct with lowercased keys
   */
  function lowercaseKeys(headers = {}) {
    const lowercase = {};
    Object.keys(headers).forEach((k) => {
      Object.defineProperty(
        lowercase,
        k.toLowerCase(),
        Object.getOwnPropertyDescriptor(headers, k),
      );
    });
    return lowercase;
  }

  it('should disable etags', (done) => {
    middleware({
      set: (k, v) => {
        expect(k).to.equal('etag');
        expect(v).to.be.false; /* eslint-disable-line no-unused-expressions */
        done();
      },
      use: () => {},
    });
  });

  it('should remove the X-Powered-By header', (done) => {
    const req = httpMocks.createRequest();

    const res = httpMocks.createResponse();

    stdMiddleware.handleHeaders(req, res, () => {
      expect(Object.keys(res._getHeaders()).indexOf('X-Powered-By')).to.equal(-1);
      done();
    });
  });

  it('should include the basic security headers', (done) => {
    const req = httpMocks.createRequest();

    const res = httpMocks.createResponse();

    stdMiddleware.handleHeaders(req, res, () => {
      const headers = lowercaseKeys(res._getHeaders());
      expect(headers).to.have.property('x-content-type-options');
      expect(headers).to.have.property('x-xss-protection');
      expect(headers).to.have.property('x-frame-options');
      done();
    });
  });

  it('should set x-xss-protection header to "1; mode=block"', (done) => {
    const req = httpMocks.createRequest();

    const res = httpMocks.createResponse();

    stdMiddleware.handleHeaders(req, res, () => {
      const headers = lowercaseKeys(res._getHeaders());
      expect(headers['x-xss-protection']).to.equal('1; mode=block');
      done();
    });
  });

  it('should set x-xss-protection header to "0" if user-agent is IE 8', (done) => {
    const req = httpMocks.createRequest({
      headers: {
        'user-agent': 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0)',
      },
    });

    const res = httpMocks.createResponse();

    stdMiddleware.handleHeaders(req, res, () => {
      const headers = lowercaseKeys(res._getHeaders());
      expect(headers['x-xss-protection']).to.equal('0');
      done();
    });
  });

  it('should set correct cache headers for non-graphic assets', (done) => {
    const req = httpMocks.createRequest({
      url: '/page.html',
    });

    const res = httpMocks.createResponse();

    stdMiddleware.handleHeaders(req, res, () => {
      const headers = lowercaseKeys(res._getHeaders());
      expect(headers).to.have.property('cache-control');
      expect(headers['cache-control']).to.equal('no-cache, no-store, must-revalidate, private');
      expect(headers).to.have.property('pragma');
      expect(headers.pragma).to.equal('no-cache');
      expect(headers).to.have.property('expires');
      expect(headers.expires).to.equal(0);
      done();
    });
  });

  it('should set correct cache headers for graphic assets', (done) => {
    const req = httpMocks.createRequest({
      url: '/graphic.jpg',
    });

    const res = httpMocks.createResponse();

    stdMiddleware.handleHeaders(req, res, () => {
      const headers = lowercaseKeys(res._getHeaders());
      expect(headers).to.have.property('cache-control');
      expect(headers['cache-control']).to.equal('public');
      expect(headers).to.have.property('pragma');
      expect(headers.pragma).to.equal('cache');
      expect(headers).to.have.property('expires');
      const mExpires = moment(headers.expires);
      /* eslint-disable-next-line no-unused-expressions */
      expect(mExpires.isAfter(moment.utc())).to.be.true;
      done();
    });
  });

  it('should convert CSP scriptSources to \'script-src\'', () => {
    const mi = middleware({
      set: () => {},
      use: () => {},
    }, {
      scriptSources: [
        'custom-script-source',
      ],
    });

    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();

    mi.handleHeaders(req, res, () => {
      const headers = lowercaseKeys(res._getHeaders());

      expect(headers).to.have.property('content-security-policy');
      const csp = headers['content-security-policy'];
      expect(csp).to.contain('custom-script-source');
    });
  });

  it('should include standard content to CSP script-src', () => {
    const mi = middleware(
      {
        set: () => {},
        use: () => {},
      },
      {
        'script-src': [
          'custom-script-src',
        ],
      },
    );

    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();

    mi.handleHeaders(req, res, () => {
      const headers = lowercaseKeys(res._getHeaders());

      expect(headers).to.have.property('content-security-policy');
      const csp = headers['content-security-policy'];
      expect(csp).to.contain('custom-script-src');
      expect(csp).to.have.string("script-src 'self'");
      expect(csp).to.have.string("'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU='");
      expect(csp).to.have.string('https://www.google-analytics.com/');
      expect(csp).to.have.string('https://www.googletagmanager.com/');
    });
  });

  it('should have standard CSP if not defined', () => {
    const mi = middleware({
      set: () => {},
      use: () => {},
    }, null);

    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();

    mi.handleHeaders(req, res, () => {
      const headers = lowercaseKeys(res._getHeaders());

      expect(headers).to.have.property('content-security-policy');
      const csp = headers['content-security-policy'];
      expect(csp).to.have.string("script-src 'self'");
      expect(csp).to.have.string("'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU='");
      expect(csp).to.have.string('https://www.google-analytics.com/');
      expect(csp).to.have.string('https://www.googletagmanager.com/');
    });
  });

  it('should add standard script-src to CSP if no script-src defined', () => {
    const mi = middleware({
      set: () => {},
      use: () => {},
    }, {
      'img-src': [
        'image-src',
      ],
    });

    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();

    mi.handleHeaders(req, res, () => {
      const headers = lowercaseKeys(res._getHeaders());

      expect(headers).to.have.property('content-security-policy');
      const csp = headers['content-security-policy'];
      expect(csp).to.have.string('script-src');
      expect(csp).to.have.string("script-src 'self'");
      expect(csp).to.have.string("'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU='");
      expect(csp).to.have.string('https://www.google-analytics.com/');
      expect(csp).to.have.string('https://www.googletagmanager.com/');
    });
  });

  it('should add script-src hashes for all inline javascript in the GOV.UK template', () => {
    const mi = middleware({
      set: () => {},
      use: () => {},
    }, null);

    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();

    const govukTemplatePath = require.resolve('govuk-frontend/template.njk');
    const $ = helpers.renderTemplateFile(govukTemplatePath, {});

    const scriptHashes = [];

    $('script').each((i, elem) => {
      const inlineJs = $(elem).html();

      if (inlineJs) {
        const hash = crypto.createHash('sha256').update(inlineJs, 'utf-8').digest('base64');
        scriptHashes[i] = `'sha256-${hash}'`;
      }
    });

    mi.handleHeaders(req, res, () => {
      const headers = lowercaseKeys(res._getHeaders());

      expect(headers).to.have.property('content-security-policy');
      const csp = headers['content-security-policy'];
      scriptHashes.forEach((hash) => expect(csp).to.have.string(hash));
    });
  });

  it('should set specified Content-Security-Policy if defined', (done) => {
    const mi = middleware({
      set: () => {},
      use: () => {},
    }, {
      'img-src': [
        'custom-img-src',
      ],
      'script-src': [
        'custom-script-src',
      ],
      'style-src': [
        'custom-style-src',
      ],
    });

    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();

    mi.handleHeaders(req, res, () => {
      const headers = lowercaseKeys(res._getHeaders());
      expect(headers).to.have.property('content-security-policy');

      const csp = headers['content-security-policy'];
      expect(csp).to.have.string('img-src');
      expect(csp).to.have.string('script-src');
      expect(csp).to.have.string('style-src');

      expect(csp).to.have.string('custom-img-src');
      expect(csp).to.have.string('custom-script-src');
      expect(csp).to.have.string('custom-style-src');
      done();
    });
  });

  it('should disable any specific headers', (done) => {
    const mi = middleware(
      {
        set: () => {},
        use: () => {},
      },
      null, [
        'Cache-Control',
        'X-Frame-Options',
      ],
    );

    const req = httpMocks.createRequest();

    const res = httpMocks.createResponse();

    mi.handleHeaders(req, res, () => {
      const headers = lowercaseKeys(res._getHeaders());
      expect(headers).to.not.have.property('cache-control');
      expect(headers).to.not.have.property('x-frame-options');
      done();
    });
  });
});
