# CASA Example - Barebones

Touches on all common aspects of developing a citizen-facing web application, including:

* Simple user journey with minimal forking
* Override some CASA views
* Use custom CSS on top of the GOVUK Frontend base styling
* Using a simple memory-based session store (which is lost when service is restarted)
* Includes a "Check your answers" page prior to submission
* Sends data to a backend service (which is mimicked in this case by just writing session content to stdout)

_NOTE:_ Welsh translations have been intentionally left out so you can see the string reference appear in the rendered templates.

Apart from `moment`, all dependencies listed in `package.json` are peer dependencies of CASA (i.e. they are required for CASA to work).

## Getting started

```bash
# Install everything
npm install

# Start the app in debug mode, on port 3000
DEBUG=casa* PORT=3000 npm start
```

Access the service at http://localhost:3000/barebones
