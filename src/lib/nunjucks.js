import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Environment } from 'nunjucks';
import dirname from './dirname.cjs';
import CasaTemplateLoader from './CasaTemplateLoader.js';
import {
  mergeObjects, includes, renderAsAttributes, formatDateObject,
} from './nunjucks-filters.js';

/**
 * @typedef {object} NunjucksOptions
 * @property {string} [mountUrl=/] Mount URL (optional, default /)
 * @property {string[]} [views=[]] Template file directories (optional, default [])
 */

/**
 * Create a Nunjucks environment.
 *
 * @param {NunjucksOptions} options Nunjucks options
 * @returns {Environment} Nunjucks Environment instance
 */
export default function nunjucksConfig({
  mountUrl = '/',
  views = [],
}) {
  // Prepare a single Nunjucks environment for all responses to use. Note that
  // we cannot prepare response-specific global functions/filters if we use a
  // single environment, but the performance gains of doing so are significant.
  const loader = new CasaTemplateLoader(views, {
    watch: false,
    noCache: false,
  });

  const env = new Environment(loader, {
    autoescape: true,
    throwOnUndefined: false,
    trimBlocks: false,
    lstripBlocks: false,
  });

  // Enhancement to expose loader functions
  env.modifyBlock = loader.modifyBlock.bind(loader);

  // Globals
  // These can't be modified once set. But they can be overridden by res.locals.
  env.addGlobal('assetPath', `${mountUrl}govuk/assets`); // Required by govuk-frontend layout template
  env.addGlobal('casaVersion', JSON.parse(readFileSync(resolve(dirname, '../../package.json'))).version);

  env.addGlobal('mergeObjects', mergeObjects);
  env.addGlobal('includes', includes);
  env.addGlobal('formatDateObject', formatDateObject);
  env.addGlobal('renderAsAttributes', renderAsAttributes);

  return env;
}
