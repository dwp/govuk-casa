const proxyquire = require('proxyquire');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const { expect } = chai;
chai.use(sinonChai);

const { request, response } = require('../../helpers/express-mocks.js');
const logger = require('../../helpers/logger-mock.js');

describe('Middleware: static/asset-versions', () => {
  let proxyStubs;
  let mockLogger;
  let mwVersions;
  let mockRequest;
  let mockResponse;
  let stubNext;

  beforeEach(() => {
    mockLogger = logger();
    proxyStubs = {
      fs: {
        readFileSync: sinon.stub(),
      },
    };
    mwVersions = proxyquire('../../../../middleware/static/asset-versions.js', proxyStubs);
    mockRequest = request();
    mockResponse = response();
    mockResponse.locals.casa = {};
    stubNext = sinon.stub();
  });

  it('should return a function', () => {
    expect(mwVersions(mockLogger)).to.be.an.instanceOf(Function);
  });

  it('should set res.locals.casa.packageVersions', () => {
    const middleware = mwVersions(mockLogger);
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockResponse.locals.casa).to.have.property('packageVersions').that.eql({});
  });

  it('should read version from specified files and set on res.locals.casa.packageVersions', () => {
    proxyStubs.fs.readFileSync = sinon.stub().returns(JSON.stringify({
      version: '1.2.3',
    }));
    const middleware = mwVersions(mockLogger, {
      testPackage: '/test/path/to/fake/file.json',
    });
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockResponse.locals.casa).to.have.property('packageVersions').that.eql({
      testPackage: '1.2.3',
    });
  });

  it('should default to an empty version string if file cannot be parsed', () => {
    proxyStubs.fs.readFileSync = sinon.stub().returns('unparseable-json-string');
    const middleware = mwVersions(mockLogger, {
      testPackage: '/test/path/to/fake/file.json',
    });
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockResponse.locals.casa).to.have.property('packageVersions').that.eql({
      testPackage: '',
    });
    expect(mockLogger.debug).to.be.calledOnceWithExactly(
      'Cannot parse file %s (%s) to find version',
      'testPackage',
      '/test/path/to/fake/file.json',
    );
    expect(mockLogger.error).to.be.calledOnceWithExactly(sinon.match.instanceOf(SyntaxError));
  });

  it('should default to an empty version string if file cannot be read', () => {
    proxyStubs.fs.readFileSync = sinon.stub().throws(new Error('Test Failure'))
    const middleware = mwVersions(mockLogger, {
      testPackage: '/test/path/to/fake/file.json',
    });
    middleware(mockRequest, mockResponse, stubNext);
    expect(mockLogger.debug).to.be.calledOnceWithExactly(
      'Cannot parse file %s (%s) to find version',
      'testPackage',
      '/test/path/to/fake/file.json',
    );
    expect(mockLogger.error).to.be.calledOnceWithExactly(sinon.match.instanceOf(Error));
  });
});
