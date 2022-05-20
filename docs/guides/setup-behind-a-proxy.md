# Setting up behind a proxy

If your app is served up behind a reverse-proxy, such as Nginx, then there's a couple of things to be aware of.


## URL rewriting

If your proxy manipulates the URL before reaching your app, then there's some config required ...

Given this request pathway:

```
Browser (/app/) -> Reverse Proxy (rewrites to /host/app/) -> Your app
```

In this case your app will need to ...

* Specify a `mountUrl` of `/app/`
* Mount your CASA app onto the `/host/app` path

And here's the minimal setup to do that:

```javascript
import ExpressJS from 'express';
import { configure } from '@dwp/govuk-casa';

// Set the specific prefix you want to appear in the browser address bar
const { mount } = configure({
  mountUrl: '/app/',
});

// Mount onto the full proxy path + mountUrl combo
const app = ExpressJS();
app.use('/host/app', mount(ExpressJS()));

app.listen();
```


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
