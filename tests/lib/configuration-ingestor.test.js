import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chai, { expect } from 'chai';
import { CONFIG_ERROR_VISIBILITY_ONSUBMIT, CONFIG_ERROR_VISIBILITY_ALWAYS } from '../../src/lib/constants.js';

import ingest, {
  validateMountUrl,
  validateI18nObject,
  validateI18nDirs,
  validateI18nLocales,
  validateSessionObject,
  validateSessionCookiePath,
  validateSessionCookieSameSite,
  validateSessionName,
  validateSessionSecret,
  validateSessionSecure,
  validateSessionStore,
  validateSessionTtl,
  validateViews,
  validatePages,
  validatePlan,
  validateGlobalHooks,
  validateFormMaxParams,
  validateFormMaxBytes,
  validateErrorVisibility,
} from '../../src/lib/configuration-ingestor.js';

chai.use(sinonChai);

const minimalConfig = {
  i18n: {
    dirs: [],
    locales: [],
  },
  session: {
    name: 'session-name',
    secret: 'secret',
    secure: false,
    ttl: 3600,
    cookieSameSite: 'Strict',
    cookiePath: '/',
  },
  views: [],
  pages: [],
};

describe('ConfigIngestor', () => {
  describe('ingest()', () => {
    it('should be a function', () => {
      expect(ingest).to.be.a('function');
    });

    it('should throw an Error when given invalid configuration', () => {
      expect(() => ingest()).to.throw();
    });

    it('should return an immutable object when given valid configuration', () => {
      const config = ingest(minimalConfig);

      return expect(Object.isFrozen(config)).to.be.true;
    });

    it('should contain the expected defaults', () => {
      const config = ingest(minimalConfig);

      expect(config.session.cookieSameSite).to.equal('Strict');
    });
  });

  describe('validateMountUrl()', () => {
    it('defaults to undefined', () => {
      expect(validateMountUrl()).to.be.undefined;
    });

    it('throws if a trailing / is missing', () => {
      expect(() => validateMountUrl('/missing-slash')).to.throw(SyntaxError, 'mountUrl must include a trailing slash (/)')
    });
  });

  describe('validateI18nObject()', () => {
    it('should call the callback, passing a valid value, and return its result', () => {
      const stubCallback = sinon.stub().returns('test-response');
      const testInput = {};
      expect(validateI18nObject(testInput, stubCallback)).to.equal('test-response');
      expect(stubCallback).to.be.calledOnceWithExactly(testInput);
    });
  });

  describe('validateI18nDirs()', () => {
    it('should throw an Error if the value is not an Array', () => {
      expect(() => validateI18nDirs('not an array')).to.throw(TypeError, 'I18n directories must be an array (i18n.dirs)');
    });

    it('should return a valid value', () => {
      const testDirs = ['my/i18n-directory'];
      expect(validateI18nDirs(testDirs)).to.eql(['my/i18n-directory'])
    });
  });

  describe('validateI18nLocales()', () => {
    it('should throw an Error if the value is not an Array', () => {
      expect(() => validateI18nLocales('not an array')).to.throw(TypeError, 'I18n locales must be an array (i18n.locales)');
    });

    it('should return a valid value', () => {
      const testLocales = ['en', 'cy'];
      expect(validateI18nLocales(testLocales)).to.equal(testLocales);
    });
  });

  describe('validateSessionObject()', () => {
    it('should call the callback, passing a valid value, and return its result', () => {
      const stubCallback = sinon.stub().returns('test-response');
      const testInput = {};
      expect(validateSessionObject(testInput, stubCallback)).to.equal('test-response');
      expect(stubCallback).to.be.calledOnceWithExactly(testInput);
    });
  });

  describe('validateSessionCookiePath()', () => {
    it('should the default value if no value is specified', () => {
      expect(validateSessionCookiePath(undefined, '/default/')).to.equal('/default/');
    });

    it('should return a valid value', () => {
      expect(validateSessionCookiePath('test-path')).to.equal('test-path');
    });
  });

  describe('validateSessionCookieSameSite()', () => {
    it('should throw if a default flag value is not provided', () => {
      expect(() => validateSessionCookieSameSite(undefined)).to.throw(TypeError, 'validateSessionCookieSameSite() requires an explicit default flag');
      expect(() => validateSessionCookieSameSite(undefined, 'Lax')).to.not.throw();
    });

    it('should throw if an invalid default flag is provided', () => {
      const err = 'validateSessionCookieSameSite() default flag must be set to one of true, false, Strict, Lax or None (session.cookieSameSite)';
      expect(() => validateSessionCookieSameSite('Strict', 'BadValue')).to.throw(TypeError, err);
      expect(() => validateSessionCookieSameSite('Strict', [])).to.throw(TypeError, err);
      expect(() => validateSessionCookieSameSite('Strict', 'Lax')).to.not.throw();
    });

    it('should throw if not provided with a valid value', () => {
      const err = 'SameSite flag must be set to one of true, false, Strict, Lax or None (session.cookieSameSite)';
      expect(() => validateSessionCookieSameSite('BadValue', false)).to.throw(TypeError, err);
      expect(() => validateSessionCookieSameSite([], false)).to.throw(TypeError, err);
      expect(() => validateSessionCookieSameSite(false, 'Lax')).to.not.throw();
    });

    it('should return a valid provided value', () => {
      expect(validateSessionCookieSameSite('Strict', false)).to.equal('Strict');
      expect(validateSessionCookieSameSite('Lax', false)).to.equal('Lax');
      expect(validateSessionCookieSameSite('None', false)).to.equal('None');
      expect(validateSessionCookieSameSite(false, true)).to.equal(false);
      expect(validateSessionCookieSameSite(true, false)).to.equal(true);
    });

    it('should return a default flag if none provided', () => {
      expect(validateSessionCookieSameSite(undefined, 'Lax')).to.equal('Lax');
    });
  });

  describe('validateSessionName()', () => {
    it('should throw a TypeError if the value is not a string', () => {
      expect(() => validateSessionName([])).to.throw(TypeError, 'Session name must be a string (session.name)');
    });

    it('should return a valid value', () => {
      expect(validateSessionName('test-name')).to.equal('test-name');
    });
  });

  describe('validateSessionSecret()', () => {
    it('should throw an ReferenceError if no value is specified', () => {
      expect(() => validateSessionSecret()).to.throw(ReferenceError, 'Session secret is missing (session.secret)');
    });

    it('should throw a TypeError if the value is not a string', () => {
      expect(() => validateSessionSecret([])).to.throw(TypeError, 'Session secret must be a string (session.secret)');
    });

    it('should return a valid value', () => {
      expect(validateSessionSecret('test-secret')).to.equal('test-secret');
    });
  });

  describe('validateSessionSecure()', () => {
    it('should throw an Error if the value is not defined', () => {
      expect(() => validateSessionSecure()).to.throw(Error, 'Session secure flag must be explicitly defined (session.secure)');
    });

    it('should throw a TypeError if the value is not a string', () => {
      expect(() => validateSessionSecure([])).to.throw(TypeError, 'Session secure flag must be boolean (session.secure)');
    });

    it('should return a valid value', () => {
      expect(validateSessionSecure(false)).to.equal(false);
      expect(validateSessionSecure(true)).to.equal(true);
    });
  });

  describe('validateSessionStore()', () => {
    it('should return null if no store is specified', () => {
      expect(validateSessionStore()).to.equal(null);
    });

    it('should return a valid value', () => {
      const testStore = () => {};
      expect(validateSessionStore(testStore)).to.equal(testStore);
    });
  });

  describe('validateSessionTtl()', () => {
    it('should throw a TypeError if the value is not an integer', () => {
      expect(() => validateSessionTtl([])).to.throw(TypeError, 'Session ttl must be an integer (session.ttl)');
    });

    it('should return a valid value', () => {
      expect(validateSessionTtl(3600)).to.equal(3600);
    });
  });

  describe('validateViews()', () => {
    it('should throw an Error if the value is not an Array', () => {
      expect(() => validateViews('not an array')).to.throw(TypeError, 'View directories must be an array (views)');
    });

    it('should return a valid value', () => {
      const testDirs = ['my/view-directory'];
      expect(validateViews(testDirs)).to.eql(['my/view-directory'])
    });
  });

  describe('validatePages', () => {
    it('does not throw, given valid pages', () => {
      expect(() => validatePages([{
        waypoint: 'test',
        view: 'test.njk',
      }])).to.not.throw();

      expect(() => validatePages([{
        waypoint: 'test',
        view: 'test.njk',
        hooks: [{
          hook: 'prerender',
          middleware: () => {},
        }],
        fields: [],
      }])).to.not.throw();
    });

    it('throws if not an array', () => {
      expect(() => validatePages(null)).to.throw(TypeError, 'Pages must be an array (pages)');
    });

    it('throws if waypoint is invalid', () => {
      expect(() => validatePages([{
        waypoint: false,
      }])).to.throw(TypeError, 'Page at index 0 is invalid: Waypoint must be a string');

      expect(() => validatePages([{
        waypoint: '',
      }])).to.throw(SyntaxError, 'Page at index 0 is invalid: Waypoint must not be empty');

      expect(() => validatePages([{
        waypoint: '$',
      }])).to.throw(SyntaxError, 'Page at index 0 is invalid: Waypoint must contain only a-z, 0-9, -, _ and / characters');
    });

    it('throws if view is invalid', () => {
      expect(() => validatePages([{
        waypoint: 'test',
        view: false,
      }])).to.throw(TypeError, 'Page at index 0 is invalid: View must be a string');

      expect(() => validatePages([{
        waypoint: 'test',
        view: '',
      }])).to.throw(SyntaxError, 'Page at index 0 is invalid: View must not be empty');

      expect(() => validatePages([{
        waypoint: 'test',
        view: '$',
      }])).to.throw(SyntaxError, 'View must contain only a-z, 0-9, -, _ and / characters, and end in .njk');
    });

    describe('hooks', () => {
      it('throws if hooks are invalid', () => {
        expect(() => validatePages([{
          waypoint: 'test',
          view: 'test.njk',
          hooks: false,
        }])).to.throw(TypeError, 'Page at index 0 is invalid: Hooks must be an array');
      });

      it('throws if hook name is invalid', () => {
        expect(() => validatePages([{
          waypoint: 'test',
          view: 'test.njk',
          hooks: [{
            hook: false,
          }],
        }])).to.throw(TypeError, 'Page hook at index 0 is invalid: Hook name must be a string');

        expect(() => validatePages([{
          waypoint: 'test',
          view: 'test.njk',
          hooks: [{
            hook: '',
          }],
        }])).to.throw(SyntaxError, 'Page hook at index 0 is invalid: Hook name must not be empty');

        expect(() => validatePages([{
          waypoint: 'test',
          view: 'test.njk',
          hooks: [{
            hook: '.bad-format',
          }],
        }])).to.throw(SyntaxError, 'Page hook at index 0 is invalid: Hook name must match either <scope>.<hookname> or <hookname> formats');
      });
    });

    describe('field', () => {
      it('throws if fields are invalid', () => {
        expect(() => validatePages([{
          waypoint: 'test',
          view: 'test.njk',
          fields: false,
        }])).to.throw(TypeError, 'Page at index 0 is invalid: Page fields must be an array (page[].fields)');

        expect(() => validatePages([{
          waypoint: 'test',
          view: 'test.njk',
          fields: [{}],
        }])).to.throw(TypeError, 'Page at index 0 is invalid: Page field at index 0 is invalid: Page field must be an instance of PageField (created via the "field()" function)');
      });
    });
  });

  describe('validatePlan', () => {
    it('throws if not an instance of the Plan class', () => {
      expect(() => validatePlan(false)).to.throw(TypeError, 'Plan must be an instance the Plan class (plan)');
    });
  });

  describe('validateGlobalHooks()', () => {
    it('throws if not an array', () => {
      expect(() => validateGlobalHooks(false)).to.throw(TypeError, 'Hooks must be an array');
    });

    it('throws if hook name is invalid', () => {
      expect(() => validateGlobalHooks([{
        hook: false,
      }])).to.throw(TypeError, 'Global hook at index 0 is invalid: Hook name must be a string');

      expect(() => validateGlobalHooks([{
        hook: '',
      }])).to.throw(SyntaxError, 'Global hook at index 0 is invalid: Hook name must not be empty');

      expect(() => validateGlobalHooks([{
        hook: '.bad-format',
      }])).to.throw(SyntaxError, 'Global hook at index 0 is invalid: Hook name must match either <scope>.<hookname> or <hookname> formats');
    });

    it('throws if middleware is invalid', () => {
      expect(() => validateGlobalHooks([{
        hook: 'name',
        middleware: false,
      }])).to.throw(TypeError, 'Global hook at index 0 is invalid: Hook middleware must be a function');
    });

    it('throws if path is invalid', () => {
      expect(() => validateGlobalHooks([{
        hook: 'name',
        middleware: () => {},
        path: false,
      }])).to.throw(TypeError, 'Global hook at index 0 is invalid: Hook path must be a string or RegExp');
    });
  });

  describe('validateFormMaxParams()', () => {
    it('throws if not an integer', () => {
      expect(() => validateFormMaxParams(false)).to.throw(TypeError, 'formMaxParams must be an integer');
      expect(() => validateFormMaxParams(1024.50)).to.throw(TypeError, 'formMaxParams must be an integer');
      expect(() => validateFormMaxParams(1024)).to.not.throw();
    });

    it('throws if below the minimum allowed value', () => {
      expect(() => validateFormMaxParams(9)).to.throw(RangeError, 'formMaxParams must be at least 10');
      expect(() => validateFormMaxParams(10)).to.not.throw();
    });

    it('ingests the configuration', () => {
      // Default value
      expect(ingest(minimalConfig)).to.contain({
        formMaxParams: 25,
      });

      // Custom value
      expect(ingest({
        ...minimalConfig,
        formMaxParams: 15,
      })).to.contain({
        formMaxParams: 15,
      });
    });
  });

  describe('validateFormMaxBytes()', () => {
    it('throws if not a string or integer', () => {
      expect(() => validateFormMaxBytes(false)).to.throw(TypeError, 'formMaxParams must be a string or an integer');
      expect(() => validateFormMaxBytes(1024)).to.not.throw();
      expect(() => validateFormMaxBytes('1kb')).to.not.throw();
    });

    it('throws if below the minimum allowed value', () => {
      expect(() => validateFormMaxBytes(1023)).to.throw(RangeError, 'formMaxBytes must be at least 1024 bytes (1KB)');
      expect(() => validateFormMaxBytes('1023b')).to.throw(RangeError, 'formMaxBytes must be at least 1024 bytes (1KB)');
    });

    it('ingests the configuration', () => {
      // Default value
      expect(ingest(minimalConfig)).to.contain({
        formMaxBytes: 1024 * 50,
      });

      // Custom value
      expect(ingest({
        ...minimalConfig,
        formMaxBytes: 2046,
      })).to.contain({
        formMaxBytes: 2046,
      });
    });
  });

  describe('validate global errorVisibility', () => {
    it('should be onsubmit as default value', () => {
      expect(validateErrorVisibility()).to.be.equal(CONFIG_ERROR_VISIBILITY_ONSUBMIT);
    });

    it('should return a valid value', () => {
      expect(validateErrorVisibility(CONFIG_ERROR_VISIBILITY_ALWAYS))
        .to.be.equal(CONFIG_ERROR_VISIBILITY_ALWAYS);
    });

    it('should accept function as valid type', () => {
      expect(validateErrorVisibility(() => true)).to.not.throw();
    });


    it('should throw an Error if the value is not constant or function', () => {
      expect(() => validateErrorVisibility('randome')).to.throw(TypeError, 'errorVisibility must be casa constant CONFIG_ERROR_VISIBILITY_ALWAYS | CONFIG_ERROR_VISIBILITY_ONSUBMIT or function');
    });

  });

  describe('validate page level errorVisibility', () => {
    it('should throw an Error if the errorVisibility value is not constant or function', () => {
      expect(() => validatePages([{
        waypoint: 'test',
        errorVisibility: 'random',
        view: 'test.njk',
      }])).to.throw(TypeError, 'Page at index 0 is invalid: errorVisibility must be casa constant CONFIG_ERROR_VISIBILITY_ALWAYS | CONFIG_ERROR_VISIBILITY_ONSUBMIT or function');
    });

    it('should not throw if errorVisibility has valid value', () => {
      expect(() => validatePages([{
        waypoint: 'test',
        errorVisibility: CONFIG_ERROR_VISIBILITY_ALWAYS,
        view: 'test.njk',
      }])).to.not.throw();

      expect(() => validatePages([{
        waypoint: 'test',
        errorVisibility: CONFIG_ERROR_VISIBILITY_ONSUBMIT,
        view: 'test.njk',
      }])).to.not.throw();

      expect(() => validatePages([{
        waypoint: 'test',
        errorVisibility: () => {},
        view: 'test.njk',
      }])).to.not.throw();
    });
  });
});


