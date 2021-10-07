# Setting up behind a proxy

If your app is served up behind a reverse-proxy, such as Nginx, then there's a couple of things to be aware of.


## URL rewriting

If your proxy manipulates the URL before reaching your app, then there's some config required ...

Given this request pathway:

```
User (/app/) -> Reverse Proxy (rewrites to /host/app/) -> Your app
```

In this case your app will need to ...

* Serve all ExpressJS routes from the base URL `/host/app/`
* Use the `/app/` URL when writing out any links to resources in your web pages

And here's the setup to do that:

```javascript
import express from 'express';
import { configure } from '@dwp/govuk-casa';

const { mount } = configure({
  mountUrl: '/app/',
});

const casaApp = express();
mount(casaApp);

const app = express();
app.use('/host', casaApp);

app.listen();
```


## Setting secure cookies

If you are using the `secure` option for sessions, then your app will by default only set cookies when serving requests over a TLS connection. However, it's common to have the proxy perform TLS termination and make any upstream calls over plan HTTP, eg

```
Browser --(https)--> Nginx proxy --(http)--> Your app
```

In this case, you will need to tell Express to trust that the proxy is serving TLS requests:

```javascript
import express from 'express';
import { configure } from '@dwp/govuk-casa';

const { mount } = configure({
  session: {
    secure: true,
  },
});

const casaApp = express();
casaApp.set('trust proxy', 1);
mount(casaApp);

const app = express();
app.use('/', casaApp);

app.listen();
```
