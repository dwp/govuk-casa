# Setting up behind a proxy

If your app is served up behind a reverse-proxy, such as Nginx, then there's a couple of things to be aware of.


## URL rewriting

If your proxy manipulates the URL before reaching your app, then there's some config required ...

Given this request pathway:

```
Browser (/app/) -> Reverse Proxy (rewrites to /host/app/) -> Your app
```

In this case your app will need to ...

* Setup an ExpressJS handler to strip the proxy prefix off the URL, before anything else, and
* Mount your CASA app on the `/app/` URL

And here's the minimal setup to do that:

```javascript
import ExpressJS from 'express';
import { configure } from '@dwp/govuk-casa';

const { mount } = configure();

const app = ExpressJS();

app.use('/host', (req, res, next) => {
  // Strip off proxy, leaving just the desired mount path
  req.baseUrl = '/app/';

  // This re-issues the request, and this time it will be picked up by the first
  // middleware attached to `/app/`
  req.app.handle(req, res, next);
});

app.use('/app/', mount(ExpressJS()));

app.listen();
```

> NOTE: For users on v8.1.x who are already mounting their CASA app directly on the proxy path, this will still work, but the above method will be mandatory in the next major release.


## Setting secure cookies

If you are using the `secure` option for sessions, then your app will by default only set cookies when serving requests over a TLS connection. However, it's common to have the proxy perform TLS termination and make any upstream calls over plan HTTP, eg

```
Browser --(https)--> Nginx proxy --(http)--> Your app
```

In this case, you will need to tell Express to trust that the proxy is serving TLS requests:

```javascript
import ExpressJS from 'express';
import { configure } from '@dwp/govuk-casa';

const { mount } = configure({
  session: {
    secure: true,
  },
});

const casaApp = ExpressJS();
casaApp.set('trust proxy', 1);
mount(casaApp);

const app = ExpressJS();
app.use('/', casaApp);

app.listen();
```
