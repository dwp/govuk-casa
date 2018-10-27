const { expect } = require('chai');
const httpMocks = require('node-mocks-http');
const { EventEmitter } = require('events');

const middleware = require('../../../app/middleware/errors.js');

describe('Middleware: errors', () => {
  const errMiddleware = middleware({
    use: () => {}
  });

  describe('No other route can handle a valid request', () => {
    it('should set HTTP status to 404 and render the 404 error template', (done) => {
      const req = httpMocks.createRequest();

      const res = httpMocks.createResponse({
        eventEmitter: EventEmitter
      });
      res.on('end', () => {
        expect(res._getStatusCode()).to.equal(404);
        expect(res._getRenderView()).to.equal('casa/errors/404.njk');
        done();
      });

      errMiddleware.handle404(req, res);
    });
  });

  describe('A invalid CSRF token is provided', () => {
    it('should set HTTP status to 403 and render 403 error template', (done) => {
      const req = httpMocks.createRequest();

      const res = httpMocks.createResponse({
        eventEmitter: EventEmitter
      });
      res.on('end', () => {
        expect(res._getStatusCode()).to.equal(403);
        expect(res._getRenderView()).to.equal('casa/errors/403.njk');
        done();
      });

      errMiddleware.handleExceptions(
        {
          code: 'EBADCSRFTOKEN'
        },
        req,
        res
      );
    });
  });

  describe('Any other unknown error occurs', () => {
    it('should set HTTP status to 500 and render the 500 error template', (done) => {
      const req = httpMocks.createRequest();

      const res = httpMocks.createResponse({
        eventEmitter: EventEmitter
      });
      res.on('end', () => {
        expect(res._getStatusCode()).to.equal(500);
        expect(res._getRenderView()).to.equal('casa/errors/500.njk');
        done();
      });

      errMiddleware.handleExceptions({}, req, res);
    });
  });
});
