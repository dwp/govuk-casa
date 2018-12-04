const { expect } = require('chai');
const httpMocks = require('node-mocks-http');
const { EventEmitter } = require('events');

const routes = require('../../../app/routes/session-timeout');

describe('Routes: session-timeout', () => {
  const mockApp = {
    get: () => {},
  };

  it('should render the timeout page, with a sessionTtl variable', (done) => {
    const r = routes(mockApp, 3600);

    const req = httpMocks.createRequest();

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });
    res.on('end', () => {
      expect(res._getStatusCode()).to.equal(200);
      expect(res._getRenderView()).to.equal('casa/session-timeout.njk');
      expect(res._getRenderData()).to.have.property('sessionTtl', 3600 / 60);
      done();
    });

    r.rtSessionTimeout(req, res, () => {
      done(new Error('Should not call next handler'));
    });
  });
});
