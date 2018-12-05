const { expect } = require('chai');
const httpMocks = require('node-mocks-http');
const { EventEmitter } = require('events');

const middleware = require('../../../app/middleware/mount.js');

describe('Middleware: mount', () => {
  const mockExpressApp = {
    all: () => {},
  };

  it('should not mount the redirector function if mountUrl is /', () => {
    const mi = middleware({
      all: () => {
        throw new Error('Mounting should not be called');
      },
    }, '/');
    return expect(mi.redirectToMountUrl).to.be.undefined;
  });

  it('should mount the redirector function if mountUrl is not /', () => {
    const mi = middleware(mockExpressApp, '/test-mount-url');
    expect(mi.redirectToMountUrl).to.be.a('function');
  });

  it('should redirect requests to / when a mount url is specified', (done) => {
    const mi = middleware(mockExpressApp, '/mount-url');

    const req = httpMocks.createRequest({
      url: '/',
    });

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });
    res.on('end', () => {
      expect(res._getStatusCode()).to.equal(302);
      expect(res._getRedirectUrl()).to.equal('/mount-url');
      done();
    });

    mi.redirectToMountUrl(req, res);
  });
});
