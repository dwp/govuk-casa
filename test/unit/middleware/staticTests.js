const npath = require('path');
const { expect } = require('chai');
const httpMocks = require('node-mocks-http');
const os = require('os');
const fs = require('fs-extra');

const middleware = require('../../../app/middleware/static.js');

describe('Middleware: static', () => {
  const mockExpressApp = {
    use: () => {},
    set: () => {},
  };
  /**
   * Mock static NOOP function.
   *
   * @return {void}
   */
  const mockExpressStatic = () => {};
  let compiledAssetsDir;

  const mountUrl = '/';
  const npmGovukTemplateJinja = npath.resolve(__dirname, '../testdata/fake-node_modules/govuk_template_ninja');
  const npmGovukFrontendToolkit = npath.resolve(__dirname, '../testdata/fake-node_modules/govuk_frontend_toolkit');
  const npmGovukElementsSass = npath.resolve(__dirname, '../testdata/fake-node_modules/govuk-elements-sass');
  const npmGovukFrontend = npath.resolve(__dirname, '../testdata/fake-node_modules/govuk-frontend');
  const npmGovukCasa = npath.resolve(__dirname, '../testdata/fake-node_modules/govuk-casa')

  const npmPackages = {
    govukTemplateJinja: npmGovukTemplateJinja,
    govukFrontendToolkit: npmGovukFrontendToolkit,
    govukElementsSass: npmGovukElementsSass,
    govukFrontend: npmGovukFrontend,
    govukCasa: npmGovukCasa,
  };

  beforeEach((done) => {
    compiledAssetsDir = npath.join(os.tmpdir(), `t${Math.round(Math.random() * 9999999)}`);
    fs.mkdir(compiledAssetsDir, done);
  });

  afterEach((done) => {
    fs.remove(compiledAssetsDir, done);
  });

  it('should throw an exception if the CASA CSS src directory is invalid', () => {
    expect(() => {
      middleware(
        mockExpressApp,
        mockExpressStatic,
        mountUrl,
        compiledAssetsDir,
        { ...npmPackages, govukCasa: npath.join(os.tmpdir(), `non-existent-path-${Math.round(Math.random() * 9999999)}`) },
      );
    }).to.throw(Error, 'ENOENT');
  });

  it('should set "casaGovukFrontendVirtualUrl" global on express app', (done) => {
    middleware(
      {
        use: () => {},
        set: (k, v) => {
          expect(k).to.equal('casaGovukFrontendVirtualUrl');
          expect(v).to.equal(`${mountUrl}govuk/frontend`);
          done();
        },
      },
      mockExpressStatic,
      mountUrl,
      compiledAssetsDir,
      npmPackages,
    );
  });

  it('should mount handlers for CASA assets and the GOVUK template and toolkit assets', () => {
    let counter = 0;
    middleware(
      {
        use: (mount, handler) => {
          if ([
            `${mountUrl}govuk/frontend/js/all.js`,
            `${mountUrl}govuk/frontend/assets`,
            `${mountUrl}govuk/frontend/js/govuk-template.js`,
            `${mountUrl}govuk/casa`,
          ].indexOf(mount) > -1) {
            counter += 1;
            expect(handler).to.equal('STATIC-ADDED');
          }
        },
        set: () => {},
      },
      () => 'STATIC-ADDED',
      mountUrl,
      compiledAssetsDir,
      npmPackages,
    );

    expect(counter).to.equal(4);
  });

  it('should throw an Exception if the compiled static dir does not exist', () => {
    expect(() => {
      middleware(
        mockExpressApp,
        mockExpressStatic,
        mountUrl,
        '/path/to/a/non/existent/directory',
        npmPackages,
      );
    }).to.throw(ReferenceError, 'Compiled static assets directory does not exist');
  });

  it('should generate compiled static assets in the static directory', () => {
    middleware(
      mockExpressApp,
      mockExpressStatic,
      mountUrl,
      compiledAssetsDir,
      npmPackages,
    );

    expect(() => {
      fs.accessSync(`${compiledAssetsDir}/casa/css/casa.css`, fs.R_OK);
    }).to.not.throw();
    expect(() => {
      fs.accessSync(`${compiledAssetsDir}/casa/js/casa.js`, fs.R_OK);
    }).to.not.throw();
  });

  it('should add package versions to "res.locals" for toolkit, frontend and CASA', (done) => {
    const mi = middleware(
      mockExpressApp,
      mockExpressStatic,
      mountUrl,
      compiledAssetsDir,
      npmPackages,
    );

    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    res.locals = {};

    mi.handlePackageVersionInit(req, res, () => {
      expect(res.locals.casaPackageVersions).to.be.an('object');
      /* eslint-disable no-unused-expressions */
      expect(res.locals.casaPackageVersions.govukFrontend).to.not.be.undefined;
      expect(res.locals.casaPackageVersions.govukTemplateJinja).to.not.be.undefined;
      expect(res.locals.casaPackageVersions.casaMain).to.not.be.undefined;
      /* eslint-enable no-unused-expressions */
      done();
    });
  });
});
