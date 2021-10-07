# Maintainers Guide


## Getting started

```bash
# Install (this also builds)
npm ci

# Testing
npm test
npm run test:e2e

# Build (for packaging the module)
npm run build
```


## Tests

All test scripts live in the `tests/` directory.

* **unit tests** _must_ be written for everything in `src/lib/`, and _should_ be written to cover other sources where they cannot be covered by other types of test
* **e2e tests** _must_ attempt to cover as much of the functionality in `src/middleware/` and `src/routes/` as possible

The e2e tests can also be run with plugins enabled for **accessibility testing** and **penetration testing**:

```bash
# Accessibility tests
npm run test:e2e -- --a11y

# Penetration tests (using dockerised ZAP)
# Wait a few seconds for this to initialise
docker run --name zap -d -u zap -p 8080:8080 -i owasp/zap2docker-stable \
  zap.sh -daemon -host 0.0.0.0 -port 8080 \
  -config api.addrs.addr.name=".*" \
  -config api.addrs.addr.regex=true \
  -config api.key=secret

npm run test:e2e -- --zap --zap-target-hostname=host.docker.internal
```




## Supporting ES6 and CommonJS

The source for CASA is written with ES6 modules, but we make the distributable available as a CommonJS module with an ES6 wrapper so that consumers can use both.

This comes with a few challenges, but the aims are:

* Make the raw source code (before any build steps) usable as-is. This is necessary in order to run tests, for example.
* By using ES6 we are keeping up with more modern trends in NodeJS
* By using JSDoc, we are able to generate typings which help consumers and maintainers understand and explore the API more easily, through any generated docs or through IDE intellisense


## Directory structure

* `src/` - stores all JavaScript sources (using ES6 modules exclusively)
* `assets/` - stores all static assets, like images, css, etc
* `views/` - stores all Nunjucks templates

Any code in `src/` that references files in `assets/` will do so via a relative path to `dist/assets/` rather than the root `assets/` directory. This is important because that reference must work in both the raw, uncompiled version of the code, but also in the code copied to `dist/`. For example, `../dist/assets/file.html` will resolve to the same file from both `src/script.js` and `dist/script.js`. We always use the `dist/assets/` version because assets need to compile regardless of whether we're running lcoally or packaging up the npm distributable.

We already duplicate the JavaScript in order to support CommonJS and ES6 modules, but we do not want to duplicate the static assets or views as it will cause the package size to bloat unnecessarily.


## How to handle `__dirname`

The `__dirname` global is not available in ES6, and ES6's equivalent (using `import.meta.url`) is not transpiled. So wherever you want to use `__dirname`, use this [little trick](https://medium.com/@almtechhub/es-modules-and-import-meta-dirname-babel-trick-39aad026682) instead:

```javascript
// dirname.cjs
module.exports = __dirname;

// your-module.js (in same folder as dirname.cjs)
import { resolve } from 'path';
import dirname from './dirname.cjs';
resolve(dirname, '../assets/');
```


## Using a local module build

When you want to write a CASA app using a locally-built version of this module.

Clone this repo and set it up locally:

```bash
npm ci
npm run build
npm link
```

Now in your CASA app folder, run:

```bash
npm link @dwp/govuk-casa
```

Note that every change you make to the local clone of CASA will require it to be rebuilt with `npm run build`.

If you're building an ES6-based app, you can skip the build step by temporarily altering `package.json` to point `main` at `src/casa.js`.





## Middleware as arrays

All files in the `src/middleware/` directory must return arrays of middleware, even if there is just one middleware function. This breeds consistency as these objects are made available to developers.


## Performance

Iterating over arrays/objects:

* `for` loops with a cached length variable are the quickest way to iterate over arrays
* `Object.values()` is quickest way to iterate over objects if you don't care about the keys
* `Object.keys()` is the quickest and safest way to iterate over objects if you need the key
* `Object.entries()` is the _slowest_ method to iterate an object


## Developer experience

* Log messages must be descriptive and helpful; point to documentation, or make suggestions where possible.


## Notes

* Use `waypointUrl()` to generate all URLs. This will produce a valid waypoint URL.


## References

- https://nodejs.org/api/packages.html#packages_dual_commonjs_es_module_packages
- https://redfin.engineering/node-modules-at-war-why-commonjs-and-es-modules-cant-get-along-9617135eeca1
- https://www.realpythonproject.com/javascript-do-you-know-the-fastest-way-to-iterate-over-arrays-objects/



TODO: Note about using `createRequire()` to create a cross-compatible way to require modules and use resolution