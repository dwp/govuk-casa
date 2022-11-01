# Getting Started

## Install

```bash
# Install (this also builds)
npm ci

# Command for ad-hoc building
npm run build
```


## Directory structure

* `src/` - JavaScript sources (using ES6 modules exclusively)
* `docs/` - documentation
* `locales/` - default language dictionaries
* `scripts/` - utility scripts used in the build process
* `assets/` - static assets, like images, css, etc
* `tests/` - tests
* `views/` - Nunjucks templates

Any code in `src/` that references files in `assets/` will do so via a relative path to `dist/assets/` rather than the root `assets/` directory. This is important because that reference must work in both the raw, uncompiled version of the code, but also in the code copied to `dist/`. For example, `../dist/assets/file.html` will resolve to the same file from both `src/script.js` and `dist/script.js`. We always use the `dist/assets/` version because assets need to compile regardless of whether we're running lcoally or packaging up the npm distributable.

We already duplicate the JavaScript in order to support CommonJS and ES6 modules, but we do not want to duplicate the static assets or views as it will cause the package size to bloat unnecessarily.


## Using a local module build

When you want to write or test a CASA app using a locally-built version of this module.

Build and npm-link this repo locally:

```bash
npm run build
npm link
```

Now in your CASA app's folder, run:

```bash
npm link @dwp/govuk-casa
```

> **Note**: Every change you make to the local clone of CASA will require it to be rebuilt with `npm run build`.

If you're building an ES6-based app, you can skip the build step by temporarily altering `package.json` to point `main` at `src/casa.js`.
