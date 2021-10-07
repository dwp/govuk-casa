/**
 * Worker-initialisation script.
 *
 * Pass `--a11y` flag to include accessibility scans.
 *
 * Pass `--zap` to the test script cli to activate zap scanning
 * Pass `--zap-target-hostname` for non-localhost target (e.g. `host.docker.internal`)
 * Pass `--zap-api-key` to specify the ZAProxy API key (default "secret")
 * Pass `--zap-proxy` to specify the ZAP host/port, (default http://localhost:8080)
 */
/* eslint-disable import/no-unresolved,no-unused-vars,global-require */
import { dirname, resolve } from 'path';
import { load } from 'js-yaml';
import { readFileSync } from 'fs';
import { Environment, FileSystemLoader } from 'nunjucks';
import { fileURLToPath } from 'url';

import zapHooks from '@dwp/casa-spiderplan-zap-plugin';
import a11yHooks from '@dwp/casa-spiderplan-a11y-plugin';

import application from '../../examples/fully-loaded/app.js';
import planConstructor from '../../examples/fully-loaded/definitions/plan.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * REQUIRED.
 *
 * Worker initialisation script.
 *
 * Parameters:
 *   string language = Language that will be tested
 *   object cliArgs = All arguments passed via cli (parsed by `yargs`)
 *
 * Must return an object with these attributes:
 *   application = An instance of your application (required)
 *   plan = An instance of your CASA Plan (required)
 *   selectors = An object containing CSS selectors for each waypoint (required)
 *   nunjucksEnv = Nunjucks instance used to generate whole-page content (optional)
 *   textFilter = A function to modify page content before comparison (optional)
 *   hooks = An array of hooks (optional)
 *
 * @param {params} params See above
 * @returns {object} See above
 */
export default async ({ sharedState, language = 'en', cliArgs = {} }) => {
  // Application instance
  const expressApp = application({
    MOUNT_URL: '/',
  });

  // Plan
  const plan = planConstructor();

  // CSS selectors
  const selectors = load(readFileSync(resolve(__dirname, 'selectors.yaml')), 'utf8');

  // Nunjucks template loader for content tests
  const tplLoader = new FileSystemLoader(resolve(__dirname, 'content', language));
  const nunjucksEnv = new Environment(tplLoader, { autoescape: false });

  let hooks = [];

  if (cliArgs.zap) {
    hooks = [
      ...hooks,
      ...await zapHooks({
        apiKey: cliArgs.zapApiKey ?? 'secret',
        proxy: cliArgs.zapProxy ?? 'http://localhost:8080/',
        rewriteUrl: cliArgs.zapTargetHostname ? ((p) => p.replace('localhost', cliArgs.zapTargetHostname)) : undefined,
      }),
    ];
  }

  if (cliArgs.a11y) {
    hooks = [
      ...hooks,
      ...await a11yHooks({
        dir: '.a11y/',
        ignoreVariants: (cliArgs.a11yIgnoreVariants || '').split(','),
        disableVariants: !!cliArgs.a11yDisableVariants,
        sharedState,
      }),
    ];
  }

  return {
    expressApp,
    plan,
    selectors,
    nunjucksEnv,
    textFilter: (t) => (t),
    hooks,
  };
};
