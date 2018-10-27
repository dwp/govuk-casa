const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const endSession = require('../../../../lib/bootstrap/end-session.js');

const { expect } = chai;

chai.use(chaiAsPromised);

const NOOP = () => {}; /* eslint-disable-line require-jsdoc */

describe('lib/bootstrap/end-session', () => {
  it('should be a function', () => {
    expect(endSession).to.be.an.instanceof(Function);
  });

  it('should return a Promise', () => {
    expect(endSession().catch(NOOP)).to.be.an.instanceof(Promise);
  });

  it('should call to regenerate a new session identifier', () => {
    const reqStub = {
      session: {
        regenerate: sinon.stub().callsFake((cb) => {
          cb()
        })
      }
    };
    return endSession(reqStub)
      .then(() => expect(reqStub.session.regenerate).to.have.been.calledOnce);
  });

  it('should resolve if session regenerates successfully', () => {
    const reqStub = {
      session: {
        regenerate: sinon.stub().callsFake((cb) => {
          cb()
        })
      }
    };
    return expect(endSession(reqStub)).to.be.fulfilled;
  });

  it('should reject if session regeneration fails', () => {
    const reqStub = {
      session: {
        regenerate: sinon.stub().callsFake((cb) => {
          cb(new Error('Failed'))
        })
      }
    };
    return expect(endSession(reqStub)).to.be.rejectedWith(Error);
  });

  it('should maintain an existing language setting after regeneration', () => {
    const reqStub = {
      session: {
        language: 'TEST_LANG',
        regenerate: sinon.stub().callsFake((cb) => {
          cb()
        })
      }
    };
    return endSession(reqStub)
      .then(() => expect(reqStub.session.language).to.equal('TEST_LANG'));
  });
});
