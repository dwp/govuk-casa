const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const { expect } = chai;
chai.use(sinonChai);

const { request, response } = require('../../helpers/express-mocks.js');

const mwSeed = require('../../../../middleware/session/seed.js');

const JourneyContext = require('../../../../lib/JourneyContext.js');

describe('Middleware: session/expiry', () => {
  let mockRequest;
  let mockResponse;
  let stubNext;
  let middleware;

  beforeEach(() => {
    mockRequest = request();
    mockResponse = response();
    stubNext = sinon.stub();
    middleware = mwSeed();
  });

  it('should create a req.casa.journeyContext JourneyContext property', () => {
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockRequest.casa).to.have.property('journeyContext').that.is.instanceOf(JourneyContext);
  });

  it('should call next function in middleware chain', () => {
    middleware(mockRequest, mockResponse, stubNext);
    expect(stubNext).to.be.calledOnceWithExactly();
  });

  describe('should create JourneyContext instance with data held in session', () => {
    let spyFromObject;

    beforeEach(() => {
      spyFromObject = sinon.spy(JourneyContext, 'fromObject');
    });

    afterEach(() => {
      spyFromObject.restore();
    });

    it('set journey data', () => {
      mockRequest.session.journeyContext = {
        data: {
          test: 'data',
        },
      };
      middleware(mockRequest, mockResponse, stubNext);
      expect(spyFromObject).to.be.calledOnceWith(sinon.match({
        data: {
          test: 'data',
        },
      }));
    });

    it('set journey validation errors', () => {
      mockRequest.session.journeyContext = {
        validation: {
          test: 'data',
        },
      };
      middleware(mockRequest, mockResponse, stubNext);
      expect(spyFromObject).to.be.calledOnceWith(sinon.match({
        validation: {
          test: 'data',
        },
      }));
    });
  });
});
