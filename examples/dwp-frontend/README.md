# Example: Barebones with dwp frontend

This is an example of casa configured with [@dwp/frontend](https://www.npmjs.com/package/@dwp/dwp-frontend)

You need to compile the assets locally usinng `npm run compile:sass` and `npm run compile:js`.

You can see the components in the [DWP design system](https://design-system.dwp.gov.uk/components).

## Steps to integrate

Similar steps can be used in any express based application.

- Create a scss file with styles pulled from in from the node modules (`/assets/dwp-frontend.scss)`)
- Run a compile step `npm run compile:sass` to generate css from that source (`sass ./assets/dwp-frontend.scss ./assets/dwp-frontend.css`)
- Create a JavaScript file with with the required modules imported (`/assets/govuk-dwp-frontend.js)`)
- Run a compile step `npm run compile:js` to generate JavaScript from that source (`esbuild ./assets/govuk-dwp-frontend.js --bundle --minify --outfile=./assets/govuk-dwp-frontend.min.js`)
- Mount that assets onto a static route (`staticRouter.use("/assets", expressStatic(resolve(__dirname, "assets/")));`)
- Update the sass to be in the nunjucks layout (`/views/partials/styles.njk`) injected into the layout (`/views/layouts/agent.njk`)
- Update the css to be in the nunjucks layout (`/views/partials/scripts.njk`) injected into the layout (`/views/layouts/agent.njk`)
- Configure nunjucks to pull from dwp-frontend views folder (`configure({ views: [resolve(__dirname, "node_modules/@dwp/dwp-frontend")]})`)
- Use the components in some page/layout (`views/layouts/journey.njk`)

## Local development

If using this for local framework development purposes:

```bash
# Install the framework first
npm ci
npm link

# Install and run this example
cd examples/dwp-frontend/
npm i
npm link @dwp/govuk-casa
npm run compile:sass
npm run compile:js
DEBUG=casa* PORT=3000 npm start
```

Visit <http://localhost:3000/>
