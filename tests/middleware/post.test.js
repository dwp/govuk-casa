import { expect } from 'chai';
import ExpressJS from 'express';
import request from 'supertest';

import postMiddleware from '../../src/middleware/post.js';

const makeErroringApp = (thrownError) => {
  const app = ExpressJS();

  app.use((req, res, next) => {
    res.render = (tpl, vars = {}) => {
      const errorSuffix = vars.errorCode ? ` ${vars.errorCode}` : '';
      res.send(`${tpl}${errorSuffix}`);
    };
    next();
  });

  if (thrownError instanceof Error) {
    app.use(() => {
      throw thrownError;
    });
  }

  return app;
}

describe('post middleware', () => {
  it('renders a 500 page for generic errors', (done) => {
    const app = makeErroringApp(new Error());
    app.use(postMiddleware());

    request(app)
      .get('/')
      .expect((res) => expect(res.text).to.equal('casa/errors/static.njk'))
      .expect(200, done);
  });

  it('renders a 404 page for an unknown URL', (done) => {
    const app = makeErroringApp();
    app.use(postMiddleware());

    request(app)
      .get('/')
      .expect((res) => expect(res.text).to.equal('casa/errors/404.njk'))
      .expect(404, done);
  });

  it('renders a 403 page for a bad CSRF token', (done) => {
    const err = new Error();
    err.code = 'EBADCSRFTOKEN';
    const app = makeErroringApp(err);
    app.use(postMiddleware());

    request(app)
      .get('/')
      .expect((res) => expect(res.text).to.equal('casa/errors/static.njk bad_csrf_token'))
      .expect(403, done);
  });

  it('renders a 403 page for an unverified payload', (done) => {
    const err = new Error();
    err.type = 'entity.verify.failed';
    const app = makeErroringApp(err);
    app.use(postMiddleware());

    request(app)
      .get('/')
      .expect((res) => expect(res.text).to.equal('casa/errors/static.njk invalid_payload'))
      .expect(403, done);
  });

  it('renders a 413 page when too many parameters are sent', (done) => {
    const err = new Error();
    err.type = 'parameters.too.many';
    const app = makeErroringApp(err);
    app.use(postMiddleware());

    request(app)
      .get('/')
      .expect((res) => expect(res.text).to.equal('casa/errors/static.njk parameter_limit_exceeded'))
      .expect(413, done);
  });

  it('renders a 413 page when payload is too large', (done) => {
    const err = new Error();
    err.type = 'entity.too.large';
    const app = makeErroringApp(err);
    app.use(postMiddleware());

    request(app)
      .get('/')
      .expect((res) => expect(res.text).to.equal('casa/errors/static.njk payload_size_exceeded'))
      .expect(413, done);
  });

  it('renders a 400 page when an unexpected method is used', (done) => {
    const err = new Error();
    err.code = 'unaccepted_request_method';
    const app = makeErroringApp(err);
    app.use(postMiddleware());

    request(app)
      .get('/')
      .expect((res) => expect(res.text).to.equal('casa/errors/static.njk unaccepted_request_method'))
      .expect(400, done);
  });
});
