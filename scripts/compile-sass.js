/**
 * Compile the CASA and govuk-frontend sass sources into a static CSS file.
 *
 * Usage (from project root):
 *  node compile-sass.js.
 */

import { compile } from 'sass';
import { writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

/**
 * Compile all Sass files in the `src/casa/` source directory, and store output
 * into the specified `targetDir`.
 */
async function compileSassSources() {
  const require = createRequire(import.meta.url);
  const govukFrontendDirectory = resolve(require.resolve('govuk-frontend'), '../../');

  // Main CSS
  const { css } = compile('assets/scss/casa.scss', {
    loadPaths: [
      govukFrontendDirectory,
    ],
    style: 'compressed',
    quietDeps: true,
  });

  await writeFile('dist/assets/css/casa.css', css, { encoding: 'utf8' });
}

await compileSassSources();
