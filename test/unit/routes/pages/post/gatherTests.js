const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const proxyquire = require('proxyquire');
const JourneyData = require('../../../../../lib/JourneyData.js');
const logger = require('../../../../../lib/Logger.js')('test');

const { expect } = chai;
chai.use(sinonChai);

const doGather = require('../../../../../app/routes/pages/post/gather.js');

describe('Routes: post/gather.js', () => {
  it('should return a Promise', () => {
    const result = doGather();
    expect(result).to.be.an.instanceOf(Promise);
    result.catch(() => (true));
  });

  it('should execute the "pregather" hook', () => {
    const stubExecuteHook = sinon.stub().returns(Promise.resolve());

    const proxiedDoGather = proxyquire('../../../../../app/routes/pages/post/gather.js', {
      '../utils.js': {
        executeHook: stubExecuteHook,
      },
    });

    const argLogger = {};
    const argReq = {};
    const argRes = {};
    const argMeta = {};
    proxiedDoGather(argLogger, argReq, argRes, argMeta).catch(() => (true));

    return expect(stubExecuteHook).to.have.been.calledOnceWithExactly(argLogger, argReq, argRes, argMeta, 'pregather');
  });

  it('should merge modified data back to req.body', async () => {
    const postBodyData = {
      x: 1,
      y: {
        z: 2,
      },
    };
    const sessionData = {
      x: 1,
    };
    const modifiedData = {
      x: 2,
    };

    const proxiedDoGather = proxyquire('../../../../../app/routes/pages/post/gather.js', {
      '../utils.js': {
        executeHook: sinon.stub().returns(Promise.resolve()),
        extractSessionableData: sinon.stub().returns(sessionData),
      },
      './gather-modifiers.js': {
        doGatherDataModification: sinon.stub().returns(modifiedData),
      },
    });

    const mockReq = {
      body: postBodyData,
    };
    await proxiedDoGather(logger, mockReq, {}, {}).catch(() => (true));

    expect(mockReq.body).to.deep.equal({
      x: 2,
      y: {
        z: 2,
      },
    });
  });

  it('should store only sessionable data in the session', async () => {
    const postBodyData = {
      x: 1,
      y: {
        z: 2,
      },
    };
    const sessionData = {
      x: 1,
    };
    const modifiedData = {
      x: 2,
    };

    const proxiedDoGather = proxyquire('../../../../../app/routes/pages/post/gather.js', {
      '../utils.js': {
        executeHook: sinon.stub().returns(Promise.resolve()),
        extractSessionableData: sinon.stub().returns(sessionData),
      },
      './gather-modifiers.js': {
        doGatherDataModification: sinon.stub().returns(modifiedData),
      },
    });

    const testWaypointId = 'testwaypoint';
    const mockReq = {
      body: postBodyData,
      journeyWaypointId: testWaypointId,
      journeyData: new JourneyData({
        [testWaypointId]: {
          x: 'original',
        },
      }),
      session: {},
    };
    await proxiedDoGather(logger, mockReq, {}, {}).catch(() => (true));

    expect(mockReq.journeyData.getDataForPage(testWaypointId)).to.deep.equal(modifiedData);
    expect(mockReq.session.journeyData).to.deep.equal({
      [testWaypointId]: modifiedData,
    });
  });
});
