const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const proxyquire = require('proxyquire');

const { expect } = chai;
chai.use(sinonChai);

const logger = require('../../helpers/logger-mock.js');
const { request, response } = require('../../helpers/express-mocks.js');

const mwSeed = require('../../../../middleware/session/seed.js');

const { DEFAULT_CONTEXT_ID } = require('../../../../lib/enums.js');

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
    middleware = mwSeed(logger())[1];
  });

  it('should create a req.casa.journeyContext JourneyContext property', () => {
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockRequest.casa).to.have.property('journeyContext').that.is.instanceOf(JourneyContext);
  });

  it('should call next function in middleware chain', () => {
    middleware(mockRequest, mockResponse, stubNext);
    expect(stubNext).to.be.calledOnceWithExactly();
  });

  it('should initialise the journey context session', () => {
    const initContextStoreSpy = sinon.spy(JourneyContext, 'initContextStore');
    middleware(mockRequest, mockResponse, stubNext);
    expect(initContextStoreSpy).to.be.calledOnceWithExactly(mockRequest.session);
    initContextStoreSpy.restore();
  });

  it('should fallback to the default context if the requested ID is invalid', () => {
    mockRequest = request({
      query: { contextid: 'invalid' },
    });
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockRequest.casa).to.have.property('journeyContext').that.is.an.instanceof(JourneyContext);
    expect(mockRequest.casa.journeyContext.identity.id).to.equal(DEFAULT_CONTEXT_ID);
  });

  it('should fallback to the default context if the requested one cannot be found', () => {
    mockRequest = request({
      query: { contextid: '00000000-0000-0000-0000-000000000000' },
    });
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockRequest.casa).to.have.property('journeyContext').that.is.an.instanceof(JourneyContext);
    expect(mockRequest.casa.journeyContext.identity.id).to.equal(DEFAULT_CONTEXT_ID);
  });
});
