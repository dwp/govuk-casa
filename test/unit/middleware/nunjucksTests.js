const npath = require('path');
const { expect } = require('chai');
const httpMocks = require('node-mocks-http');
const { EventEmitter } = require('events');
const domain = require('domain');

const middleware = require('../../../app/middleware/nunjucks.js');

describe('Middleware: nunjucks', () => {
  const mockExpressApp = {
    use: () => {},
    get: k => (k === 'view engine' ? 'html' : undefined),
    set: () => {},
  };
  const viewDirs = [
    npath.resolve(__dirname, '../testdata/views'),
  ];
  const govukTemplatePath = '../testdata/views/layouts/template.njk';

  it('should throw an exception when the govuk template path does not point to the template file', () => {
    expect(() => {
      middleware(mockExpressApp, viewDirs, 'invalid-path')
    }).to.throw(TypeError, 'template.njk');
  });

  it('should store the nunjucks environment on the response object', (done) => {
    const mi = middleware(mockExpressApp, null, govukTemplatePath);

    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();

    mi.handleEnvironmentInit(req, res, () => {
      /* eslint-disable-next-line no-unused-expressions */
      expect(res.nunjucksEnvironment).to.not.be.undefined;
      done();
    });
  });

  it('should render a view using a custom callback', (done) => {
    const mi = middleware(mockExpressApp, viewDirs, govukTemplatePath);

    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();

    mi.handleEnvironmentInit(req, res, () => {
      expect(res.render).to.exist; /* eslint-disable-line no-unused-expressions */
      res.render('hello-world.njk', {}, (err, data) => {
        expect(err).to.be.null; /* eslint-disable-line no-unused-expressions */
        expect(data).to.have.string('Hello, World');
        done();
      });
    });
  });

  it('should render a view using a default callback', (done) => {
    const mi = middleware(mockExpressApp, viewDirs, govukTemplatePath);

    const req = httpMocks.createRequest();

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });
    res.on('end', () => {
      expect(res._getData()).to.have.string('Hello, World');
      done();
    });

    mi.handleEnvironmentInit(req, res, () => {
      res.render('hello-world.njk');
    });
  });

  it('should throw an exception if view template does not exist', (done) => {
    // As the thrown exception is nestled deep within the async call stack, we
    // wrap its execution in a Domain in order to capture exceptions at any
    // point within this domain's lifetime. Once complete, it's important to
    // exit the Domain otherwise subsequent exceptions in this test suite will
    // be caught within this Domain's error handler.
    const d = domain.create(); /* eslint-disable-line node/no-deprecated-api */
    d.on('error', (err) => {
      try {
        expect(err.message).to.have.string('template not found');
        d.exit();
        done();
      } catch (e) {
        d.exit();
        done(e);
      }
    });

    d.run(() => {
      const mi = middleware(mockExpressApp, viewDirs, govukTemplatePath);

      const req = httpMocks.createRequest();

      const res = httpMocks.createResponse();

      mi.handleEnvironmentInit(req, res, () => {
        res.render('invalid-template');
      });
    });
  });
});
