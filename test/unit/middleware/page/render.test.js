const proxyquire = require('proxyquire');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const sinon = require('sinon');

const { expect } = chai;
chai.use(sinonChai);

const { request, response } = require('../../helpers/express-mocks.js');
const { data: journeyContext } = require('../../helpers/journey-mocks.js');
const logger = require('../../helpers/logger-mock.js');

describe('Middleware: page/render', () => {
  let mwRender;
  let stubExecuteHook;

  let mockLogger;
  let mockRequest;
  let mockResponse;
  let stubNext;

  beforeEach(() => {
    mockLogger = logger();
    stubExecuteHook = sinon.stub().resolves();

    mwRender = proxyquire('../../../../middleware/page/render.js', {
      '../../lib/Logger.js': sinon.stub().returns(mockLogger),
      './utils.js': {
        executeHook: stubExecuteHook,
      },
    });

    mockRequest = request();
    mockRequest.casa = { journeyContext: journeyContext() };
    mockResponse = response();
    stubNext = sinon.stub();
  });

  it('should execute the "prerender" hook', () => {
    const middleware = mwRender();
    middleware(mockRequest, mockResponse, stubNext);
    expect(stubExecuteHook).to.be.calledOnceWithExactly(
      mockLogger,
      mockRequest,
      mockResponse,
      {},
      'prerender',
    );
  });

  it('should pass errors to next middleware if "prerender" hook fails', async () => {
    const middleware = mwRender();
    const error = new Error('test-error');
    stubExecuteHook.rejects(error);
    await middleware(mockRequest, mockResponse, stubNext);
    expect(stubNext).to.be.calledOnceWithExactly(error);
  });

  describe('GET request', () => {
    it('should render the view', async () => {
      const middleware = mwRender({
        view: 'test-view.njk',
      });
      mockRequest = Object.assign(mockRequest, {
        method: 'GET',
        inEditMode: true,
        editOriginUrl: '/test-origin-url',
        editSearchParams: 'test=params',
      });
      mockRequest.casa.journeyContext.getDataForPage.returns('test-data');
      await middleware(mockRequest, mockResponse, stubNext);
      expect(mockResponse.render).to.be.calledOnceWithExactly('test-view.njk', {
        formData: 'test-data',
        inEditMode: true,
        editOriginUrl: '/test-origin-url',
        editSearchParams: 'test=params',
      }, sinon.match.func);
    });

    it('should pass template render errors to the next middleware', async () => {
      const testError = new Error('test-error');
      const middleware = mwRender();
      mockResponse.render = sinon.stub().callsFake((view, data, callback) => {
        callback(testError);
      });
      await middleware(mockRequest, mockResponse, stubNext);
      expect(mockLogger.error).to.be.calledOnceWithExactly(testError);
      expect(stubNext).to.be.calledOnceWithExactly(testError);
    });
  });

  describe('POST request', () => {
    let middleware;

    beforeEach(() => {
      middleware = mwRender({
        view: 'test-view.njk',
      });
      mockRequest = Object.assign(mockRequest, {
        method: 'POST',
        inEditMode: true,
        editOriginUrl: '/test-origin-url',
        editSearchParams: 'test=params',
        i18nTranslator: {
          t: sinon.stub().callsFake(s => (`${s}_translated`)),
        },
      });
      mockRequest.casa.journeyContext.getDataForPage.returns('test-data');
    });

    it('should render the view, reflecting the posted request body', async () => {
      mockRequest.body = 'test-post-body';
      await middleware(mockRequest, mockResponse, stubNext);
      expect(mockResponse.render).to.be.calledOnceWithExactly('test-view.njk', sinon.match({
        formData: 'test-post-body',
        inEditMode: true,
        editOriginUrl: '/test-origin-url',
        editSearchParams: 'test=params',
      }), sinon.match.func);
    });

    it('should render the view, including field validation errors', async () => {
      const validationErrors = {
        field0: [{
          summary: 'test-error-summary',
          fieldHref: 'test-field-href',
        }],
      };
      mockRequest.casa.journeyContext.getValidationErrorsForPage.returns(validationErrors);
      await middleware(mockRequest, mockResponse, stubNext);
      expect(mockResponse.render).to.be.calledOnceWithExactly('test-view.njk', sinon.match({
        formErrors: validationErrors,
      }), sinon.match.func);
    });

    it('should render the view, providing govuk format for field validation errors', async () => {
      const validationErrors = {
        field0: [{
          summary: 'test-error-summary',
          fieldHref: 'test-field-href',
        }],
      };
      mockRequest.casa.journeyContext.getValidationErrorsForPage.returns(validationErrors);
      await middleware(mockRequest, mockResponse, stubNext);
      expect(mockResponse.render).to.be.calledOnceWithExactly('test-view.njk', sinon.match({
        formErrorsGovukArray: [{
          text: 'test-error-summary_translated',
          href: 'test-field-href',
        }],
      }), sinon.match.func);
    });
  });
});
