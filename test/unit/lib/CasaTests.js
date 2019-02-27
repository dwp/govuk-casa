/**
 * Test that node modules are resolved correctly in a variety of scenarios.
 *
 * Ref: govuk-casa/issues/31
 */

const npath = require('path');
const fs = require('fs-extra');
const os = require('os');
const { EventEmitter } = require('events');

const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const Casa = require('../../../lib/Casa');

describe('Casa', () => {
  const validConfig = {
    mountController: function mountController() {},
    mountUrl: '/',
    views: {
      dirs: [],
    },
    compiledAssetsDir: npath.resolve(__dirname, '../testdata'),
    phase: 'alpha',
    serviceName: 'My Test Service',
    sessions: {
      secret: 'my-secret',
      ttl: 3600,
      name: 'session',
      store: null,
      secure: false,
      cookiePath: '/',
    },
    i18n: {
      dirs: [],
      locales: ['en'],
    },
    csp: {
      scriptSources: [],
    },
    headers: {
      disabled: false,
    },
    allowPageEdit: false,
  };

  describe('constructor()', () => {
    it('should throw a TypeError if any parameters are missing', () => {
      expect(() => new Casa()).to.throw(TypeError);

      expect(() => new Casa({})).to.throw(TypeError);
    });
  });

  describe('getConfig() / loadConfig()', () => {
    let casa;
    let config;

    beforeEach(() => {
      casa = new Casa(null, null);
      config = JSON.parse(JSON.stringify(validConfig));
    });

    describe('getConfig()', () => {
      it('should return an empty object before any configuration has loaded', () => {
        expect(casa.getConfig()).to.be.an('object');
        expect(casa.getConfig()).to.eql({});
      });

      it('should return the loaded config', () => {
        casa.loadConfig(config);
        expect(casa.getConfig()).to.eql(config);
      });
    });

    describe('mountController', () => {
      it('should be optional if undefined', () => {
        config.mountController = undefined;
        casa.loadConfig(config);
        expect(casa.getConfig().mountController).to.equal(undefined);
      });

      it('should store a valid value (optional)', () => {
        config.mountController = undefined;
        casa.loadConfig(config);
        expect(casa.getConfig().mountController).to.equal(undefined);
      });

      it('should store a valid value (function)', () => {
        config.mountController = function mountController() {
          return 'Hello world';
        };

        casa.loadConfig(config);
        expect(casa.getConfig().mountController).to.be.instanceOf(Function);
      });

      it('should throw an Error if not a function nor undefined', () => {
        expect(() => {
          config.mountController = false;
          casa.loadConfig(config);
        }).to.throw(Error);
      });

      it('should throw an error if mountController is already bound', () => {
        expect(() => {
          config.mountController = (function mountController() {
            return 'Hello world';
          }).bind('something', 'else');

          casa.loadConfig(config);
        }).to.throw(Error);
      });

      it('should throw an error if mountController is an arrow function', () => {
        expect(() => {
          config.mountController = () => 'Hello world';
          casa.loadConfig(config);
        }).to.throw(Error);
      });
    });

    describe('mountUrl', () => {
      it('should default to / when a value is not specified', () => {
        delete config.mountUrl;
        casa.loadConfig(config);
        expect(casa.getConfig().mountUrl).to.equal('/');
      });

      it('should throw an Error if a trailing slash is missing', () => {
        expect(() => {
          config.mountUrl = '/missing-trailing-slash';
          casa.loadConfig(config);
        }).to.throw(Error);
      });

      it('should store a valid value', () => {
        config.mountUrl = '/this-is/my/mount-url/';
        casa.loadConfig(config);
        expect(casa.getConfig().mountUrl).to.equal('/this-is/my/mount-url/');
      });
    });

    describe('views', () => {
      describe('dirs', () => {
        it('should throw an Error if no value is specified', () => {
          expect(() => {
            delete config.views;
            casa.loadConfig(config);
          }).to.throw(Error);
        });

        it('should throw an Error if the value is not an Array', () => {
          expect(() => {
            config.views.dirs = 'not an array';
            casa.loadConfig(config);
          }).to.throw(Error);
        });

        it('should store a valid value', () => {
          config.views.dirs = ['my/view-directory'];
          casa.loadConfig(config);
          expect(casa.getConfig().views.dirs).to.eql(['my/view-directory'])
        });
      });
    });

    describe('compiledAssetsDir', () => {
      // If these tests are being run as root, these tests will fail because
      // root cannot be restricted (simply) in accessing the assets folder
      const itf = os.userInfo().username === 'root' ? it.skip : it;

      itf('should throw an Error if no value is specified', () => {
        expect(() => {
          delete config.compiledAssetsDir;
          casa.loadConfig(config);
        }).to.throw(Error);
      });

      itf('should throw an Error if the directory does not exist', () => {
        expect(() => {
          config.compiledAssetsDir = '/a/non-existent/directory';
          casa.loadConfig(config);
        }).to.throw(Error);
      });

      itf('should throw an Error if the directory is not readable', () => {
        const unreadableDir = fs.mkdtempSync(npath.join(os.tmpdir(), 'casa-'));
        fs.chmodSync(unreadableDir, 0o200);
        expect(() => {
          config.compiledAssetsDir = unreadableDir;
          casa.loadConfig(config);
        }).to.throw(Error).with.property('code', 'EACCES');
      });

      itf('should throw an Error if the directory is not writeable', () => {
        const unwriteableDir = fs.mkdtempSync(npath.join(os.tmpdir(), 'casa-'));
        fs.chmodSync(unwriteableDir, 0o100);
        expect(() => {
          config.compiledAssetsDir = unwriteableDir;
          casa.loadConfig(config);
        }).to.throw(Error).with.property('code', 'EACCES');
      });

      it('should store a valid value', () => {
        const validDir = fs.mkdtempSync(npath.join(os.tmpdir(), 'casa-'));
        fs.chmodSync(validDir, 0o600);
        config.compiledAssetsDir = validDir;
        casa.loadConfig(config);
        expect(casa.getConfig().compiledAssetsDir).to.equal(validDir);
      });
    });

    describe('phase', () => {
      it('should default to live if no value is specified', () => {
        delete config.phase;
        casa.loadConfig(config);
        expect(casa.getConfig().phase).to.equal('live');
      });

      it('should throw an Error if the value is not a valid phase', () => {
        expect(() => {
          config.phase = 'LIVE';
          casa.loadConfig(config);
        }).to.throw(Error);

        expect(() => {
          config.phase = 'monkey';
          casa.loadConfig(config);
        }).to.throw(Error);
      });

      it('should store a valid value', () => {
        config.phase = 'alpha';
        casa.loadConfig(config);
        expect(casa.getConfig().phase).to.equal('alpha');
      });
    });

    describe('serviceName', () => {
      it('should default to an empty string if no value is specified', () => {
        delete config.serviceName;
        casa.loadConfig(config);
        expect(casa.getConfig().serviceName).to.equal('');
      });

      it('should store a valid value', () => {
        config.serviceName = 'MY SERVICE';
        casa.loadConfig(config);
        expect(casa.getConfig().serviceName).to.equal('MY SERVICE');
      })
    });

    describe('sessions', () => {
      it('should throw an Error if missing a value', () => {
        expect(() => {
          delete config.sessions;
          casa.loadConfig(config);
        }).to.throw(Error);
      });

      it('should throw an Error if missing a secret value', () => {
        expect(() => {
          delete config.sessions.secret;
          casa.loadConfig(config);
        }).to.throw(Error);
      });

      it('should throw an Error if missing a ttl value', () => {
        expect(() => {
          delete config.sessions.ttl;
          casa.loadConfig(config);
        }).to.throw(Error);
      });

      it('should throw an Error if missing a name value', () => {
        expect(() => {
          delete config.sessions.name;
          casa.loadConfig(config);
        }).to.throw(Error);
      });

      it('should default to a null session store if missing a store value (defaults to MemoryStore)', () => {
        expect(() => {
          delete config.sessions.store;
          casa.loadConfig(config);
        }).to.not.throw(Error);
        expect(config.sessions.store).to.equal(null);
      });

      it('should throw an Error if missing a secure value', () => {
        expect(() => {
          delete config.sessions.secure;
          casa.loadConfig(config);
        }).to.throw(Error);
      });

      it('should use the mountUrl as the cookiePath is no other value is specified', () => {
        delete config.sessions.cookiePath;
        casa.loadConfig(config);
        expect(casa.getConfig().sessions.cookiePath).to.equal(config.mountUrl);
      });

      it('should use the mountUrl as the cookiePath is no other value is specified, and session store is undefined (bugfix)', () => {
        delete config.sessions.store;
        delete config.sessions.cookiePath;
        casa.loadConfig(config);
        expect(config.sessions.cookiePath).to.equal(config.mountUrl);
      });
    });

    describe('i18n', () => {
      it('should default to en language if no value is specified', () => {
        delete config.i18n;
        casa.loadConfig(config);
        expect(casa.getConfig().i18n.locales).to.eql(['en']);
      });
    });

    describe('csp', () => {
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
        };
        config.csp = csp;
        casa.loadConfig(config);
        expect(casa.getConfig().csp).to.equal(csp);
      });

      it('should throw an error if an invalid content secure policy is provided', () => {
        expect(() => {
          config.csp = {
            'invalid-csp-directive': [],
          }
          casa.loadConfig(config)
        }).to.throw(Error);
      });

      it('should allow scriptSources as a valid CSP directive', () => {
        const csp = {
          scriptSources: [],
        };
        config.csp = csp;
        casa.loadConfig(config);
        expect(casa.getConfig().csp).to.equal(csp);
      });

      it('should throw an error if scriptSources is defined with any other directive', () => {
        expect(() => {
          config.csp = {
            scriptSources: [],
            'script-src': [],
          }
          casa.loadConfig(config);
        }).to.throw(Error);
      });
    });

    describe('headers', () => {
      it('should default to an empty list of disabled headers if no value is specified', () => {
        delete config.headers;
        casa.loadConfig(config);
        expect(casa.getConfig().headers).to.eql({ disabled: [] });
      });
    });

    describe('allowPageEdit', () => {
      it('should default to disallowing page edits if no value is specified', () => {
        delete config.allowPageEdit;
        casa.loadConfig(config);
        expect(casa.getConfig().allowPageEdit).to.equal(false);
      });
    });
  });

  describe('mountCommonExpressMiddleware()', () => {
    let casa;
    let requireWatcher;

    beforeEach(() => {
      requireWatcher = new EventEmitter();
      /* eslint-disable-next-line require-jsdoc */
      function emitter() {
        requireWatcher.emit(this.moduleName, this.moduleName);
      }

      const dirMiddleware = npath.resolve(__dirname, '../../../app/middleware');
      const proxies = {};
      ['headers', 'mount', 'static', 'session', 'nunjucks', 'i18n', 'variables'].forEach((m) => {
        proxies[`${dirMiddleware}/${m}.js`] = emitter.bind({ moduleName: m });
      });
      const CasaProxy = proxyquire('../../../lib/Casa', proxies);

      casa = new CasaProxy(null, null);
      casa.loadConfig(validConfig);
      sinon.stub(CasaProxy, 'resolveModulePath').returns(npath.resolve(__dirname, '../testdata/fake-node_modules'));
    });

    it('should import middleware in the correct order', () => {
      const sequence = [];
      /* eslint-disable-next-line require-jsdoc */
      const sequencer = (m) => {
        sequence.push(m)
      };
      const moduleOrder = ['headers', 'mount', 'static', 'session', 'nunjucks', 'i18n', 'variables'];
      moduleOrder.forEach((m) => {
        requireWatcher.on(m, sequencer);
      });
      casa.mountCommonExpressMiddleware(null, null, null);
      expect(sequence).to.eql(moduleOrder);
    });
  });

  describe('mountJourneyExpressMiddleware()', () => {
    let casa;
    let requireWatcher;

    beforeEach(() => {
      requireWatcher = new EventEmitter();
      /* eslint-disable-next-line require-jsdoc */
      function emitter() {
        requireWatcher.emit(this.moduleName, this.moduleName);
      }

      const dirMiddleware = npath.resolve(__dirname, '../../../app/middleware');
      const dirRoutes = npath.resolve(__dirname, '../../../app/routes');
      const proxies = {};
      ['session-timeout', 'pages'].forEach((m) => {
        proxies[`${dirRoutes}/${m}.js`] = emitter.bind({ moduleName: m });
      });
      ['journey', 'errors'].forEach((m) => {
        proxies[`${dirMiddleware}/${m}.js`] = emitter.bind({ moduleName: m });
      });
      const CasaProxy = proxyquire('../../../lib/Casa', proxies);

      casa = new CasaProxy(null, null);
      casa.loadConfig(validConfig);
      sinon.stub(CasaProxy, 'resolveModulePath').returns(npath.resolve(__dirname, '../testdata/fake-node_modules'));
    });

    it('should import middleware in the correct order', () => {
      const sequence = [];
      /* eslint-disable-next-line require-jsdoc */
      const sequencer = (m) => {
        sequence.push(m)
      };
      const moduleOrder = ['session-timeout', 'journey', 'pages', 'errors'];
      moduleOrder.forEach((m) => {
        requireWatcher.on(m, sequencer);
      });
      casa.mountJourneyExpressMiddleware(null, null, null);
      expect(sequence).to.eql(moduleOrder);
    });
  })

  describe('resolveModulePath()', () => {
    it('should return the absolute path of a module that exists on one of the specified paths', () => {
      const path0 = npath.resolve(__dirname, '../testdata/fake-node_modules');
      let modAPath;

      modAPath = Casa.resolveModulePath('govuk_template_jinja', [path0]);
      expect(modAPath).to.equal(npath.normalize(`${path0}/govuk_template_jinja`));

      modAPath = Casa.resolveModulePath('govuk_template_jinja', ['/non-existent-path', path0]);
      expect(modAPath).to.equal(npath.normalize(`${path0}/govuk_template_jinja`));
    });

    it('should throw an Error if the module is not found on any of the paths', () => {
      const path0 = npath.resolve(__dirname, '../testdata/fake-node_modules');
      expect(() => {
        Casa.resolveModulePath('non-existent-module', [path0]);
      }).to.throw(Error, "Cannot resolve module 'non-existent-module'");
    });

    it('should throw a SyntaxError when the module name contains invalid characters', () => {
      expect(() => {
        Casa.resolveModulePath('/invalid...module@name', []);
      }).to.throw(SyntaxError);
    });
  })
});
