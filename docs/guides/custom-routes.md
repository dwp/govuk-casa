# Adding custom routes

The **`ancillaryRouter`** is the best place for your custom routes; anything that isn't a static resource (images, css, etc) or part of a CASA journey, is best placed in this router.

If you refer to the [request lifecycle](../request-lifecycle.md), you'll see that any routes/middleware you place in the `ancillaryRouter` will have access to a lot of things already prepared for you, such as a session, access to some useful data items, as well as templating capabilities.

## Example: A welcome page

A basic page to welcome users to your service:

```javascript
const { ancillaryRouter, mount } = configure({ ... });

ancillaryRouter.get(/^\/$/, (req, res) => res.render('welcome.njk'));

const casaApp = express();
mount(casaApp);
```

## Example: A feedback form

Here we outline the steps needed to setup a form that will accept some input from the user and send it off to a backend service.

First, setup some route handlers for displaying and processing the form:

```javascript
// feedback-form.js

// Handle the GET route by just displaying the form
export function get(req, res, next) {
  res.render('feedback-form.njk');
}

// Handle the POST route by sending data to a backend API, or showing errors
// Note that Express doesn't support async handlers, so we have to handle the
// promise wholly within this function
export function post(req, res, next) {
  sendToApi(req.body).then((res) => {
    res.render('feedback-form.njk', { displayThanks: true });
  }).catch((err) => {
    res.render('feedback.form.njk', { error: err.message });
  });
}
```

The form template may look something like the below (note the use of a CSRF token):

```jinja
{% extends "casa/layouts.main.njk" %}

{% block content %}
  <form method="post" action="{{ casa.mountUrl }}feedback">
    <input type="hidden" name="_csrf" value="{{ csrfToken }}" />

    <textarea name="feedback"></textarea>

    <button type="submit">Submit</button>
  </form>
{% endblock %}
```

Now attach the routes to the `ancillaryRouters`. Note that we can use the `csrfMiddleware` provided by CASA to generate a CSRF token for our forms:

```javascript
import { get, post } from 'feedback-form.js';

const { ancillaryRouter, csrfMiddleware, mount } = configure({ ... });

ancillaryRouter.get('/feedback', csrfMiddleware, get);
ancillaryRouter.post('/feedback', csrfMiddleware, post);

const casaApp = express();
mount(casaApp);
```
