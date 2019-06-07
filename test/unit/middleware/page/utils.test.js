const proxyquire = require('proxyquire');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');
const sinon = require('sinon');

const { expect } = chai;
chai.use(sinonChai);
chai.use(chaiAsPromised);

const { request, response } = require('../../helpers/express-mocks.js');
const logger = require('../../helpers/logger-mock.js');

describe('Middleware: page/utils', () => {
  /* ----------------------------------------------- extractSessionableData() */

  describe('extractSessionableData()', () => {
    let extractSessionableData;
    let stubIsObjectWithKeys;

    beforeEach(() => {
      stubIsObjectWithKeys = sinon.stub().returns(true);

      ({ extractSessionableData } = proxyquire('../../../../middleware/page/utils.js', {
        '../../lib/Util.js': {
          isObjectWithKeys: stubIsObjectWithKeys,
        },
      }));
    });

    it('should not throw given valid arguments', () => {
      expect(() => {
        extractSessionableData(logger(), 'valid-waypoint', {
          valid: 'validators',
        });
      }).to.not.throw();
    })

    it('should throw a TypeError if given incorrect logger type', () => {
      stubIsObjectWithKeys.withArgs('test-logger', ['warn']).returns(false);
      expect(() => {
        extractSessionableData('test-logger');
      }).to.throw(TypeError, 'Expected logger to be a configured logging object');
    });

    it('should throw a TypeError if given incorrect pageWaypointId type', () => {
      expect(() => {
        extractSessionableData('test-logger', false);
      }).to.throw(TypeError, 'Expected pageWaypointId to be a string');
    });

    it('should throw a TypeError if given incorrect fieldValidators type', () => {
      stubIsObjectWithKeys.withArgs('test-validators').returns(false);
      expect(() => {
        extractSessionableData('test-logger', 'test-waypoint', 'test-validators');
      }).to.throw(TypeError, 'Expected fieldValidators to be an object');
    });

    it('should throw a TypeError if given incorrect data type', () => {
      stubIsObjectWithKeys.withArgs('test-data').returns(false);
      expect(() => {
        extractSessionableData('test-logger', 'test-waypoint', 'test-validators', 'test-data');
      }).to.throw(TypeError, 'Expected data to be an object');
    });

    it('should return an empty object if no fieldValidators present', () => {
      const stubLogger = logger();
      const output = extractSessionableData(stubLogger, 'test-waypoint', {});
      expect(stubLogger.warn).to.be.calledOnceWithExactly('No field validators defined for "%s" waypoint. Will use an empty object.', 'test-waypoint');
      expect(output).to.eql({});
    });

    it('should remove data keys that do not have field validators', () => {
      const extracted = extractSessionableData(logger(), 'test-waypoint', {
        test: null,
      }, {
        test: 1,
        removeme: true,
      });
      expect(extracted).to.deep.equal({
        test: 1,
      });
    });

    it('should not add extract fields that are not present in original data object', () => {
      const extracted = extractSessionableData(logger(), 'test-waypoint', {
        test: null,
        another: null,
      }, {
        another: 2,
      });
      expect(extracted).to.not.have.property('test');
    });
  });

  /* ---------------------------------------------------------- executeHook() */

  describe('executeHook()', () => {
    let executeHook;
    let stubIsObjectWithKeys;

    beforeEach(() => {
      stubIsObjectWithKeys = sinon.stub().returns(true);

      ({ executeHook } = proxyquire('../../../../middleware/page/utils.js', {
        '../../lib/Util.js': {
          isObjectWithKeys: stubIsObjectWithKeys,
        },
      }));
    });

    it('should return a Promise', () => {
      const output = executeHook(logger());
      expect(output).to.be.an.instanceOf(Promise);
    });

    it('should resolve when no hook is configured', async () => {
      const stubLogger = logger();
      const stubRequest = request();
      stubRequest.journeyWaypointId = 'test-waypoint';
      const stubResponse = response();
      await executeHook(stubLogger, stubRequest, stubResponse, {}, 'test-hook');
      expect(stubLogger.trace).to.be.calledOnceWithExactly('No %s hook for %s', 'test-hook', 'test-waypoint');
    });

    it('should resolve when hook is configured and does not throw an error', async () => {
      const stubLogger = logger();
      const stubRequest = request();
      stubRequest.journeyWaypointId = 'test-waypoint';
      const stubResponse = response();
      const pageMeta = {
        hooks: {
          'test-hook': sinon.stub().callsFake((req, res, next) => {
            next();
          }),
        },
      };
      await executeHook(stubLogger, stubRequest, stubResponse, pageMeta, 'test-hook');
      expect(stubLogger.trace).to.be.calledOnceWithExactly('Run %s hook for %s', 'test-hook', 'test-waypoint');
      return expect(pageMeta.hooks['test-hook']).to.be.calledOnce;
    });

    it('should reject when hook is configured and throws an error', async () => {
      const stubLogger = logger();
      const stubRequest = request();
      stubRequest.journeyWaypointId = 'test-waypoint';
      const stubResponse = response();
      const stubError = new Error('test-error');
      const pageMeta = {
        hooks: {
          'test-hook': sinon.stub().callsFake((req, res, next) => {
            next(stubError);
          }),
        },
      };
      try {
        await executeHook(stubLogger, stubRequest, stubResponse, pageMeta, 'test-hook');
      } catch (err) {
        expect(stubLogger.trace).to.be.calledOnceWithExactly('Run %s hook for %s', 'test-hook', 'test-waypoint');
        expect(pageMeta.hooks['test-hook']).to.be.calledOnce;
        expect(err).to.equal(stubError);
      }
    });
  });
});
