const proxyquire = require('proxyquire');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const sinon = require('sinon');

const { expect } = chai;
chai.use(sinonChai);

const logger = require('../../helpers/logger-mock.js');
const { request, response } = require('../../helpers/express-mocks.js');
const { data: journeyData } = require('../../helpers/journey-mocks.js');
const { processor } = require('../../helpers/validation-mocks.js');

describe('Middleware: page/validate', () => {
  let mwRender;
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

    mwRender = proxyquire('../../../../middleware/page/validate.js', {
      '../../lib/Logger.js': sinon.stub().returns(mockLogger),
      '../../lib/Validation.js': {
        processor: stubValidationProcessor,
      },
      './utils.js': {
        executeHook: stubExecuteHook,
      },
    });

    mockRequest = request();
    mockRequest.journeyData = journeyData();
    mockResponse = response();
    stubNext = sinon.stub().callsFake(err => (err ? console.log(err) : null));
  });

  it('should execute the "prevalidate" hook', async () => {
    const middleware = mwRender();
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
    const middleware = mwRender();
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
    const middleware = mwRender();
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
    const middleware = mwRender({
      id: 'test-id',
      fieldValidators: 'test-validators',
    });
    mockRequest.journeyData.getDataForPage.returns('test-journey-data');
    await middleware(mockRequest, mockResponse, stubNext);
    expect(stubValidationProcessor).to.be.calledWithExactly('test-validators', 'test-journey-data', {
      reduceErrors: true,
    });
  });

  it('should clear validation errors from journeyData on successful validation', async () => {
    const middleware = mwRender({
      id: 'test-id',
    });
    await middleware(mockRequest, mockResponse, stubNext);
    expect(mockRequest.journeyData.clearValidationErrorsForPage).to.be.calledOnceWithExactly(
      'test-id',
    );
    expect(mockRequest.session.journeyValidationErrors).to.eql({});
  });

  it('should pass system errors through to next middleware', async () => {
    const middleware = mwRender();
    const testError = new Error('test-error');
    stubExecuteHook.rejects(testError);
    await middleware(mockRequest, mockResponse, stubNext);
    expect(stubNext).to.be.calledOnceWithExactly(testError);
  });

  it('should store validation errors on journeyData on failed validation', async () => {
    const middleware = mwRender({
      id: 'test-id',
    });
    const testErrors = {
      field0: [],
    };
    stubExecuteHook.rejects(testErrors);
    await middleware(mockRequest, mockResponse, stubNext);
    expect(mockRequest.journeyData.setValidationErrorsForPage).to.be.calledWithExactly(
      'test-id',
      testErrors,
    );
  });
});
