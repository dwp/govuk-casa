# Setting up a new application

## Preparation

Install all dependencies:

```bash
npm i -E @dwp/govuk-casa express express-session
```

You can organise your project directory structure however you wish, but the following works quite well:

```
definitions/
  pages.js
  plan.js

locales/
  en/
  cy/
  
tests/

views/

app.js

server.js
```

## Application entrypoint

To help with integration testing, we recommend separating your ExpressJS setup (`app.js`) from your server setup (`server.js`), setting `server.js` as your application's entrypoint. For example, in `package.json`:

```json
{
  "main": "server.js"
}
```

Where your `server.js` might look something like this:

```javascript
/* server.js */
const http = require('http');

// Create an application instance
const application = require('./app.js');

// Create an instance of your application
const app = application();

// Create a server, delegating event handling to your application.
// Using http here, but recommend using https.
const httpServer = http.createServer(app);

// Start listening for incoming requests
httpServer.listen(3000, () => {
  console.log('Ready to go ...');
});
```

And your `app.js` might be:

```javascript
/* app.js */
const path = require('path');
const express = require('express');
const { configure } = require('@dwp/govuk-casa');
const pageDefinitions = require('./definitions/pages.js');
const plan = require('./definitions/plan.js');

module.exports = () => {
  // Set up Express to use base logger for all requests
  const expressApp = express();

  // Attach CASA middleware
  const casaApp = configure(expressApp, {
    mountUrl: '/',
    views: {
      dirs: [ path.resolve(__dirname, 'views') ],
    },
    compiledAssetsDir: path.resolve(__dirname, 'static'),
    i18n: {
      dirs: [ path.resolve(__dirname, 'locales') ],
      locales: ['en', 'cy'],
    },
  });

  // Load CASA Page and Plan definitions
  casaApp.loadDefinitions(pageDefinitions, plan);

  // An index route to make sure everyone lands on the first waypoint
  casaApp.router.get('/', (req, res) => {
    res.status(302).redirect(`${casaApp.config.mountUrl}start`);
  });

  // Return the prepared app
  return expressApp;
};
```

> To see how to setup the `plan` and `pageDefinitions` variables above, refer to our guides on [how to design a Plan](docs/guides/3-plan.md) and [how to define Pages](docs/guides/4-pages.md) respectively.

## Selecting a session store

By default, CASA will use an in-memory session store. Whilst perfectly fine for local development work, you'll want to use something more secure and scalable in production. To that end, any store that implements the [`express-session`](https://www.npmjs.com/package/express-session#compatible-session-storess) interface can be used.

Once you've chosen and configured a store, modify the `configure()` call above to attach it to CASA:

```javascript
const casaApp = configure(expressApp, {
  ...
  sessions: {
    name: 'cookie-name',
    ttl: 3600,
    secure: true,
    secret: 'this-is-a-secret',
    cookieSameSite: 'Strict',
    store: myChosenStore,
  },
  ...
});
```
