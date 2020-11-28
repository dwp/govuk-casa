/* eslint-disable object-curly-newline */
const proxyquire = require('proxyquire');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');

const { expect } = chai;
chai.use(sinonChai);
chai.use(chaiAsPromised);

const { DEFAULT_CONTEXT_ID } = require('../../../../lib/enums.js');
const { request, response } = require('../../helpers/express-mocks.js');
const { plan: journeyPlan } = require('../../helpers/journey-mocks.js');
const logger = require('../../helpers/logger-mock.js');

describe('Middleware: page/journey-continue', () => {
  let mockLogger;
  let middleware;
  let mockRequest;
  let mockResponse;
  let stubNext;
  const stubUtils = {
    executeHook: sinon.stub().resolves(),
  };

  const mwJourney = proxyquire('../../../../middleware/page/journey-continue.js', {
    './utils.js': stubUtils,
    '../../lib/Logger.js': sinon.stub().callsFake(() => (mockLogger)),
  });

  beforeEach(() => {
    mockLogger = logger();
    middleware = mwJourney();
    mockRequest = request();
    mockRequest = Object.assign(mockRequest, {
      casa: {
        plan: journeyPlan(),
        journeyOrigin: { originId: '', waypoint: '' },
        journeyContext: {
          getData: sinon.stub().returns({}),
          getValidationErrors: sinon.stub().returns({}),
          hasValidationErrorsForPage: sinon.stub().returns(false),
          isDefault: sinon.stub().returns(true),
          identity: { id: DEFAULT_CONTEXT_ID },
        },
      },
    });
    mockResponse = response();
    stubNext = sinon.stub();
  });

  afterEach(() => {
    stubUtils.executeHook.resetHistory().resolves();
  });

  it('should call the next middleware in chain and return void when requested page has validation errors', () => {
    mockRequest.casa.journeyContext.hasValidationErrorsForPage.returns(true);
    middleware = mwJourney({
      id: 'test-waypoint',
    });
    const result = middleware(mockRequest, mockResponse, stubNext);
    expect(stubNext).to.be.calledOnceWithExactly();
    expect(mockLogger.trace).to.be.calledOnceWithExactly(
      'Page %s has errors, not progressing journey. Passthrough to next middleware',
      'test-waypoint',
    );
    return expect(result).to.be.undefined;
  });

  it('should execute the preredirect hook', async () => {
    await middleware(mockRequest, mockResponse, stubNext);
    expect(stubUtils.executeHook).to.have.been.calledOnceWithExactly(
      mockLogger,
      mockRequest,
      mockResponse,
      {},
      'preredirect',
    );
  });

  it('should save the session', async () => {
    await middleware(mockRequest, mockResponse, stubNext);
    expect(mockRequest.session.save).to.be.calledOnceWithExactly(sinon.match.func);
  });

  it('should return a 500 response if an error occurs during session save');

  it('should pass errors to next middleware if "preredirect" hook fails', async () => {
    const error = new Error('test-error');
    stubUtils.executeHook.rejects(error);
    await middleware(mockRequest, mockResponse, stubNext);
    expect(stubNext).to.be.calledOnceWithExactly(error);
  });

  describe('in edit mode (non-sticky mode)', () => {
    it('should return to the edit origin url if the traversal is unaltered', async () => {
      const middlewareWithConfig = mwJourney({
        page0: {},
        page1: {},
        page3: {},
      }, '/test-mount/');
      mockRequest = Object.assign(mockRequest, {
        inEditMode: true,
        editOriginUrl: '/test-edit-origin/',
      });
      await middlewareWithConfig(mockRequest, mockResponse, stubNext);
      expect(mockResponse.status).to.be.calledOnceWithExactly(302);
      expect(mockResponse.redirect).to.be.calledOnceWithExactly('/test-edit-origin#');
    });

    it('should return to the first changed waypoint if the traversal is altered', async () => {
      const middlewareWithConfig = mwJourney({}, '/test-mount/');
      mockRequest = Object.assign(mockRequest, {
        inEditMode: true,
        editOriginUrl: '/test-edit-origin/',
      });
      mockRequest.casa.preGatherTraversalSnapshot = ['page0', 'page1', 'page2'];
      mockRequest.casa.plan.traverseNextRoutes.returns([{
        source: 'page0',
        target: 'change-a',
        name: 'next',
        label: { sourceOrigin: undefined, targetOrigin: undefined }
      }, {
        source: 'change-a',
        target: 'changeB',
        name: 'next',
        label: { sourceOrigin: undefined, targetOrigin: undefined }
      }, {
        source: 'changeB',
        target: null,
        name: 'next',
        label: { sourceOrigin: undefined, targetOrigin: undefined }
      }]);
      await middlewareWithConfig(mockRequest, mockResponse, stubNext);
      expect(mockResponse.status).to.be.calledOnceWithExactly(302);
      expect(mockResponse.redirect).to.be.calledOnceWithExactly('/test-mount/change-a#');
    });

    it('should return to the first matching waypoint if the traversal is shortened', async () => {
      const middlewareWithConfig = mwJourney({}, '/test-mount/');
      mockRequest = Object.assign(mockRequest, {
        inEditMode: true,
        editOriginUrl: '/test-edit-origin/',
      });
      mockRequest.casa.preGatherTraversalSnapshot = ['page0', 'page1', 'page2'];
      mockRequest.casa.plan.traverseNextRoutes.returns([{
        source: 'page0',
        target: 'page1',
        name: 'next',
        label: { sourceOrigin: undefined, targetOrigin: undefined }
      }, {
        source: 'page1',
        target: undefined,
        name: 'next',
        label: { sourceOrigin: undefined, targetOrigin: undefined }
      }]);
      await middlewareWithConfig(mockRequest, mockResponse, stubNext);
      expect(mockResponse.status).to.be.calledOnceWithExactly(302);
      expect(mockResponse.redirect).to.be.calledOnceWithExactly('/test-mount/page1#');
    });

    it('should return to the first changed waypoint if the traversal is altered, but not beyond the editorigin (adopt source origin)', async () => {
      // We are also testing that the origin ID is changed correctly if it
      // differs between the _current_ origin and the origin specified in editorigin
      const middlewareWithConfig = mwJourney({}, '/test-mount/');
      mockRequest = Object.assign(mockRequest, {
        inEditMode: true,
        editOriginUrl: '/test-mount/second-origin/page1',
      });
      mockRequest.casa.journeyOrigin.originId = 'first-origin';
      mockRequest.casa.preGatherTraversalSnapshot = ['page0', 'page1', 'page2', 'page3'];
      mockRequest.casa.plan.traverseNextRoutes.returns([{
        source: 'page0',
        target: 'page1',
        name: 'next',
        label: { sourceOrigin: undefined, targetOrigin: undefined }
      }, {
        source: 'page1',
        target: 'page2',
        name: 'next',
        label: { sourceOrigin: 'second-origin', targetOrigin: undefined }
      }, {
        source: 'page2',
        target: 'page3b',
        name: 'next',
        label: { sourceOrigin: undefined, targetOrigin: undefined }
      }, {
        source: 'page3b',
        target: null,
        name: 'next',
        label: { sourceOrigin: undefined, targetOrigin: undefined }
      }]);
      await middlewareWithConfig(mockRequest, mockResponse, stubNext);
      expect(mockResponse.status).to.be.calledOnceWithExactly(302);
      expect(mockResponse.redirect).to.be.calledOnceWithExactly('/test-mount/second-origin/page1#');
    });

    it('should return to the first changed waypoint if the traversal is altered, but not beyond the editorigin (adopt target origin)', async () => {
      // We are also testing that the origin ID is changed correctly if it
      // differs between the _current_ origin and the origin specified in editorigin
      const middlewareWithConfig = mwJourney({}, '/test-mount/');
      mockRequest = Object.assign(mockRequest, {
        inEditMode: true,
        editOriginUrl: '/test-mount/second-origin/page1',
      });
      mockRequest.casa.journeyOrigin.originId = 'first-origin';
      mockRequest.casa.preGatherTraversalSnapshot = ['page0', 'page1', 'page2', 'page3'];
      mockRequest.casa.plan.traverseNextRoutes.returns([{
        source: 'page0',
        target: 'page1',
        name: 'next',
        label: { sourceOrigin: undefined, targetOrigin: 'second-origin' }
      }, {
        source: 'page1',
        target: 'page2',
        name: 'next',
        label: { sourceOrigin: undefined, targetOrigin: undefined }
      }, {
        source: 'page2',
        target: 'page3b',
        name: 'next',
        label: { sourceOrigin: undefined, targetOrigin: undefined }
      }, {
        source: 'page3b',
        target: null,
        name: 'next',
        label: { sourceOrigin: undefined, targetOrigin: undefined }
      }]);
      await middlewareWithConfig(mockRequest, mockResponse, stubNext);
      expect(mockResponse.status).to.be.calledOnceWithExactly(302);
      expect(mockResponse.redirect).to.be.calledOnceWithExactly('/test-mount/second-origin/page1#');
    });

    it('should return to the first changed waypoint if the traversal is altered, but not beyond the editorigin (no origins)', async () => {
      // We are also testing that the origin ID is changed correctly if it
      // differs between the _current_ origin and the origin specified in editorigin
      const middlewareWithConfig = mwJourney({}, '/test-mount/');
      mockRequest = Object.assign(mockRequest, {
        inEditMode: true,
        editOriginUrl: '/test-mount/page1',
      });
      mockRequest.casa.preGatherTraversalSnapshot = ['page0', 'page1', 'page2', 'page3'];
      mockRequest.casa.plan.traverseNextRoutes.returns([{
        source: 'page0',
        target: 'page1',
        name: 'next',
        label: { sourceOrigin: undefined, targetOrigin: undefined }
      }, {
        source: 'page1',
        target: 'page2',
        name: 'next',
        label: { sourceOrigin: undefined, targetOrigin: undefined }
      }, {
        source: 'page2',
        target: 'page3b',
        name: 'next',
        label: { sourceOrigin: undefined, targetOrigin: undefined }
      }, {
        source: 'page3b',
        target: null,
        name: 'next',
        label: { sourceOrigin: undefined, targetOrigin: undefined }
      }]);
      await middlewareWithConfig(mockRequest, mockResponse, stubNext);
      expect(mockResponse.status).to.be.calledOnceWithExactly(302);
      expect(mockResponse.redirect).to.be.calledOnceWithExactly('/test-mount/page1#');
    });

    it('should return to the first changed waypoint if the traversal is altered, and include any changes to the origin', async () => {
      const middlewareWithConfig = mwJourney({}, '/test-mount/');
      mockRequest = Object.assign(mockRequest, {
        inEditMode: true,
        editOriginUrl: '/test-edit-origin/',
      });
      mockRequest.casa.preGatherTraversalSnapshot = ['page0', 'page1', 'page2'];
      mockRequest.casa.plan.traverseNextRoutes.returns([{
        source: 'page0',
        target: 'page1',
        name: 'next',
        label: { sourceOrigin: undefined, targetOrigin: undefined }
      }, {
        source: 'page1',
        target: 'change-a',
        name: 'next',
        label: { sourceOrigin: 'previous-origin', targetOrigin: 'changed-origin' }
      }, {
        source: 'change-a',
        target: null,
        name: 'next',
        label: { sourceOrigin: undefined, targetOrigin: undefined }
      }]);
      await middlewareWithConfig(mockRequest, mockResponse, stubNext);
      expect(mockResponse.status).to.be.calledOnceWithExactly(302);
      expect(mockResponse.redirect).to.be.calledOnceWithExactly('/test-mount/changed-origin/change-a#');
    });
  });

  describe('in edit mode (sticky mode)', () => {
    it('should return to the first changed waypoint if the traversal is altered', async () => {
      const middlewareWithConfig = mwJourney({}, '/test-mount/', true);
      mockRequest = Object.assign(mockRequest, {
        inEditMode: true,
        editOriginUrl: '/test-edit-origin/',
      });
      mockRequest.casa.preGatherTraversalSnapshot = ['page0', 'page1', 'page2'];
      mockRequest.casa.plan.traverseNextRoutes.returns([{
        source: 'page0',
        target: 'change-a',
        name: 'next',
        label: { sourceOrigin: undefined, targetOrigin: undefined }
      }, {
        source: 'change-a',
        target: 'change-b',
        name: 'next',
        label: { sourceOrigin: undefined, targetOrigin: undefined }
      }, {
        source: 'change-b',
        target: null,
        name: 'next',
        label: { sourceOrigin: undefined, targetOrigin: undefined }
      }]);
      await middlewareWithConfig(mockRequest, mockResponse, stubNext);
      expect(mockResponse.status).to.be.calledOnceWithExactly(302);
      expect(mockResponse.redirect).to.be.calledOnceWithExactly('/test-mount/change-a?edit=&editorigin=%2Ftest-edit-origin%2F#');
    });

    it('should return to the first matching waypoint if the traversal is shortened', async () => {
      const middlewareWithConfig = mwJourney({}, '/test-mount/', true);
      mockRequest = Object.assign(mockRequest, {
        inEditMode: true,
        editOriginUrl: '/test-edit-origin/',
      });
      mockRequest.casa.preGatherTraversalSnapshot = ['page0', 'page1', 'page2'];
      mockRequest.casa.plan.traverseNextRoutes.returns([{
        source: 'page0',
        target: 'page1',
        name: 'next',
        label: { sourceOrigin: undefined, targetOrigin: undefined }
      }, {
        source: 'page1',
        target: undefined,
        name: 'next',
        label: { sourceOrigin: undefined, targetOrigin: undefined }
      }]);
      await middlewareWithConfig(mockRequest, mockResponse, stubNext);
      expect(mockResponse.status).to.be.calledOnceWithExactly(302);
      expect(mockResponse.redirect).to.be.calledOnceWithExactly('/test-mount/page1?edit=&editorigin=%2Ftest-edit-origin%2F#');
    });

    it('should return to the first changed waypoint if the traversal is altered, and include any changes to the origin', async () => {
      const middlewareWithConfig = mwJourney({}, '/test-mount/', true);
      mockRequest = Object.assign(mockRequest, {
        inEditMode: true,
        editOriginUrl: '/test-edit-origin/',
      });
      mockRequest.casa.preGatherTraversalSnapshot = ['page0', 'page1', 'page2'];
      mockRequest.casa.plan.traverseNextRoutes.returns([{
        source: 'page0',
        target: 'page1',
        name: 'next',
        label: { sourceOrigin: undefined, targetOrigin: undefined }
      }, {
        source: 'page1',
        target: 'change-a',
        name: 'next',
        label: { sourceOrigin: 'previous-origin', targetOrigin: 'changed-origin' }
      }, {
        source: 'change-a',
        target: null,
        name: 'next',
        label: { sourceOrigin: undefined, targetOrigin: undefined }
      }]);
      await middlewareWithConfig(mockRequest, mockResponse, stubNext);
      expect(mockResponse.status).to.be.calledOnceWithExactly(302);
      expect(mockResponse.redirect).to.be.calledOnceWithExactly('/test-mount/changed-origin/change-a?edit=&editorigin=%2Ftest-edit-origin%2F#');
    });
  });

  describe('not in edit mode', () => {
    it('should return to original request url if journey does not contain the waypoint', async () => {
      const middlewareWithConfig = mwJourney({}, '/test-mount/');
      mockRequest = Object.assign(mockRequest, {
        inEditMode: false,
        originalUrl: '/test-original-url?test',
      });
      mockRequest.casa.plan.containsWaypoint.returns(false);
      await middlewareWithConfig(mockRequest, mockResponse, stubNext);
      expect(mockResponse.status).to.be.calledOnceWithExactly(302);
      expect(mockResponse.redirect).to.be.calledOnceWithExactly('/test-original-url?test#');
    });

    it('should go to next waypoint in the traversed journey, if there is one', async () => {
      const middlewareWithConfig = mwJourney({
        id: 'page1',
      }, '/test-mount/');
      mockRequest = Object.assign(mockRequest, {
        inEditMode: false,
      });
      mockRequest.casa.journeyOrigin = { originId: 'test-guid', waypoint: 'page0' };
      mockRequest.casa.plan.containsWaypoint.returns(true);
      mockRequest.casa.plan.traverseNextRoutes.returns([
        { source: 'page0', target: 'page1', name: 'next', label: { targetOrigin: undefined } },
        { source: 'page1', target: 'page2', name: 'next', label: { targetOrigin: undefined } },
        { source: 'page2', target: null, name: 'next', label: { targetOrigin: undefined } },
      ]);
      await middlewareWithConfig(mockRequest, mockResponse, stubNext);
      expect(mockResponse.status).to.be.calledOnceWithExactly(302);
      expect(mockResponse.redirect).to.be.calledOnceWithExactly('/test-mount/test-guid/page2#');
      expect(mockLogger.trace).to.be.calledWithExactly(
        'Check waypoint %s can be reached (journey guid = %s)',
        'page1',
        'test-guid',
      );
    });

    it('should stay on the same waypoint, if there are no more waypoints in the traversed journey', async () => {
      const middlewareWithConfig = mwJourney({
        id: 'page2',
      }, '/test-mount/');
      mockRequest = Object.assign(mockRequest, {
        inEditMode: false,
      });
      mockRequest.casa.journeyOrigin = { originId: '', waypoint: 'page0' };
      mockRequest.casa.plan.containsWaypoint.returns(true);
      mockRequest.casa.plan.traverseNextRoutes.returns([
        { source: 'page0', target: 'page1', name: 'next', label: { targetOrigin: undefined } },
        { source: 'page1', target: 'page2', name: 'next', label: { targetOrigin: undefined } },
        { source: 'page2', target: null, name: 'next', label: { targetOrigin: undefined } },
      ]);
      await middlewareWithConfig(mockRequest, mockResponse, stubNext);
      expect(mockLogger.trace).to.be.calledWithExactly(
        'Check waypoint %s can be reached (journey guid = %s)',
        'page2',
        '',
      );
      expect(mockResponse.status).to.be.calledOnceWithExactly(302);
      expect(mockResponse.redirect).to.be.calledOnceWithExactly('/test-mount/page2#');
    });
  });
});
