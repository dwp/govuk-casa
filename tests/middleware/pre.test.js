import { expect } from 'chai';
import ExpressJS from 'express';
import request from 'supertest';

import preMiddleware from '../../src/middleware/pre.js';

describe('pre middleware', () => {
  it('generates an error for unaaccepted request methods', (done) => {
    const app = ExpressJS();
    app.use(preMiddleware());
    /* eslint-disable-next-line no-unused-vars */
    app.use((err, req, res, next) => {
      res.status(400).send(err.code);
    });

    request(app)
      .put('/')
      .expect((res) => expect(res.error.text).to.equal('unaccepted_request_method'))
      .expect(400, done);
  });

  it('sets caching headers', (done) => {
    const app = ExpressJS();
    app.use(preMiddleware());
    app.use((req, res) => res.status(200).send('ok'));

    request(app)
      .get('/')
      .expect((res) => expect(res.headers).to.have.property('cache-control').that.equals('no-cache, no-store, must-revalidate, private'))
      .expect((res) => expect(res.headers).to.have.property('pragma').that.equals('no-cache'))
      .expect((res) => expect(res.headers).to.have.property('expires').that.equals('0'))
      .expect((res) => expect(res.headers).to.have.property('x-robots-tag').that.equals('noindex, nofollow'))
      .expect(200, done);
  });

  it('provides a cspNonce template variable', (done) => {
    const app = ExpressJS();
    app.use(preMiddleware());
    app.use((req, res) => res.status(200).send(`nonce: ${res.locals.cspNonce}`));

    request(app)
      .get('/')
      .expect((res) => expect(res.text).to.match(/nonce: [a-f0-9]+$/))
      .expect(200, done);
  });

  it('generates a Content-Security-Policy header', (done) => {
    const app = ExpressJS();
    app.use(preMiddleware());
    app.use((req, res) => res.status(200).send('ok'));

    request(app)
      .get('/')
      .expect((res) => expect(res.headers).to.have.property('content-security-policy'))
      .expect(200, done);
  });

  it('allows customisation of the Content-Security-Policy header', (done) => {
    const app = ExpressJS();
    app.use(preMiddleware({
      helmetConfigurator: (config) => {
        config.contentSecurityPolicy.directives['default-src'].push('test-domain.test');
        return config;
      },
    }));
    app.use((req, res) => res.status(200).send('ok'));

    request(app)
      .get('/')
      .expect((res) => expect(res.headers).to.have.property('content-security-policy').that.matches(/test-domain.test/i))
      .expect(200, done);
  });
});
