const proxyquire = require('proxyquire');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');
const sinon = require('sinon');

const { expect } = chai;
chai.use(sinonChai);
chai.use(chaiAsPromised);

const { nestHooks, executeHook } = require('../../../../middleware/page/utils.js');

const SimpleField = require('../../../../lib/validation/SimpleField.js');

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
        test: SimpleField([]),
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
        test: SimpleField([]),
        another: SimpleField([]),
      }, {
        another: 2,
      });
      expect(extracted).to.not.have.property('test');
    });

    it('should not extract fields if their field validator conditional returns false', () => {
      const extracted = extractSessionableData(logger(), 'test-waypoint', {
        test: SimpleField([], () => (true)),
        another: SimpleField([], () => (false)),
      }, {
        test: 'some-data',
        another: 'more-data',
      });
      expect(extracted).to.have.property('test');
      expect(extracted).to.not.have.property('another');
    });
  });

  /* ------------------------------------------------------------ nestHooks() */

  describe('nestHooks()', () => {
    const hooks = [
      (req, res, next) => {
        req.called1 = true;
        next();
      },
      (req, res, next) => {
        req.called2 = true;
        next();
      },
      (req, res, next) => {
        req.called3 = true;
        next();
      },
    ];
    const validPageWaypointId = 'test-waypoint';
    const validHookName = 'prerender';

    it('should return a function', () => {
      expect(
        nestHooks(logger(), validHookName, validPageWaypointId, hooks),
      ).to.be.a('function');
    });

    it('should return a function that calls all functions in original array', () => {
      const req = {};
      const res = {};
      const next = () => {
        req.calledNext = true;
      };

      const nestedHooks = nestHooks(logger(), validHookName, validPageWaypointId, hooks);
      nestedHooks(req, res, next);

      expect(req.called1).to.equal(true);
      expect(req.called2).to.equal(true);
      expect(req.called3).to.equal(true);
      expect(req.calledNext).to.equal(true);
    });

    it('should return a function that calls all functions in original array in the same order', () => {
      const hooksPush = [
        (req, res, next) => {
          req.called.push('1');
          next();
        },
        (req, res, next) => {
          req.called.push('2');
          next();
        },
        (req, res, next) => {
          req.called.push('3');
          next();
        },
      ];

      const req = { called: [] };
      const res = {};
      const next = () => {
        req.called.push('next');
      };

      const nestedHooks = nestHooks(logger(), validHookName, validPageWaypointId, hooksPush);
      nestedHooks(req, res, next);

      expect(req.called).to.deep.equal(['1', '2', '3', 'next']);
    });

    it('should return a function that calls all functions in the same order even if async', (done) => {
      const hooksPush = [
        (req, res, next) => {
          req.called.push('1');
          next();
        },
        (req, res, next) => {
          setTimeout(() => {
            req.called.push('2');
            next();
          }, 10);
        },
        (req, res, next) => {
          req.called.push('3');
          next();
        },
      ];

      const req = { called: [] };
      const res = {};
      const next = () => {
        req.called.push('next');
        expect(req.called).to.deep.equal(['1', '2', '3', 'next']);
        done();
      };

      const nestedHooks = nestHooks(logger(), validHookName, validPageWaypointId, hooksPush);
      nestedHooks(req, res, next);
    });

    it('should return a function that does not try to call any none function array entries', () => {
      const hooksNoneFunc = [...hooks];
      hooksNoneFunc[1] = undefined;

      const req = {};
      const res = {};
      const next = () => {
        req.calledNext = true;
      };

      const nestedHooks = nestHooks(logger(), validHookName, validPageWaypointId, hooksNoneFunc);

      expect(() => {
        nestedHooks(req, res, next);
      }).to.not.throw();
    });
  });

  /* ---------------------------------------------------------- executeHook() */

  describe('executeHook()', () => {
    it('should return a Promise', () => {
      const output = executeHook(logger());
      expect(output).to.be.an.instanceOf(Promise);
    });

    it('should resolve when no hook is configured', async () => {
      const stubLogger = logger();
      const stubRequest = request();
      stubRequest.casa = { journeyWaypointId: 'test-waypoint' };
      const stubResponse = response();
      await executeHook(stubLogger, stubRequest, stubResponse, {}, 'test-hook');
      expect(stubLogger.trace).to.be.calledOnceWithExactly('No %s hook for %s', 'test-hook', 'test-waypoint');
    });

    it('should resolve when all nested hooks do not throw an errors', async () => {
      const stubLogger = logger();
      const stubRequest = request();
      stubRequest.casa = { journeyWaypointId: 'test-waypoint' };
      const stubResponse = response();
      const pageMeta = {
        hooks: {
          'test-hook': [
            sinon.stub().callsFake((req, res, next) => next()),
            sinon.stub().callsFake((req, res, next) => next()),
            sinon.stub().callsFake((req, res, next) => next()),
          ],
        },
      };
      await executeHook(stubLogger, stubRequest, stubResponse, pageMeta, 'test-hook');
      expect(stubLogger.trace).to.be.calledWithExactly('Running nested %s hooks for %s', 'test-hook', 'test-waypoint');
      expect(pageMeta.hooks['test-hook'][0]).to.be.calledOnce;
      expect(pageMeta.hooks['test-hook'][1]).to.be.calledOnce;
      expect(pageMeta.hooks['test-hook'][2]).to.be.calledOnce;
    });

    it('should resolve when hook is configured and does not throw an error', async () => {
      const stubLogger = logger();
      const stubRequest = request();
      stubRequest.casa = { journeyWaypointId: 'test-waypoint' };
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
      stubRequest.casa = { journeyWaypointId: 'test-waypoint' };
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
