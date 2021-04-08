const chai = require('chai');
const sinonChai = require('sinon-chai');
const crypto = require('crypto');

const { expect } = chai;
chai.use(sinonChai);

const { app } = require('../../helpers/express-mocks.js');
const { renderTemplateFile } = require('../../templates/helpers.js');

const middleware = require('../../../../middleware/headers/config-defaults.js');

describe('Middleware: headers/config-defaults', () => {
  const DEFAULT_CSP_SCRIPTS = "'self' 'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU=' https://www.google-analytics.com/ https://www.googletagmanager.com/";
  let mockApp;

  beforeEach(() => {
    mockApp = app();
  });

  it('should disable etag', () => {
    middleware(mockApp);
    expect(mockApp.set).to.have.been.calledWithExactly('etag', false);
  });

  it('should disable x-powered-by', () => {
    middleware(mockApp);
    expect(mockApp.set).to.have.been.calledWithExactly('x-powered-by', false);
  });

  it('should return an object with correct structure', () => {
    const output = middleware(mockApp);
    expect(output).to.have.property('defaultHeaders').and.is.an('Object');
    expect(output.defaultHeaders).to.have.property('Content-Security-Policy').and.is.a('String');
    expect(output.defaultHeaders).to.have.property('X-Content-Type-Options').and.is.a('String');
    expect(output.defaultHeaders).to.have.property('X-Frame-Options').and.is.a('String');
    expect(output.defaultHeaders).to.have.property('X-XSS-Protection').and.is.a('String');
    expect(output.defaultHeaders).to.have.property('X-Robots-Tag').and.is.a('String');
  });

  it('should return correct default headers when not applying customisation', () => {
    const { defaultHeaders } = middleware(mockApp);
    expect(defaultHeaders).to.eql({
      'Content-Security-Policy': `script-src ${DEFAULT_CSP_SCRIPTS}`,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'X-Robots-Tag': 'noindex, nofollow',
    });
  });

  it('should append default script-src CSP directives to a custom list', () => {
    const { defaultHeaders } = middleware(mockApp, {
      'script-src': ['test-src'],
    });
    expect(defaultHeaders).to.have.property('Content-Security-Policy').and.eql(`script-src test-src ${DEFAULT_CSP_SCRIPTS}`);
  });

  it('should prepend custom CSP directives to Content-Security-Policy header', () => {
    const { defaultHeaders } = middleware(mockApp, {
      'img-src': ['test-directive'],
    });
    expect(defaultHeaders).to.have.property('Content-Security-Policy').and.eql(`img-src test-directive; script-src ${DEFAULT_CSP_SCRIPTS}`);
  });

  it('should add script-src hashes for all inline javascript in the GOV.UK template', () => {
    const govukTemplatePath = require.resolve('govuk-frontend/govuk/template.njk');
    const $ = renderTemplateFile(govukTemplatePath, {});

    const scriptHashes = [];
    $('script:not([src])').each((i, elem) => {
      const hash = crypto.createHash('sha256').update($(elem).html(), 'utf-8').digest('base64');
      scriptHashes[i] = `'sha256-${hash}'`;
    });

    const { defaultHeaders } = middleware(mockApp);

    scriptHashes.forEach((hash) => {
      expect(defaultHeaders['Content-Security-Policy']).to.contain(hash);
    });
  });
});
