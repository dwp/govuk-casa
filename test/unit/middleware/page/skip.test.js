const chai = require('chai');
const sinonChai = require('sinon-chai');
const sinon = require('sinon');

const { expect } = chai;
chai.use(sinonChai);

const { request, response } = require('../../helpers/express-mocks.js');
const { data: journeyContext } = require('../../helpers/journey-mocks.js');
const JourneyContext = require('../../../../lib/JourneyContext.js');

const mwSkip = require('../../../../middleware/page/skip.js');

describe('Middleware: page/skip', () => {
  let stubRequest;
  let stubResponse;
  let stubNext;

  beforeEach(() => {
    stubRequest = request();
    stubRequest.casa = { journeyContext: journeyContext() };
    stubResponse = response();
    stubNext = sinon.stub();
  });

  it('should call next callback if there is no "skip" query', () => {
    const middleware = mwSkip('/');
    middleware(stubRequest, stubResponse, stubNext);
    expect(stubNext).to.be.calledOnceWithExactly();
  });

  it('should send a 400 response if the skip query is an invalid type or format', () => {
    const middleware = mwSkip('/');

    stubRequest.query.skipto = 123;
    middleware(stubRequest, stubResponse, stubNext);
    expect(stubResponse.status).to.be.calledWithExactly(400);
    expect(stubResponse.send).to.be.calledOnceWithExactly('Invalid waypoint');
    stubResponse.status.resetHistory();
    stubResponse.send.resetHistory();

    stubRequest.query.skipto = '$invalid-string$';
    middleware(stubRequest, stubResponse, stubNext);
    expect(stubResponse.status).to.be.calledWithExactly(400);
    expect(stubResponse.send).to.be.calledOnceWithExactly('Invalid waypoint');
    stubResponse.status.resetHistory();
    stubResponse.send.resetHistory();

    stubRequest.query.skipto = (new Array(201).fill('x')).join('');
    middleware(stubRequest, stubResponse, stubNext);
    expect(stubResponse.status).to.be.calledWithExactly(400);
    expect(stubResponse.send).to.be.calledOnceWithExactly('Invalid waypoint');
  });

  it('should overwrite journey data for the current page with __skipped__ flag', () => {
    const middleware = mwSkip('/');
    stubRequest.casa.journeyWaypointId = 'source-waypoint';
    stubRequest.query.skipto = 'target-waypoint';
    middleware(stubRequest, stubResponse, stubNext);

    expect(stubRequest.casa.journeyContext.clearValidationErrorsForPage).to.be.calledOnceWithExactly('source-waypoint');
    expect(stubRequest.casa.journeyContext.setDataForPage).to.be.calledOnceWithExactly('source-waypoint', {
      __skipped__: true,
    });
  });

  it('should save changes to session', () => {
    const middleware = mwSkip('/test-mount/');
    stubRequest.casa.journeyWaypointId = 'source-waypoint';
    stubRequest.query.skipto = 'target-waypoint';
    stubRequest.casa.journeyContext = new JourneyContext();
    // stubRequest.journeyContext.getData = sinon.stub().returns('test-data');
    middleware(stubRequest, stubResponse, stubNext);

    expect(stubRequest.session.journeyContext.data).to.eql({
      'source-waypoint': { __skipped__: true },
    });
    expect(stubRequest.session.save).to.be.calledOnceWithExactly(sinon.match.func);
  });

  it('should redirect to the target', () => {
    const middleware = mwSkip('/test-mount/');
    stubRequest.casa.journeyWaypointId = 'source-waypoint';
    stubRequest.query.skipto = 'target-waypoint';
    middleware(stubRequest, stubResponse, stubNext);

    expect(stubResponse.status).to.be.calledOnceWithExactly(302);
    expect(stubResponse.redirect).to.be.calledOnceWithExactly('/test-mount/target-waypoint');
  });

  it('should redirect to the target on the same origin as the current waypoint', () => {
    const middleware = mwSkip('/test-mount/');
    stubRequest.casa.journeyWaypointId = 'source-waypoint';
    stubRequest.query.skipto = 'target-waypoint';
    stubRequest.casa.journeyOrigin = { originId: 'test-origin' };
    middleware(stubRequest, stubResponse, stubNext);

    expect(stubResponse.status).to.be.calledOnceWithExactly(302);
    expect(stubResponse.redirect).to.be.calledOnceWithExactly('/test-mount/test-origin/target-waypoint');
  });

  it('should call next with an error if session fails to save', () => {
    const middleware = mwSkip('/test-mount/');
    stubRequest.casa.journeyWaypointId = 'source-waypoint';
    stubRequest.query.skipto = 'target-waypoint';
    stubRequest.casa.journeyOrigin = { originId: 'test-origin' };
    const error = new Error('TEST_ERROR');
    stubRequest.session.save = sinon.stub().callsFake(cb => cb(error));
    middleware(stubRequest, stubResponse, stubNext);

    expect(stubNext).to.be.calledOnceWithExactly(error);
  });
});
