const chai = require('chai');
const sinonChai = require('sinon-chai');
const sinon = require('sinon');

const { expect } = chai;
chai.use(sinonChai);

const { request, response } = require('../../helpers/express-mocks.js');
const { data: journeyData, graph } = require('../../helpers/journey-mocks.js');
const logger = require('../../helpers/logger-mock.js');

const mwPrepare = require('../../../../middleware/page/prepare-request.js');

describe('Middleware: page/prepare-request', () => {
  let stubRequest;
  let stubResponse;
  let stubNext;
  let stubGraph;

  beforeEach(() => {
    stubRequest = request();
    stubRequest.journeyData = journeyData();
    stubRequest.log = logger();
    stubResponse = response();
    stubNext = sinon.stub();
    stubGraph = graph();
  });

  it('should call next middleware in chain', () => {
    const middleware = mwPrepare(stubGraph);
    middleware(stubRequest, stubResponse, stubNext);
    expect(stubNext).to.be.calledOnceWithExactly();
  });

  describe('journeyActive', () => {
    it('should set a read-only "journeyActive" property on the request', () => {
      const middleware = mwPrepare(stubGraph);
      middleware(stubRequest, stubResponse, stubNext);
      expect(stubRequest).to.have.property('journeyActive').that.equals(stubGraph);

      const prop = Object.getOwnPropertyDescriptor(stubRequest, 'journeyActive');
      expect(prop.writable).to.be.false;
      expect(prop.configurable).to.be.false;
      expect(prop.enumerable).to.be.true;
    });
  });

  describe('journeyOrigin', () => {
    it('should set a read-only "journeyOrigin" property on the request', () => {
      const middleware = mwPrepare(stubGraph);
      middleware(stubRequest, stubResponse, stubNext);
      expect(stubRequest).to.have.property('journeyOrigin');

      const prop = Object.getOwnPropertyDescriptor(stubRequest, 'journeyOrigin');
      expect(prop.writable).to.be.false;
      expect(prop.configurable).to.be.false;
      expect(prop.enumerable).to.be.true;
    });

    it('should set an empty originId and the origin\'s node (1 origin)', () => {
      stubGraph.getOrigins = sinon.stub().returns([{
        originId: 'test-origin',
        node: 'start-node',
      }]);
      const middleware = mwPrepare(stubGraph);
      middleware(stubRequest, stubResponse, stubNext);
      expect(stubRequest).to.have.property('journeyOrigin').that.is.an('object').that.eql({
        originId: '',
        node: 'start-node',
      });
    });

    it('should set an the origin\'s id and node (multiple origins)', () => {
      stubGraph.getOrigins = sinon.stub().returns([{
        originId: 'test-origin-0',
        node: 'start-node-0',
      }, {
        originId: 'test-origin-1',
        node: 'start-node-1',
      }]);
      stubRequest.url = '/test-origin-1/test-node';
      const middleware = mwPrepare(stubGraph);
      middleware(stubRequest, stubResponse, stubNext);
      expect(stubRequest).to.have.property('journeyOrigin').that.is.an('object').that.eql({
        originId: 'test-origin-1',
        node: 'start-node-1',
      });
    });

    it('should set an undefined origin (no matching origins)', () => {
      stubGraph.getOrigins = sinon.stub().returns([{
        originId: 'test-origin-0',
        node: 'start-node-0',
      }, {
        originId: 'test-origin-1',
        node: 'start-node-1',
      }]);
      stubRequest.url = '/unmatched-origin/test-node';
      const middleware = mwPrepare(stubGraph);
      middleware(stubRequest, stubResponse, stubNext);
      expect(stubRequest).to.have.property('journeyOrigin').that.is.undefined;
    });
  });

  describe('journeyWaypointId', () => {
    it('should set a read-only "journeyWaypointId" property on the request', () => {
      const middleware = mwPrepare(stubGraph);
      middleware(stubRequest, stubResponse, stubNext);
      expect(stubRequest).to.have.property('journeyWaypointId');

      const prop = Object.getOwnPropertyDescriptor(stubRequest, 'journeyWaypointId');
      expect(prop.writable).to.be.false;
      expect(prop.configurable).to.be.false;
      expect(prop.enumerable).to.be.true;
    });

    it('should extract the node ID from the url (1 origin)', () => {
      stubGraph.getOrigins = sinon.stub().returns([{
        originId: 'test-origin',
        node: 'start-node',
      }]);
      const middleware = mwPrepare(stubGraph);
      stubRequest.url = '/test-origin/test-node';
      middleware(stubRequest, stubResponse, stubNext);
      expect(stubRequest).to.have.property('journeyWaypointId').that.is.a('string').and.equals('test-node');
    });

    it('should extract the node ID from the url (multiple origins)', () => {
      stubGraph.getOrigins = sinon.stub().returns([{
        originId: 'test-origin-0',
        node: 'start-node-0',
      }, {
        originId: 'test-origin-1',
        node: 'start-node-1',
      }]);
      const middleware = mwPrepare(stubGraph);
      stubRequest.url = '/test-origin-1/test-node';
      middleware(stubRequest, stubResponse, stubNext);
      expect(stubRequest).to.have.property('journeyWaypointId').that.is.a('string').and.equals('test-node');
    });

    it('should be undefined if there is no match', () => {
      stubGraph.getOrigins = sinon.stub().returns([]);
      const middleware = mwPrepare(stubGraph);
      stubRequest.url = '/';
      middleware(stubRequest, stubResponse, stubNext);
      expect(stubRequest).to.have.property('journeyWaypointId').that.is.undefined;
    });
  });
});
