/**
 * Configure GOVUK templates, and CASA static resources.
 *
 * CASA resources are compiled on-the-fly, stored in the specified
 * `compiledAssetsDir` directory and served from the `/govuk/casa/(css/js)/*`
 * folders.
 *
 * The `govuk_template_jinja` module provides the main Nunjucks templates, as
 * well as some static image/css/js assets. We point the virtual `/govuk/tpl/`
 * URL prefix to these assets.
 *
 * The `govuk_frontend_toolkit` modules provides some static image
 * assets. We point the virtual `/govuk/kit/images/` URL prefix to these. It
 * also provides some static JS assets, which are concatenated on-the-fly and
 * accessed via the `/govuk/kit/js/govuk_toolkit.js` URL.
 *
 * Mounted on `app` rather than `router` otherwise all other `app`-bound
 * middleware continues to execute after router has completed, which isn't
 * what we want for static resources.
 */

const npath = require('path');
const uglifyJs = require('uglify-js');
const fs = require('fs-extra');
const recursiveReaddir = require('recursive-readdir-sync');
const sass = require('node-sass');
const logger = require('../../lib/Logger')();

/**
 * Compile the Sass source files, and store output into the `compiledAssetsDir`.
 *
 * This is executed once when the process first starts.
 *
 * @param {express} app Express app
 * @param {string} compiledAssetsDir Directory where compiled assets are saved
 * @param {string} npmGovukFrontend Path to `govuk-fronted` node module
 * @param {string} npmGovukCasa Root path of `govuk-casa`
 * @param {string} mountUrl Mount point
 * @returns {void}
 * @throws {Exception} For an IO errors
 */
function compileSassSources(
  app,
  compiledAssetsDir,
  npmGovukFrontend,
  npmGovukCasa,
  mountUrl,
) {
  // We need to compile the Sass sources statically, and cache because the
  // `node-sass-middleware` will not cache CSS if `importer` doesn't return
  // null.
  const casaSassSrcDir = npath.resolve(npmGovukCasa, 'src/css');
  const dstDir = npath.resolve(compiledAssetsDir, 'casa/css');

  const files = recursiveReaddir(casaSassSrcDir).filter(f => !f.match(/\/_[^/]+$/));

  files.forEach((file) => {
    const fSrc = fs.readFileSync(file, { encoding: 'utf8' });
    const cssContent = sass.renderSync({
      data: `$casaMountUrl: "${mountUrl}";${fSrc}`,
      includePaths: [
        casaSassSrcDir,
        `${npmGovukFrontend}`,
      ],
      outputStyle: 'compressed',
    }).css.toString('utf8');

    const dstPath = npath.resolve(
      dstDir,
      file
        .replace(new RegExp(casaSassSrcDir), '')
        .replace(/^\/+/, '')
        .replace(/\.scss$/, '.css'),
    );
    fs.ensureDirSync(npath.dirname(dstPath));
    fs.writeFileSync(dstPath, cssContent, {
      encoding: 'utf8',
    });
  });
}

/**
 * Serve up static assets (images, fonts) from `govuk-frontend/assets`.
 *
 * @param {express} app Express app
 * @param {Express.Static} expStatic Static module from ExpressJS
 * @param {string} govukFrontendVirtualUrl Virtual URL prefix
 * @param {string} npmGovukFrontend Path to root of `govuk-frontend` module
 * @param {string} npmGovukTemplateJinja Path to root of `govuk_template_jinja` module
 * @returns {void}
 */
function addGovukFrontendStaticAssets(
  app,
  expStatic,
  govukFrontendVirtualUrl,
  npmGovukFrontend,
  npmGovukTemplateJinja,
) {
  // JavaScript
  app.use(`${govukFrontendVirtualUrl}/js/all.js`, expStatic(`${npmGovukFrontend}/all.js`, {
    etag: false,
  }));

  // Images and Font assets
  app.use(`${govukFrontendVirtualUrl}/assets`, expStatic(`${npmGovukFrontend}/assets`, {
    etag: false,
  }));

  // `govuk_template_jinja` JS assets
  // It would be lovely if all this JavaScript was merged into the main
  // `govuk-frontend` module, but for now we'll use `govuk_template_jinja`.
  // Things we need from govuk_template_jinja:
  //  * cookie bar handling
  //  * show/hide element stuff
  app.use(`${govukFrontendVirtualUrl}/js/govuk-template.js`, expStatic(`${npmGovukTemplateJinja}/assets/javascripts/govuk-template.js`, {
    etag: false,
  }));
}

/**
 * Compile and serve CASA assets.
 * `casa.js` will contain all sources from `src/js/casa.js`
 *
 * @param {express} app Express app
 * @param {Express.Static} expStatic Static module from ExpressJS
 * @param {string} compiledAssetsDir Directory where static assets are saved
 * @param {string} prefixCasa Virtual URL prefix
 * @returns {void}
 */
function addCasaStaticAssets(
  app,
  expStatic,
  compiledAssetsDir,
  prefixCasa,
) {
  const casaAssetsDir = npath.resolve(compiledAssetsDir, 'casa');
  const uglifyCasa = uglifyJs.minify({
    'casa.js': fs.readFileSync(npath.resolve(__dirname, '../../src/js/casa.js'), 'utf8'),
  });
  if (uglifyCasa.error) {
    throw new Error(`Got error whilst uglifying casa.js: ${uglifyCasa.error.message}`);
  }
  fs.ensureDirSync(npath.resolve(casaAssetsDir, 'js'));
  fs.writeFileSync(
    npath.resolve(casaAssetsDir, 'js/casa.js'),
    uglifyCasa.code, {
      encoding: 'utf8',
    },
  );

  app.use(prefixCasa, expStatic(casaAssetsDir, {
    etag: false,
  }));
}

/**
 * Add package versions to template for use in cache-busting URLs.
 *
 * @param {express} app Express app
 * @param {string} compiledAssetsDir Directory where static assets are saved
 * @param {string} npmGovukFrontend Root of `govuk-frontend`
 * @param {string} npmGovukTemplateJinja Root of `govuk_template_jinja`
 * @return {Function} Handler that adds versions to the current request
 */
function addPackageVersions(
  app,
  compiledAssetsDir,
  npmGovukFrontend,
  npmGovukTemplateJinja,
) {
  const srcs = {
    govukFrontend: npath.resolve(npmGovukFrontend, 'package.json'),
    govukTemplateJinja: npath.resolve(npmGovukTemplateJinja, 'package.json'),
    casaMain: npath.resolve(__dirname, '../../package.json'),
  };
  const casaPackageVersions = {};

  Object.keys(srcs).forEach((k) => {
    let version;
    try {
      ({ version } = JSON.parse(fs.readFileSync(srcs[k], 'utf8')));
    } catch (ex) {
      version = '';
    }
    casaPackageVersions[k] = version;
  });

  /* eslint-disable-next-line require-jsdoc */
  const handlePackageVersionInit = (req, res, next) => {
    res.locals.casaPackageVersions = casaPackageVersions;
    next();
  };
  app.use(handlePackageVersionInit);

  return handlePackageVersionInit;
}

/**
* Format of the `npmPackages` paramter:
* {
*   govukTemplateJinja: <path to root of govuk_template_jinja module>,
*   govukFrontendToolkit: <path to root of govuk_frontend_toolkit module>,
*   govukElementsSass: <path to root of govuk-elements-sass module>,
*   govukFrontend: <path to root of govuk-frontend module>,
*   govukCasa: <path to root of govuk-casa module>
* }
* @param {Express} app Express App
* @param {Express.Static} expressStatic Express static middleware
* @param {string} mountUrl Mount URL
* @param {string} cAssetsDir Directory to store compiled assets in
* @param {object} npmPackages Paths to roots of various npm dependencies
* @return {object} Applied middleware handlers
*/
module.exports = function mwStatic(
  app,
  expressStatic,
  mountUrl,
  cAssetsDir,
  npmPackages,
) {
  // Unpack packages information
  const npmGovukFrontend = npmPackages.govukFrontend;
  const npmGovukTemplateJinja = npmPackages.govukTemplateJinja;
  const npmGovukCasa = npmPackages.govukCasa;

  // Vars
  const compiledAssetsDir = npath.resolve(cAssetsDir);
  const govukFrontendVirtualUrl = `${mountUrl}/govuk/frontend`.replace(/\/+/g, '/');
  const prefixCasa = `${mountUrl}/govuk/casa`.replace(/\/+/g, '/');
  logger.info(`Compiled static assets dir: ${compiledAssetsDir}`);

  // Store GOVUK template virtual URL prefix for other places to use it. This
  // is the URL from which all GOVUK Frontend client-side assets.
  app.set('casaGovukFrontendVirtualUrl', govukFrontendVirtualUrl);

  // Compile all Sass sources
  compileSassSources(
    app,
    compiledAssetsDir,
    npmGovukFrontend,
    npmGovukCasa,
    mountUrl,
  );

  // Serve GOVUK template assets
  addGovukFrontendStaticAssets(
    app,
    expressStatic,
    govukFrontendVirtualUrl,
    npmGovukFrontend,
    npmGovukTemplateJinja,
  );
  addCasaStaticAssets(
    app,
    expressStatic,
    compiledAssetsDir,
    prefixCasa,
  );
  const handlePackageVersionInit = addPackageVersions(
    app,
    compiledAssetsDir,
    npmGovukFrontend,
    npmGovukTemplateJinja,
  );

  return {
    handlePackageVersionInit,
  };
};
