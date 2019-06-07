const proxyquire = require('proxyquire');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const { expect } = chai;
chai.use(sinonChai);

const logger = require('../../helpers/logger-mock.js');

describe('Middleware: static/prepare-assets', () => {
  let proxyStubs;
  let mockLogger;
  let mwPrepare;

  beforeEach(() => {
    proxyStubs = {
      path: {
        resolve: sinon.stub().callsFake(p => (p)),
        relative: sinon.stub().callsFake((p, f) => (f)),
      },
      'fs-extra': {
        copyFile: sinon.stub(),
        ensureDirSync: sinon.stub(),
        readFileSync: sinon.stub(),
        writeFileSync: sinon.stub(),
      },
      'klaw-sync': sinon.stub(),
    };
    mwPrepare = proxyquire('../../../../middleware/static/prepare-assets.js', proxyStubs);

    mockLogger = logger();
  });

  it('should substitute CASA_MOUNT_URL placeholder with correct mountUrl and write to target folder', () => {
    proxyStubs['klaw-sync'].callsFake(dir => (dir.match(/.css$/) ? [
      { path: '/path/to/source.css' },
    ] : []));
    proxyStubs.path.resolve.returns('/path/to/destination.css');
    proxyStubs['fs-extra'].ensureDirSync.returns(true);
    proxyStubs['fs-extra'].readFileSync.returns('TEST:~~~CASA_MOUNT_URL~~~');

    mwPrepare({
      logger: mockLogger,
      mountUrl: '/test-mount/',
    });

    expect(proxyStubs['fs-extra'].readFileSync).to.be.calledOnceWith('/path/to/source.css', {
      encoding: 'utf8',
    });

    expect(proxyStubs['fs-extra'].writeFileSync).to.be.calledOnceWith('/path/to/destination.css', 'TEST:/test-mount/', {
      encoding: 'utf8',
    });
  });

  it('should copy JS source files to the target folder', () => {
    proxyStubs['klaw-sync'].callsFake(dir => (dir.match(/.js$/) ? [
      { path: '/path/to/source.js' },
    ] : []));
    proxyStubs.path.resolve.returns('/path/to/destination.js');
    proxyStubs['fs-extra'].ensureDirSync.returns(true);

    mwPrepare({
      logger: mockLogger,
    });

    expect(proxyStubs['fs-extra'].copyFile).to.be.calledOnceWith('/path/to/source.js', '/path/to/destination.js');
  });

  it('should throw an Exception if any IO operations fail', () => {
    proxyStubs['klaw-sync'].callsFake(dir => (dir.match(/.css$/) ? [
      { path: '/path/to/source.css' },
    ] : []));
    proxyStubs['fs-extra'].readFileSync.throws(new Error());

    expect(() => {
      mwPrepare({
        logger: mockLogger,
      });
    }).to.throw(Error);
  });
});
