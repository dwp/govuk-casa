const proxyquire = require('proxyquire');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const sinon = require('sinon');

const { expect } = chai;
chai.use(sinonChai);

const logger = require('../../helpers/logger-mock.js');
const { request, response } = require('../../helpers/express-mocks.js');
const { data: journeyContext } = require('../../helpers/journey-mocks.js');
const { processor } = require('../../helpers/validation-mocks.js');
const JourneyContext = require('../../../../lib/JourneyContext.js');
const ValidationError = require('../../../../lib/validation/ValidationError.js');

describe('Middleware: page/validate', () => {
  let mwValidate;
  let stubExecuteHook;
  let stubValidationProcessor;

  let mockLogger;
  let mockRequest;
  let mockResponse;
  let stubNext;

  beforeEach(() => {
    mockLogger = logger();
    stubExecuteHook = sinon.stub().resolves();
    stubValidationProcessor = processor();

    mwValidate = proxyquire('../../../../middleware/page/validate.js', {
      '../../lib/Logger.js': sinon.stub().returns(mockLogger),
      '../../lib/validation/index.js': {
        processor: stubValidationProcessor,
      },
      './utils.js': {
        executeHook: stubExecuteHook,
      },
    });

    mockRequest = request();
    mockRequest.casa = {
      journeyContext: journeyContext(),
    };
    mockResponse = response();
    stubNext = sinon.stub().callsFake((err) => (err ? console.log(err) : null));
  });

  it('should execute the "prevalidate" hook', async () => {
    const middleware = mwValidate();
    mockRequest.casa.journeyContext = new JourneyContext({});
    mockRequest.casa.journeyContext.identity.id = '123e4567-e89b-12d3-a456-426614174000';
    await middleware(mockRequest, mockResponse, stubNext);
    expect(stubExecuteHook).to.be.calledWithExactly(
      mockLogger,
      mockRequest,
      mockResponse,
      {},
      'prevalidate',
    );
  });

  it('should execute the "postvalidate" hook when there are no validation errors', async () => {
    const middleware = mwValidate();
    mockRequest.casa.journeyContext = new JourneyContext({});
    mockRequest.casa.journeyContext.identity.id = '123e4567-e89b-12d3-a456-426614174000';
    await middleware(mockRequest, mockResponse, stubNext);
    expect(stubExecuteHook).to.be.calledWithExactly(
      mockLogger,
      mockRequest,
      mockResponse,
      {},
      'postvalidate',
    );
  });

  it('should not execute the "postvalidate" hook when there are validation errors', async () => {
    const middleware = mwValidate();
    stubExecuteHook.rejects(new Error(''));
    await middleware(mockRequest, mockResponse, stubNext);
    expect(stubExecuteHook).to.not.be.calledWithExactly(
      mockLogger,
      mockRequest,
      mockResponse,
      {},
      'postvalidate',
    );
  });

  it('should pass validators and page data to the validation processor, and reduce errors', async () => {
    const pageMeta = {
      id: 'test-id',
      fieldValidators: 'test-validators',
    };
    const middleware = mwValidate(pageMeta);
    mockRequest.casa.journeyContext = new JourneyContext({});
    mockRequest.casa.journeyContext.identity.id = '123e4567-e89b-12d3-a456-426614174000';
    mockRequest.casa.journeyContext.getDataForPage = sinon.stub().returns('test-journey-data');
    await middleware(mockRequest, mockResponse, stubNext);
    expect(stubValidationProcessor).to.be.calledWithExactly({
      waypointId: 'test-id',
      pageMeta,
      journeyContext: mockRequest.casa.journeyContext,
      reduceErrors: true,
    });
  });

  it('should clear validation errors from journeyContext on successful validation', async () => {
    const middleware = mwValidate({
      id: 'test-waypoint-id',
    });
    mockRequest.casa.journeyContext = new JourneyContext({}, {
      'test-waypoint-id': {
        'test-field': [ValidationError.make({ errorMsg: 'test-error' })],
      },
    });
    mockRequest.casa.journeyContext.identity.id = '123e4567-e89b-12d3-a456-426614174000';
    mockRequest.session.journeyContext = mockRequest.casa.journeyContext.toObject();
    const spy = sinon.spy(mockRequest.casa.journeyContext, 'clearValidationErrorsForPage');

    await middleware(mockRequest, mockResponse, stubNext);
    expect(spy).to.be.calledOnceWithExactly('test-waypoint-id');

    expect(mockRequest.casa.journeyContext.validation).to.deep.equal({
      'test-waypoint-id': null,
    });
  });

  it('should pass system errors through to next middleware', async () => {
    const middleware = mwValidate();
    const testError = new Error('test-error');
    stubExecuteHook.rejects(testError);
    await middleware(mockRequest, mockResponse, stubNext);
    expect(stubNext).to.be.calledOnceWithExactly(testError);
  });

  it('should store validation errors on journeyContext on failed validation', async () => {
    const middleware = mwValidate({
      id: 'test-id',
    });
    const testErrors = {
      field0: [],
    };
    stubExecuteHook.rejects(testErrors);
    mockRequest.casa.journeyContext = new JourneyContext();
    mockRequest.casa.journeyContext.identity.id = '123e4567-e89b-12d3-a456-426614174000';
    mockRequest.casa.journeyContext.setValidationErrorsForPage = sinon.stub();
    await middleware(mockRequest, mockResponse, stubNext);
    expect(mockRequest.casa.journeyContext.setValidationErrorsForPage).to.be.calledWithExactly(
      'test-id',
      testErrors,
    );
  });
});
