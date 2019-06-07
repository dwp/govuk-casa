const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const { expect } = chai;
chai.use(sinonChai);

const { app } = require('../../helpers/express-mocks.js');

const mwMount = require('../../../../middleware/mount/index.js');

describe('Middleware: mount/index', () => {
  let mockApp;

  beforeEach(() => {
    mockApp = app();
  });

  it('should not mount middleware when mountUrl is /', () => {
    mwMount(mockApp);
    return expect(mockApp.all).to.not.have.been.called;
  });

  it('should mount middleware when mountUrl is not /', () => {
    mwMount(mockApp, '/test-mount/');
    return expect(mockApp.all).to.have.been.calledOnceWith('/', sinon.match.func);
  });
});
