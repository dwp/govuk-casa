const { expect } = require('chai');
const httpMocks = require('node-mocks-http');

const middleware = require('../../../app/middleware/variables.js');

describe('Middleware: variables', () => {
  it('should add all variables to "locals" namespace on the response', (done) => {
    const mi = middleware(
      {
        use: () => {},
        get: s => (s === 'casaGovukFrontendVirtualUrl' ? 'test-prefix' : undefined),
      },
      '/testMountUrl',
      'TestPhase',
      'Test Service Name',
    );

    const req = httpMocks.createRequest();
    req.i18nTranslator = {
      t: s => (`${s}-TRANSLATED`),
    };
    const res = httpMocks.createResponse();
    res.locals = {};

    mi.handleVariablesSet(req, res, () => {
      expect(res.locals.govuk.assetPath).to.equal('test-prefix/assets');
      expect(res.locals.govuk.components.header.assetsPath).to.equal('test-prefix/assets/images');
      expect(res.locals.govuk.components.header.serviceName).to.equal('Test Service Name-TRANSLATED');
      expect(res.locals.govuk.components.header.serviceUrl).to.equal('/testMountUrl');
      expect(res.locals.govuk.components.header.homepageUrl).to.equal('https://www.gov.uk/');
      expect(res.locals.casaMountUrl).to.equal('/testMountUrl');
      expect(res.locals.phase).to.equal('TestPhase');
      done();
    });
  });
});
