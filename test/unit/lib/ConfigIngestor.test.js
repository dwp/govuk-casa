const fs = require('fs');
const os = require('os');
const path = require('path');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');

const { expect } = chai;

chai.use(sinonChai);

const {
  ingest,
  validateAllowPageEdit,
  validateCompiledAssetsDir,
  validateContentSecurityPolicies,
  validateHeadersObject,
  validateHeadersDisabled,
  validateI18nObject,
  validateI18nDirs,
  validateI18nLocales,
  validateMountController,
  validateMountUrl,
  validatePhase,
  validateServiceName,
  validateSessionsObject,
  validateSessionsCookiePath,
  validateSessionsName,
  validateSessionsSecret,
  validateSessionsSecure,
  validateSessionsStore,
  validateSessionsTtl,
  validateViewsObject,
  validateViewsDirs,
} = require('../../../lib/ConfigIngestor.js');

const dirTestData = path.resolve(__dirname, '..', 'testdata');

describe('ConfigIngestor', () => {
  describe('ingest()', () => {
    it('should be a function', () => {
      expect(ingest).to.be.a('function');
    });

    it('should throw an Error when given invalid configuration', () => {
      expect(() => ingest()).to.throw();
    });

    it('should return an immutable object when given valid configuration', () => {
      const config = ingest({
        compiledAssetsDir: dirTestData,
        i18n: {
          dirs: [],
          locales: [],
        },
        sessions: {
          name: 'session-name',
          secret: 'secret',
          secure: false,
          ttl: 3600,
        },
        views: {
          dirs: [],
        },
      });

      return expect(Object.isFrozen(config)).to.be.true;
    });
  });

  describe('validateAllowPageEdit', () => {
    it('should throw a TypeError when not given a boolean', () => {
      expect(() => validateAllowPageEdit([])).to.throw(TypeError, 'Allow page edit flag must be a boolean (allowPageEdit)');
    });

    it('should not throw when argument is a boolean', () => {
      expect(() => validateAllowPageEdit(true)).to.not.throw();
    });

    it('should default to false', () => (
      expect(validateAllowPageEdit()).to.be.false
    ));

    it('should return the passed value', () => (
      expect(validateAllowPageEdit(true)).to.be.true
    ));
  });

  describe('validateCompiledAssetsDir()', () => {
    // If these tests are being run as root, these tests will fail because
    // root cannot be restricted (simply) in accessing the assets folder
    const itf = os.userInfo().username === 'root' ? it.skip : it;

    it('should throw a ReferenceError if no value is specified', () => {
      expect(() => validateCompiledAssetsDir()).to.throw(ReferenceError);
    });

    itf('should throw an Error if the directory does not exist', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'casa-'));
      const missingDir = path.resolve(tmpDir, 'non-existent-directory');
      expect(() => validateCompiledAssetsDir(missingDir)).to.throw(
        Error,
        'Compiled assets directory missing (compiledAssetsDir)',
      ).with.property('code', 'ENOENT');
    });

    itf('should throw an Error if the directory is not readable', () => {
      const unreadableDir = fs.mkdtempSync(path.join(os.tmpdir(), 'casa-'));
      fs.chmodSync(unreadableDir, 0o200);
      expect(() => validateCompiledAssetsDir(unreadableDir)).to.throw(Error).with.property('code', 'EACCES');
    });

    itf('should throw an Error if the directory is not writeable', () => {
      const unwriteableDir = fs.mkdtempSync(path.join(os.tmpdir(), 'casa-'));
      fs.chmodSync(unwriteableDir, 0o100);
      expect(() => validateCompiledAssetsDir(unwriteableDir)).to.throw(Error).with.property('code', 'EACCES');
    });

    itf('should return a valid value', () => {
      const validDir = fs.mkdtempSync(path.join(os.tmpdir(), 'casa-'));
      fs.chmodSync(validDir, 0o600);
      expect(validateCompiledAssetsDir(validDir)).to.equal(validDir);
    });
  });

  describe('validateContentSecurityPolicies()', () => {
    it('should accept a valid content secure policy', () => {
      const csp = {
        'child-src': [],
        'connect-src': [],
        'default-src': [],
        'font-src': [],
        'frame-src': [],
        'img-src': [],
        'manifest-src': [],
        'media-src': [],
        'object-src': [],
        'script-src': [],
        'style-src': [],
        'worker-src': [],
        'base-uri': [],
        'plugin-types': [],
        sandbox: [],
        'form-action': [],
        'frame-ancestors': [],
        'block-all-mixed-content': [],
        'require-sri-for': [],
        'upgrade-insecure-requests': [],
        'report-uri': [],
        'report-to': [],
      };
      expect(validateContentSecurityPolicies(csp)).to.eql(csp);
    });

    it('should throw an error if an invalid content secure policy is provided', () => {
      expect(() => validateContentSecurityPolicies({
        'invalid-csp-directive': [],
      })).to.throw(Error, 'Invalid CSP directive specified: invalid-csp-directive');
    });

    it('should allow scriptSources as a valid CSP directive, and map it to script-src', () => {
      expect(validateContentSecurityPolicies({
        scriptSources: ['x', 'y'],
      })).to.eql({
        'script-src': ['x', 'y'],
      });
    });

    it('should throw an error if scriptSources is defined with any other directive', () => {
      expect(() => validateContentSecurityPolicies({
        scriptSources: [],
        'script-src': [],
      })).to.throw(Error, 'Use of CSP scriptSources is included for backwards compatibility and should not be used with other CSP directives, if using as part of a wider policy then please use \'script-src\' instead of \'scriptSources\'');
    });
  });

  describe('validateHeadersObject', () => {
    it('should throw a TypeError when not given an object', () => {
      expect(() => validateHeadersObject([])).to.throw(TypeError, 'Headers must be an object');
    });

    it('should not throw when no arguments are passed', () => {
      expect(() => validateHeadersObject()).to.not.throw();
    });

    it('should call the callback, passing a valid value, and return its result', () => {
      const stubCallback = sinon.stub().returns('test-response');
      const testInput = {};
      expect(validateHeadersObject(testInput, stubCallback)).to.equal('test-response');
      expect(stubCallback).to.be.calledOnceWithExactly(testInput);
    });
  });

  describe('validateHeadersDisabled()', () => {
    it('should throw an Error if the value is not an Array', () => {
      expect(() => validateHeadersDisabled('not an array')).to.throw(TypeError, 'Disabled headers must be an array (headers.disabled)');
    });

    it('should return a valid value', () => {
      const testHeaders = ['Content-Type', 'Location'];
      expect(validateHeadersDisabled(testHeaders)).to.equal(testHeaders);
    });
  });

  describe('validateI18nObject()', () => {
    it('should throw a TypeError when not given an object', () => {
      expect(() => validateI18nObject()).to.throw(TypeError, 'I18n must be an object');
    });

    it('should call the callback, passing a valid value, and return its result', () => {
      const stubCallback = sinon.stub().returns('test-response');
      const testInput = {};
      expect(validateI18nObject(testInput, stubCallback)).to.equal('test-response');
      expect(stubCallback).to.be.calledOnceWithExactly(testInput);
    });
  });

  describe('validateI18nDirs()', () => {
    it('should throw an Error if no value is specified', () => {
      expect(() => validateI18nDirs()).to.throw(ReferenceError, 'I18n directories are missing (i18n.dirs)');
    });

    it('should throw an Error if the value is not an Array', () => {
      expect(() => validateI18nDirs('not an array')).to.throw(TypeError, 'I18n directories must be an array (i18n.dirs)');
    });

    it('should return a valid value', () => {
      const testDirs = ['my/i18n-directory'];
      expect(validateI18nDirs(testDirs)).to.eql(['my/i18n-directory'])
    });
  });

  describe('validateI18nLocales()', () => {
    it('should throw an Error if no value is specified', () => {
      expect(() => validateI18nLocales()).to.throw(ReferenceError, 'I18n locales are missing (i18n.locales)');
    });

    it('should throw an Error if the value is not an Array', () => {
      expect(() => validateI18nLocales('not an array')).to.throw(TypeError, 'I18n locales must be an array (i18n.locales)');
    });

    it('should return a valid value', () => {
      const testLocales = ['en', 'cy'];
      expect(validateI18nLocales(testLocales)).to.equal(testLocales);
    });
  });

  describe('validateMountController()', () => {
    it('should return undefined if passed nothing', () => (
      expect(validateMountController()).to.be.undefined
    ));

    it('should return a valid value (function)', () => {
      const testFunction = function () {};
      expect(validateMountController(testFunction)).to.equal(testFunction);
    });

    it('should throw a TypeError if not a function', () => {
      expect(() => validateMountController('string')).to.throw(
        TypeError,
        'Additional mount controller must be a function',
      );
    });

    it('should throw an error if mountController is already bound', () => {
      const testFunction = (function mountController() {
        return 'Hello world';
      }).bind('something', 'else');
      expect(() => validateMountController(testFunction)).to.throw(
        Error,
        'Additional mount controller must not be arrow function or already bound',
      );
    });

    it('should throw an error if mountController is an arrow function', () => {
      const testFunction = () => 'Hello, world';
      expect(() => validateMountController(testFunction)).to.throw(
        Error,
        'Additional mount controller must not be arrow function or already bound',
      );
    });
  });

  describe('validateMountUrl()', () => {
    it('should default to / when a value is not specified', () => {
      expect(validateMountUrl()).to.equal('/');
    });

    it('should throw an Error if a trailing slash is missing', () => {
      expect(() => validateMountUrl('/missing-trailing-slash')).to.throw(Error, 'Mount URL must include a trailing slash (/)');
    });

    it('should return a valid value', () => {
      expect(validateMountUrl('/this-is/my/mount-url/')).to.equal('/this-is/my/mount-url/');
    });
  });

  describe('validatePhase()', () => {
    it('should default to live if no value is specified', () => {
      expect(validatePhase()).to.equal('live');
    });

    it('should throw an Error if the value is not a valid phase', () => {
      expect(() => validatePhase('LIVE')).to.throw(SyntaxError);

      expect(() => validatePhase('monkey')).to.throw(SyntaxError);
    });

    it('should return a valid value', () => {
      expect(validatePhase('alpha')).to.equal('alpha');
      expect(validatePhase('beta')).to.equal('beta');
      expect(validatePhase('live')).to.equal('live');
    });
  });

  describe('validateServiceName()', () => {
    it('should default to empty string if no value is specified', () => {
      expect(validateServiceName()).to.equal('');
    });

    it('should throw a TypeError if the value is not a string', () => {
      expect(() => validateServiceName([])).to.throw(TypeError, 'Service name must be a string (serviceName)');
    });
  });

  describe('validateSessionsObject()', () => {
    it('should throw a TypeError when not given an object', () => {
      expect(() => validateSessionsObject()).to.throw(TypeError, 'Session config has not been specified');
    });

    it('should call the callback, passing a valid value, and return its result', () => {
      const stubCallback = sinon.stub().returns('test-response');
      const testInput = {};
      expect(validateSessionsObject(testInput, stubCallback)).to.equal('test-response');
      expect(stubCallback).to.be.calledOnceWithExactly(testInput);
    });
  });

  describe('validateSessionsCookiePath()', () => {
    it('should the default value if no value is specified', () => {
      expect(validateSessionsCookiePath(undefined, '/default/')).to.equal('/default/');
    });

    it('should return a valid value', () => {
      expect(validateSessionsCookiePath('test-path')).to.equal('test-path');
    });
  });

  describe('validateSessionsName()', () => {
    it('should throw an ReferenceError if no value is specified', () => {
      expect(() => validateSessionsName()).to.throw(ReferenceError, 'Session name is missing (sessions.name)');
    });

    it('should throw a TypeError if the value is not a string', () => {
      expect(() => validateSessionsName([])).to.throw(TypeError, 'Session name must be a string (sessions.name)');
    });

    it('should return a valid value', () => {
      expect(validateSessionsName('test-name')).to.equal('test-name');
    });
  });

  describe('validateSessionsSecret()', () => {
    it('should throw an ReferenceError if no value is specified', () => {
      expect(() => validateSessionsSecret()).to.throw(ReferenceError, 'Session secret is missing (sessions.secret)');
    });

    it('should throw a TypeError if the value is not a string', () => {
      expect(() => validateSessionsSecret([])).to.throw(TypeError, 'Session secret must be a string (sessions.secret)');
    });

    it('should return a valid value', () => {
      expect(validateSessionsSecret('test-secret')).to.equal('test-secret');
    });
  });

  describe('validateSessionsSecure()', () => {
    it('should throw an ReferenceError if no value is specified', () => {
      expect(() => validateSessionsSecure()).to.throw(ReferenceError, 'Session secure flag is missing (sessions.secure)');
    });

    it('should throw a TypeError if the value is not a string', () => {
      expect(() => validateSessionsSecure([])).to.throw(TypeError, 'Session secure flag must be boolean (sessions.secure)');
    });

    it('should return a valid value', () => {
      expect(validateSessionsSecure(false)).to.equal(false);
    });
  });

  describe('validateSessionsStore()', () => {
    it('should return null if no store is specified', () => {
      expect(validateSessionsStore()).to.equal(null);
    });

    it('should return a valid value', () => {
      const testStore = () => {};
      expect(validateSessionsStore(testStore)).to.equal(testStore);
    });
  });

  describe('validateSessionsTtl()', () => {
    it('should throw an ReferenceError if no value is specified', () => {
      expect(() => validateSessionsTtl()).to.throw(ReferenceError, 'Session ttl is missing (sessions.ttl)');
    });

    it('should throw a TypeError if the value is not an integer', () => {
      expect(() => validateSessionsTtl([])).to.throw(TypeError, 'Session ttl must be an integer (sessions.ttl)');
    });

    it('should return a valid value', () => {
      expect(validateSessionsTtl(3600)).to.equal(3600);
    });
  });

  describe('validateViewsObject()', () => {
    it('should throw a TypeError when not given an object', () => {
      expect(() => validateViewsObject()).to.throw(TypeError, 'Views have not been specified');
    });

    it('should call the callback, passing a valid value, and return its result', () => {
      const stubCallback = sinon.stub().returns('test-response');
      const testInput = {};
      expect(validateViewsObject(testInput, stubCallback)).to.equal('test-response');
      expect(stubCallback).to.be.calledOnceWithExactly(testInput);
    });
  });

  describe('validateViewsDirs()', () => {
    it('should throw an Error if no value is specified', () => {
      expect(() => validateViewsDirs()).to.throw(ReferenceError, 'View directories are missing (views.dirs)');
    });

    it('should throw an Error if the value is not an Array', () => {
      expect(() => validateViewsDirs('not an array')).to.throw(TypeError, 'View directories must be an array (views.dirs)');
    });

    it('should return a valid value', () => {
      const testDirs = ['my/view-directory'];
      expect(validateViewsDirs(testDirs)).to.eql(['my/view-directory'])
    });
  });
});
