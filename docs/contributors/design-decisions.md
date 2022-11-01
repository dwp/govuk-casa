# Design decisions

Why things are done the way they are.


## Supporting ES6 and CommonJS

The source for CASA is written with ES6 modules, but we make the distributable available as a CommonJS module with an ES6 wrapper so that consumers can use both.

This comes with a few challenges, but the aims are:

* Make the raw source code (before any build steps) usable as-is. This is necessary in order to run tests, for example.
* By using ES6 we are keeping up with the direction of travel in NodeJS
* By supporting CommonJS we are bringing existing users with us

The `npm run build` command will compile the ESM source into a CommonJS format that can be used by consumers using either ESM or CommonJS. An important file into this process is `scripts/esm-wrapper.js`. Whenever you makechanges to `src/casa.js`, those changes must be reflected in `esm-wrapper.js` too. This wrapper is used during compilation.

References:

- https://nodejs.org/api/packages.html#packages_dual_commonjs_es_module_packages
- https://redfin.engineering/node-modules-at-war-why-commonjs-and-es-modules-cant-get-along-9617135eeca1


### How to handle `__dirname`

The `__dirname` global is not available in ES6, and ES6's equivalent (using `import.meta.url`) is not transpiled. So wherever you want to use `__dirname`, use this [little trick](https://medium.com/@almtechhub/es-modules-and-import-meta-dirname-babel-trick-39aad026682) instead:

```javascript
// dirname.cjs
module.exports = __dirname;

// your-module.js (in same folder as dirname.cjs)
import { resolve } from 'path';
import dirname from './dirname.cjs';
resolve(dirname, '../assets/');
```


## Type definitions

At one point we had considered moving over to TypeScript, primarily for the support of Types and the intellisense advantages that comes with. However, the bulk of our users are JavaScript devs, and at a time when we want to encourage more contributions from the community, we didn't think it wise to alienate the majority of potential contributors!

Therefore we have settled on a halfway house by keeping JavaScript and making use of the JSDoc syntax as a means to surface type definitions in IDE intellisense.


## Journey Context events

An events mechanism was chosen over anything involving middleware hooks because the context could be changed _anywhere_ within the application, and certain middleware hooks may never get reached before a user is redirected. So the only point at which events are triggered is when `JourneyContext.putContext()` is called - this **should** always be called (by the developer, or CASA internals) just before data is comitted to the session.


## Middleware as arrays

All files in the `src/middleware/` directory must return arrays of middleware, even if there is just one middleware function. This breeds consistency as these objects are made available to developers.
