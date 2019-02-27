const fs = require('fs');
const npath = require('path');
const logger = require('./Logger')('i18n');

/**
 * Convenience wrapper to test if property is present on object
 *
 * @param {object} obj Object
 * @param {string} property Name of property
 * @returns {boolean} Whether property exists on the object or not
 */
function hasOwnProperty(obj, property) {
  return Object.prototype.hasOwnProperty.call(obj, property);
}

/**
 * Casa
 */
class Casa {
  /**
   * @param {express} expressApp The express app instance delivering the CASA app
   * @param {router} expressRouter The router on which all pages will be mounted
   */
  constructor(expressApp, expressRouter) {
    if (typeof expressApp === 'undefined') {
      throw new TypeError('Missing parameter, expressApp');
    }
    if (typeof expressRouter === 'undefined') {
      throw new TypeError('Missing parameter, expressRouter');
    }

    this.config = {};
    this.expressApp = expressApp;
    this.expressRouter = expressRouter;
  }

  /**
   * Retrieve the loaded config.
   * @returns {object} The configuration object
   */
  getConfig() {
    return this.config;
  }

  /**
   * @param {object} cfg Configuration
   * @returns {void}
   * @throws Error When any config settings are invalid
   */
  loadConfig(cfg) {
    this.config = cfg;
    const { config } = this;

    // function mountController
    // Additional middleware handler
    if (!['undefined', 'function'].includes(typeof config.mountController)) {
      throw new Error('Additional mount controller must be a function');
    } else if (typeof config.mountController === 'function' && !hasOwnProperty(config.mountController, 'prototype')) {
      throw new Error('Additional mount controller must not be arrow function or already bound');
    }

    // string mountUrl
    // The base URL of the application. Use this is app runs on subdirectory.
    if (!hasOwnProperty(config, 'mountUrl')) {
      config.mountUrl = '/';
    } else if (!config.mountUrl.match(/\/$/)) {
      throw new Error('Mount URL must include a trailing slash (/)');
    }

    // object views {
    //   array dirs
    // }
    // List of directories to scan for HTML Nunjucks templates
    if (
      !hasOwnProperty(config, 'views')
      || !hasOwnProperty(config.views, 'dirs')
    ) {
      throw new Error('View template paths have are undefined (views.dirs)');
    } else if (!Array.isArray(config.views.dirs)) {
      throw new Error('View template paths must be an array (views.dirs)');
    }

    // string compiledAssetsDir
    // Path to the directory that will hold all dynamically compiled assets
    if (!hasOwnProperty(config, 'compiledAssetsDir')) {
      throw new Error('Compiled assets directory required (compiledAssetsDir)');
    } else {
      const cad = npath.resolve(config.compiledAssetsDir);
      try {
        /* eslint-disable no-bitwise */
        fs.accessSync(
          cad,
          (fs.constants || fs).F_OK | (fs.constants || fs).R_OK | (fs.constants || fs).W_OK,
        );
      } catch (err) {
        if (err.code === 'ENOENT') {
          throw new Error('Compiled assets directory missing (compiledAssetsDir)');
        } else {
          throw err;
        }
      }
    }

    // string phase
    // Which phase the application is in.
    if (!hasOwnProperty(config, 'phase')) {
      config.phase = 'live';
    } else if (['alpha', 'beta', 'live'].indexOf(config.phase) === -1) {
      throw new Error('Invalid phase descriptor (phase)');
    }

    // string serviceName
    // Service name (shown in header)
    if (!hasOwnProperty(config, 'serviceName')) {
      config.serviceName = '';
    }

    // object sessions {
    //   string secret,
    //   int ttl,
    //   string name,
    //   object store,
    //   bool secure,
    //   string cookiePath
    // }
    if (!hasOwnProperty(config, 'sessions')) {
      throw new Error('Missing sessions data (sessions)');
    } else if (!hasOwnProperty(config.sessions, 'secret')) {
      throw new Error('Session secret missing (sessions.secret)');
    } else if (!hasOwnProperty(config.sessions, 'ttl')) {
      throw new Error('Session TTL missing (sessions.ttl)');
    } else if (!hasOwnProperty(config.sessions, 'name')) {
      throw new Error('Session name missing (sessions.name)');
    } else if (!hasOwnProperty(config.sessions, 'secure')) {
      throw new Error('Session security missing (sessions.secure)');
    }
    if (!hasOwnProperty(config.sessions, 'store')) {
      logger.warn('Using MemoryStore session storage, which is not suitable for production');
      config.sessions.store = null;
    }
    if (!hasOwnProperty(config.sessions, 'cookiePath')) {
      config.sessions.cookiePath = config.mountUrl;
    }

    // object i18n {
    //   array dirs,
    //   array locales
    // }
    if (!hasOwnProperty(config, 'i18n')) {
      config.i18n = {
        dirs: [],
        locales: ['en'],
      };
    }

    // object csp {
    //   <directive>: array
    // }
    if (hasOwnProperty(config, 'csp')) {
      const { csp } = config;
      const validCspDirectives = [
        'child-src',
        'connect-src',
        'default-src',
        'font-src',
        'frame-src',
        'img-src',
        'manifest-src',
        'media-src',
        'object-src',
        'script-src',
        'style-src',
        'worker-src',
        'base-uri',
        'plugin-types',
        'sandbox',
        'form-action',
        'frame-ancestors',
        'block-all-mixed-content',
        'require-sri-for',
        'upgrade-insecure-requests',
        'scriptSources',
      ];
      const directives = Object.getOwnPropertyNames(config.csp);

      // Only allow use of scriptSources for backwards compatibility -
      // do not mix with other directives
      if (directives.indexOf('scriptSources') !== -1 && directives.length > 1) {
        throw new Error('Use of CSP scriptSources is included for backwards'
          + 'compatibility and should not be used with other CSP directives, '
          + 'if using as part of a wider policy then please use \'script-src\' '
          + 'instead of \'scriptSources\'');
      }

      if (hasOwnProperty(csp, 'scriptSources')) {
        csp['script-src'] = csp.scriptSources;
        delete csp.scriptSources;
      }

      directives.forEach((directive) => {
        if (validCspDirectives.indexOf(directive) === -1) {
          throw new Error(`Invalid CSP directive specified: ${directive}`);
        }
      });
    }

    // object headers {
    //   array disabled
    // }
    if (
      !hasOwnProperty(config, 'headers')
      || !hasOwnProperty(config.headers, 'disabled')
    ) {
      config.headers = config.headers || {};
      config.headers.disabled = [];
    }

    // bool allowPageEdit
    if (!hasOwnProperty(config, 'allowPageEdit')) {
      config.allowPageEdit = false;
    }

    const jsonConfig = JSON.stringify(config, (k, v) => (['store', 'secret'].indexOf(k) > -1 ? '[NOT PARSED]' : v));
    logger.info(`Parsed config:${jsonConfig}`);
  }

  /**
   * Mount middleware common to all requests
   *
   * @param {function} expressSession Express session function to use
   * @param {function} expressStatic Static middleware
   * @param {I18n} I18nUtility Internationalisation library
   * @returns {void}
   */
  mountCommonExpressMiddleware(expressSession, expressStatic, I18nUtility) {
    /* eslint-disable import/no-dynamic-require, global-require */
    const { config } = this;

    const dirMiddleware = npath.resolve(__dirname, '../app/middleware');

    const staticModulePaths = {
      govukFrontend: Casa.resolveModulePath('govuk-frontend', module.paths),
      govukTemplateJinja: Casa.resolveModulePath('govuk_template_jinja', module.paths),
      govukCasa: npath.resolve(__dirname, '../'),
    };

    require(`${dirMiddleware}/headers.js`)(this.expressApp, config.csp, config.headers.disabled);
    require(`${dirMiddleware}/mount.js`)(this.expressApp, config.mountUrl);
    require(`${dirMiddleware}/static.js`)(
      this.expressApp,
      expressStatic,
      config.mountUrl,
      config.compiledAssetsDir,
      staticModulePaths,
    );
    require(`${dirMiddleware}/session.js`)(
      this.expressApp,
      expressSession,
      config.mountUrl,
      {
        secure: config.sessions.secure,
        store: config.sessions.store,
        name: config.sessions.name,
        secret: config.sessions.secret,
        cookiePath: config.sessions.cookiePath,
        ttl: config.sessions.ttl,
      },
    );
    require(`${dirMiddleware}/nunjucks.js`)(this.expressApp, config.views.dirs, `${staticModulePaths.govukFrontend}/template.njk`);
    require(`${dirMiddleware}/i18n.js`)(this.expressApp, config.i18n.locales, I18nUtility);
    require(`${dirMiddleware}/variables.js`)(this.expressApp, config.mountUrl, config.phase, config.serviceName);
  }

  /**
   * Mount journey-based middleware
   *
   * @param {function} csrfMiddleware CSRF middleware function
   * @param {PageDirectory} pageDirectory Page directory
   * @param {UserJourney} journey User Journey
   * @returns {void}
   */
  mountJourneyExpressMiddleware(csrfMiddleware, pageDirectory, journey) {
    /* eslint-disable import/no-dynamic-require, global-require */
    const { config } = this;
    const dirMiddleware = npath.resolve(__dirname, '../app/middleware');
    const dirRoutes = npath.resolve(__dirname, '../app/routes');

    require(`${dirRoutes}/session-timeout.js`)(this.expressRouter, config.sessions.ttl);
    require(`${dirMiddleware}/journey.js`)(this.expressRouter, config.mountUrl, journey);
    require(`${dirRoutes}/pages.js`)(config.mountUrl, this.expressRouter, csrfMiddleware, pageDirectory, journey, config.allowPageEdit);
    require(`${dirMiddleware}/errors.js`)(this.expressApp);
  }

  /**
   * Discover the root folder of the specified npm module.
   *
   * @param {string} module Name of npm module to go and find
   * @param {array} paths Paths to search on for module folder
   * @returns {string} The absolute path to the named module, if found
   * @throws Error When the module cannot be found
   * @throws SyntaxError When the module name contains invalid characters
   */
  static resolveModulePath(module = '', paths = []) {
    // Strip rogue chars from module name; only valid npm package names are
    // expected (https://docs.npmjs.com/files/package.json#name)
    const modName = module.replace(/[^a-z0-9\-_.]/ig, '').replace(/\.+/i, '.');
    if (modName !== module) {
      throw new SyntaxError('Module name contains invalid characters');
    }

    // Look for the module in the same places node would
    const resolved = paths.filter(p => fs.existsSync(npath.normalize(`${p}/${modName}`)));
    if (resolved.length) {
      return npath.normalize(`${resolved[0]}/${modName}`);
    }
    throw new Error(`Cannot resolve module '${module}'`);
  }
}

module.exports = Casa;
