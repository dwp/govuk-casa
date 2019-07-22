const proxyquire = require('proxyquire');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');

const { expect } = chai;
chai.use(sinonChai);
chai.use(chaiAsPromised);

const { request, response } = require('../../helpers/express-mocks.js');
const { data: journeyContext, map: journeyMap } = require('../../helpers/journey-mocks.js');
const logger = require('../../helpers/logger-mock.js');

describe('Middleware: page/gather', () => {
  let mwGather;
  let mockLogger;
  let mockRequest;
  let mockResponse;
  let stubNext;
  let stubExecuteHook;
  let stubExtractSessionableData;
  let stubRunGatherModifiers;

  beforeEach(() => {
    mockLogger = logger();
    stubExecuteHook = sinon.stub().resolves();
    stubExtractSessionableData = sinon.stub();
    stubRunGatherModifiers = sinon.stub();

    mwGather = proxyquire('../../../../middleware/page/gather.js', {
      '../../lib/Logger': sinon.stub().returns(mockLogger),
      './utils.js': {
        executeHook: stubExecuteHook,
        extractSessionableData: stubExtractSessionableData,
        runGatherModifiers: stubRunGatherModifiers,
      },
    });

    mockRequest = request();
    mockRequest.casa = { plan: journeyMap(), journeyContext: journeyContext() };
    mockResponse = response();
    stubNext = sinon.stub();
  });

  it('should return an array of functions', () => {
    const middleware = mwGather();
    expect(middleware).to.be.an('Array').with.length(2);
    expect(middleware[0]).to.be.a('Function');
    expect(middleware[1]).to.be.a('Function');
  });

  it('should create req.casaRequestState holding traversal state', () => {
    const middleware = mwGather()[1];
    mockRequest.casa.journeyOrigin = { originId: '', waypoint: 'test-id' };
    mockRequest.casa.plan.traverse.returns([1, 2, 3]);
    mockRequest.casa.journeyContext.getData.returns('test-data');
    mockRequest.casa.journeyContext.getValidationErrors.returns('test-errors');
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockRequest.casa.plan.traverse).to.be.calledOnceWithExactly({
      data: 'test-data',
      validation: 'test-errors',
    }, {
      startWaypoint: 'test-id',
    });
    expect(mockRequest).to.have.property('casaRequestState').that.eql({
      preGatherTraversalSnapshot: [1, 2, 3],
    });
    expect(mockLogger.trace).to.be.calledWithExactly('Take pre-gather traversal snapshot');
  });

  it('should execute the "pregather" hook', () => {
    const middleware = mwGather()[1];
    mockRequest.casa.journeyOrigin = { originId: '', waypoint: '' };
    middleware(mockRequest, mockResponse, stubNext);
    expect(stubExecuteHook).to.be.calledOnceWithExactly(
      mockLogger,
      mockRequest,
      mockResponse,
      {},
      'pregather',
    );
  });

  it('should pass errors to next middleware if "pregather" hook fails', async () => {
    const middleware = mwGather()[1];
    const error = new Error('test-error');
    stubExecuteHook.rejects(error);
    mockRequest.casa.journeyOrigin = { originId: '', waypoint: '' };
    await middleware(mockRequest, mockResponse, stubNext);
    expect(stubNext).to.be.calledOnceWithExactly(error);
  });

  it('should run gather-modifiers on data and merge modified data back to req.body', async () => {
    const middleware = mwGather({
      id: 'test-id',
      fieldGatherModifiers: {
        testField: 'test-modifier',
      },
    })[1];
    mockRequest.body = {
      testField: 'data-0',
      more: 'data-1',
    };
    mockRequest.casa.journeyOrigin = { originId: '', waypoint: '' };
    stubExtractSessionableData.returns(mockRequest.body);
    stubRunGatherModifiers.withArgs('data-0', 'test-modifier').returns('data-0-modified');
    await middleware(mockRequest, mockResponse, stubNext);
    expect(mockRequest.body).to.eql({
      testField: 'data-0-modified',
      more: 'data-1',
    });
  });

  it('should only save saveable data', async () => {
    const middleware = mwGather({
      id: 'test-id',
    })[1];
    mockRequest.body = {
      test: 'data',
      more: 'data',
    };
    mockRequest.casa.journeyOrigin = { originId: '', waypoint: '' };
    stubExtractSessionableData.returns({
      data: 'test-item',
    });
    await middleware(mockRequest, mockResponse, stubNext);
    expect(mockRequest.casa.journeyContext.setDataForPage).to.be.calledOnceWithExactly('test-id', sinon.match({
      data: 'test-item',
    }));
  });
});
