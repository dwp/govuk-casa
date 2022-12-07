# Preparing assets

If within your casa configurations, you have set the `skipAssetsGeneration: true`, it is the developer's responsibility to manually generate the static assets. If you have not set this option, the static assets get generated at runtime. If you are running a read only file system, such as kubernetes you will get issues at runtime when casa tries to generate your assets.

## Example

Here is an example js file to manually generate the assets, but obviously change the inputs to suit your needs.

```javascript

require('dotenv').config();
const prepareAssets = require('@dwp/govuk-casa/middleware/static/prepare-assets');
const path = require('path');

const casaRoot = path.dirname(require.resolve("@dwp/govuk-casa/package.json"));

prepareAssets({
  logger: console,
  npmGovukCasa: casaRoot,
  compiledAssetsDir: path.join(__dirname, '../dist/assets/static'),
  mountUrl: process.env.BASE_PATH || '/',
});


```
