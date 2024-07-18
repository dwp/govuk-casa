/**
 * Compile the CASA and govuk-frontend sass sources into a static CSS file.
 *
 * Usage (from project root):
 *  node compile-sass.js.
 */

import * as sass from 'sass';
import { writeFile } from 'fs/promises';

const { renderSync } = sass;

/**
 * Compile all Sass files in the `src/casa/` source directory, and store output
 * into the specified `targetDir`.
 */
async function compileSassSources() {
  // Main CSS
  let targetFile = 'dist/assets/css/casa.css';
  const { css } = renderSync({
    file: 'assets/scss/casa.scss',
    includePaths: [
      'assets/scss/',
    ],
    outputStyle: 'compressed',
    outFile: targetFile,
    quietDeps: true,
  });
  await writeFile(targetFile, css, { encoding: 'utf8' });

  // IE8 support
  targetFile = 'dist/assets/css/casa-ie8.css';
  const { css: cssIe8 } = renderSync({
    file: 'assets/scss/casa-ie8.scss',
    includePaths: [
      'assets/scss/',
    ],
    outputStyle: 'compressed',
    outFile: targetFile,
    quietDeps: true,
  });
  await writeFile(targetFile, cssIe8, { encoding: 'utf8' })
}

await compileSassSources();
