# Mounting on a parameterised URL

You might want to mount your CASA application on a paramaterised URL, for example `/app/:someId`.

For instance, this could be useful if you want to tweak the journey in some way based on this parameter.

```javascript
import express from 'express';
import { configure } from '@dwp/govuk-casa';

// Prep the CASA app
const { mount } = configure({
  session: {
    secret: 'secret',
  },
});

// Mount on a parent app
const app = express();
app.use('/app/', mount(express(), {
  // All calls to `/app/123`, `/app/something`, etc will now be served by the CASA app
  route: '/:someId',
}));

app.listen();
```

Note that in your templates, the following variables will apply:

* `casa.mountUrl` = `/app/abcdef/` (where `abcdef` is the dynamic parameter)
* `casa.staticMountUrl` = `/app/`
