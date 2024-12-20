import { stub } from 'sinon';
import sinonChai from 'sinon-chai';
import { use as chaiUse, expect } from 'chai';
import ExpressJS from 'express';
import request from 'supertest';

import stripProxyPath from '../../src/middleware/strip-proxy-path.js';

chaiUse(sinonChai);

describe('strip-proxy-path middleware', () => {
  it('passes through to next middleware', (done) => {
    const app = ExpressJS();
    app.use(stripProxyPath({}));
    app.use((req, res) => {
      res.status(200).send('passthrough');
    });

    request(app)
      .get('/')
      .expect((res) => expect(res.text).to.equal('passthrough'))
      .end(done)
  });

  it('strips everything before mountUrl from baseUrl and originalUrl', () => {
    // Can't use supertest here due to the middleware's use of `req.app.handle()`;
    // it will generate a separate request, but supertest will only handle the
    // first. So we test the middleware directly, checking that `app.handle()`
    // is called once.
    const [middleware] = stripProxyPath({
      mountUrl: '/mount/',
    });
    const req = {
      originalUrl: '/proxy/path/mount/waypoint',
      baseUrl: '/proxy/path/mount',
      app: {
        // Calls same middleware again to mimic the behaviour of `app.handle()`,
        // which effectively starts handling the request from the top of the
        // middleware stack
        handle: stub().callsFake((req2, res2, next2) => middleware(req2, res2, next2)),
      },
    };
    const res = {};
    const next = stub();

    middleware(req, res, next);

    expect(req.app.handle).to.be.calledOnceWithExactly(req, res, next);
    expect(next).to.be.calledOnce;
    expect(req.baseUrl).to.equal('/mount');
    expect(req.originalUrl).to.equal('/mount/waypoint');
  });
});
