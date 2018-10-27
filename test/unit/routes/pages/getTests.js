const { expect } = require('chai');
const httpMocks = require('node-mocks-http');
const { EventEmitter } = require('events');
const PageDirectory = require('../../../../lib/PageDirectory');
const JourneyData = require('../../../../lib/JourneyData');

const createHandler = require('../../../../app/routes/pages/get');

describe('Routes: pages GET', () => {
  it('should throw an error if the page definitions are the wrong type', () => {
    expect(() => {
      createHandler([], false);
    }).to.throw(TypeError, 'Invalid type');
  });

  it('should render an inferred view where a specific view is not provided', (done) => {
    const handler = createHandler(new PageDirectory({
      page0: {
        view: 'page0'
      }
    }), false);

    const req = httpMocks.createRequest({
      url: '/page0',
      session: {
        id: 'sessionId'
      },
      journeyData: new JourneyData({})
    });

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter
    });
    res.on('end', () => {
      expect(res._getStatusCode()).to.equal(200);
      expect(res._getRenderView()).to.equal('page0');
      done();
    });

    handler(req, res);
  });

  it('should render an explicit view when specified', (done) => {
    const handler = createHandler(new PageDirectory({
      page0: {
        view: 'page0-custom-view'
      },
      page1: {
        view: 'page1'
      }
    }), false);

    const req = httpMocks.createRequest({
      url: '/page0',
      session: {
        id: 'sessionId'
      },
      journeyData: new JourneyData({})
    });

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter
    });
    res.on('end', () => {
      expect(res._getStatusCode()).to.equal(200);
      expect(res._getRenderView()).to.equal('page0-custom-view');
      done();
    });

    handler(req, res);
  });

  it('should include journey data in the view template', (done) => {
    const handler = createHandler(new PageDirectory({
      page0: {
        view: 'page0'
      }
    }), false);

    const req = httpMocks.createRequest({
      url: '/page0',
      session: {
        id: 'sessionId'
      },
      journeyData: new JourneyData({
        page0: {
          x: 1
        }
      })
    });

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter
    });
    res.on('end', () => {
      expect(res._getStatusCode()).to.equal(200);
      expect(res._getRenderData()).to.have.property('formData');
      expect(res._getRenderData().formData).to.eql({ x: 1 });
      done();
    });

    handler(req, res);
  });

  describe('Edit mode setting', () => {
    let handler;
    let req;
    let res;

    beforeEach(() => {
      handler = createHandler(new PageDirectory({
        page0: {
          view: 'page0'
        }
      }), false);

      req = httpMocks.createRequest({
        url: '/page0',
        session: {
          id: 'sessionId'
        },
        journeyData: new JourneyData({
          page0: {
            x: 1
          }
        })
      });

      res = httpMocks.createResponse({
        eventEmitter: EventEmitter
      });
    });

    it('should be false when not in query', (done) => {
      res.on('end', () => {
        expect(res._getRenderData()).to.have.property('inEditMode', false);
        done();
      });

      handler(req, res);
    });

    it('should be false when true in query, but global setting is disabled', (done) => {
      req.query.edit = true;

      res.on('end', () => {
        expect(res._getRenderData()).to.have.property('inEditMode', false);
        done();
      });

      handler(req, res);
    });

    it('should be true when in query, and global setting is enabled', (done) => {
      handler = createHandler(new PageDirectory({
        page0: {
          view: 'page0'
        }
      }), true);

      req.query.edit = true;

      res.on('end', () => {
        expect(res._getRenderData()).to.have.property('inEditMode', true);
        done();
      });

      handler(req, res);
    });
  });

  it('should execute prerender hook when present', (done) => {
    const handler = createHandler(new PageDirectory({
      page0: {
        view: 'page0',
        hooks: {
          prerender: (req, res, cb) => {
            req.HOOK_CALLED = true;
            cb();
          }
        }
      }
    }), false);

    const req = httpMocks.createRequest({
      url: '/page0',
      session: {
        id: 'sessionId'
      },
      journeyData: new JourneyData({
        page0: {
          x: 1
        }
      })
    });

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter
    });
    res.on('end', () => {
      expect(req).to.have.property('HOOK_CALLED');
      done();
    });

    handler(req, res);
  });
});
