const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const proxyquire = require('proxyquire');

const { expect } = chai;
chai.use(sinonChai);

const { request, response } = require('../../helpers/express-mocks.js');

const mwSeed = require('../../../../middleware/session/seed.js');

const JourneyData = require('../../../../lib/JourneyData.js');

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

  it('should create a req.journeyData JourneyData property', () => {
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockRequest).to.have.property('journeyData').that.is.instanceOf(JourneyData);
  });

  it('should call next function in middleware chain', () => {
    middleware(mockRequest, mockResponse, stubNext);
    expect(stubNext).to.be.calledOnceWithExactly();
  });

  describe('should create JourneyData instance with data held in session', () => {
    let stubJourneyData;

    beforeEach(() => {
      stubJourneyData = sinon.stub();
      const proxyMwSeed = proxyquire.noPreserveCache()('../../../../middleware/session/seed.js', {
        '../../lib/JourneyData.js': stubJourneyData,
      });
      middleware = proxyMwSeed();
    });

    it('set journey data', () => {
      mockRequest.session.journeyData = {
        test: 'data',
      };
      middleware(mockRequest, mockResponse, stubNext);
      expect(stubJourneyData).to.be.calledOnceWith(sinon.match({
        test: 'data',
      }), {});
    });

    it('set journey validation errors', () => {
      mockRequest.session.journeyValidationErrors = {
        test: 'data',
      };
      middleware(mockRequest, mockResponse, stubNext);
      expect(stubJourneyData).to.be.calledOnceWith({}, sinon.match({
        test: 'data',
      }));
    });
  });
});
