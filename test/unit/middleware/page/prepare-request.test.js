const chai = require('chai');
const sinonChai = require('sinon-chai');
const sinon = require('sinon');

const { expect } = chai;
chai.use(sinonChai);

const { request, response } = require('../../helpers/express-mocks.js');
const { data: journeyContext, plan } = require('../../helpers/journey-mocks.js');
const logger = require('../../helpers/logger-mock.js');

const mwPrepare = require('../../../../middleware/page/prepare-request.js');

describe('Middleware: page/prepare-request', () => {
  let stubRequest;
  let stubResponse;
  let stubNext;
  let stubPlan;

  beforeEach(() => {
    stubRequest = request();
    stubRequest.journeyContext = journeyContext();
    stubRequest.log = logger();
    stubResponse = response();
    stubNext = sinon.stub();
    stubPlan = plan();
  });

  it('should call next middleware in chain', () => {
    const middleware = mwPrepare(stubPlan);
    middleware(stubRequest, stubResponse, stubNext);
    expect(stubNext).to.be.calledOnceWithExactly();
  });

  describe('plan', () => {
    it('should set a read-only "plan" property on the request', () => {
      const middleware = mwPrepare(stubPlan);
      middleware(stubRequest, stubResponse, stubNext);
      expect(stubRequest.casa).to.have.property('plan').that.equals(stubPlan);

      const prop = Object.getOwnPropertyDescriptor(stubRequest.casa, 'plan');
      expect(prop.writable).to.be.false;
      expect(prop.configurable).to.be.false;
      expect(prop.enumerable).to.be.true;
    });
  });

  describe('journeyOrigin', () => {
    it('should set a read-only "journeyOrigin" property on the request', () => {
      const middleware = mwPrepare(stubPlan);
      middleware(stubRequest, stubResponse, stubNext);
      expect(stubRequest.casa).to.have.property('journeyOrigin');

      const prop = Object.getOwnPropertyDescriptor(stubRequest.casa, 'journeyOrigin');
      expect(prop.writable).to.be.false;
      expect(prop.configurable).to.be.false;
      expect(prop.enumerable).to.be.true;
    });

    it('should set an empty originId and the origin\'s waypoint (1 origin)', () => {
      stubPlan.getOrigins = sinon.stub().returns([{
        originId: 'test-origin',
        waypoint: 'start-waypoint',
      }]);
      const middleware = mwPrepare(stubPlan);
      middleware(stubRequest, stubResponse, stubNext);
      expect(stubRequest.casa).to.have.property('journeyOrigin').that.is.an('object').that.eql({
        originId: '',
        waypoint: 'start-waypoint',
      });
    });

    it('should set an the origin\'s id and waypoint (multiple origins)', () => {
      stubPlan.getOrigins = sinon.stub().returns([{
        originId: 'test-origin-0',
        waypoint: 'start-waypoint-0',
      }, {
        originId: 'test-origin-1',
        waypoint: 'start-waypoint-1',
      }]);
      stubRequest.url = '/test-origin-1/test-waypoint';
      const middleware = mwPrepare(stubPlan);
      middleware(stubRequest, stubResponse, stubNext);
      expect(stubRequest.casa).to.have.property('journeyOrigin').that.is.an('object').that.eql({
        originId: 'test-origin-1',
        waypoint: 'start-waypoint-1',
      });
    });

    it('should set an undefined origin (no matching origins)', () => {
      stubPlan.getOrigins = sinon.stub().returns([{
        originId: 'test-origin-0',
        waypoint: 'start-waypoint-0',
      }, {
        originId: 'test-origin-1',
        waypoint: 'start-waypoint-1',
      }]);
      stubRequest.url = '/unmatched-origin/test-waypoint';
      const middleware = mwPrepare(stubPlan);
      middleware(stubRequest, stubResponse, stubNext);
      expect(stubRequest.casa).to.have.property('journeyOrigin').that.is.undefined;
    });
  });

  describe('journeyWaypointId', () => {
    it('should set a read-only "journeyWaypointId" property on the request', () => {
      const middleware = mwPrepare(stubPlan);
      middleware(stubRequest, stubResponse, stubNext);
      expect(stubRequest.casa).to.have.property('journeyWaypointId');

      const prop = Object.getOwnPropertyDescriptor(stubRequest.casa, 'journeyWaypointId');
      expect(prop.writable).to.be.false;
      expect(prop.configurable).to.be.false;
      expect(prop.enumerable).to.be.true;
    });

    it('should extract the waypoint ID from the url (1 origin)', () => {
      stubPlan.getOrigins = sinon.stub().returns([{
        originId: 'test-origin',
        waypoint: 'start-waypoint',
      }]);
      const middleware = mwPrepare(stubPlan);
      stubRequest.url = '/test-origin/test-waypoint';
      middleware(stubRequest, stubResponse, stubNext);
      expect(stubRequest.casa).to.have.property('journeyWaypointId').that.is.a('string').and.equals('test-waypoint');
    });

    it('should extract the waypoint ID from the url (multiple origins)', () => {
      stubPlan.getOrigins = sinon.stub().returns([{
        originId: 'test-origin-0',
        waypoint: 'start-waypoint-0',
      }, {
        originId: 'test-origin-1',
        waypoint: 'start-waypoint-1',
      }]);
      const middleware = mwPrepare(stubPlan);
      stubRequest.url = '/test-origin-1/test-waypoint';
      middleware(stubRequest, stubResponse, stubNext);
      expect(stubRequest.casa).to.have.property('journeyWaypointId').that.is.a('string').and.equals('test-waypoint');
    });

    it('should be undefined if there is no match', () => {
      stubPlan.getOrigins = sinon.stub().returns([]);
      const middleware = mwPrepare(stubPlan);
      stubRequest.url = '/';
      middleware(stubRequest, stubResponse, stubNext);
      expect(stubRequest.casa).to.have.property('journeyWaypointId').that.is.undefined;
    });
  });
});
