# CASA 

[![Build Status](https://travis-ci.org/dwp/govuk-casa.svg?branch=master)](https://travis-ci.org/dwp/govuk-casa)

A compact framework for building government services, quickly and securely.

### Support

CASA is maintained by the [DWP Engineering Practice](mailto:open-source@engineering.digital.dwp.gov.uk).

### Contributing

If you'd like to contribute any changes, enhancements or report issues, please take a look at our [contribution guide](CONTRIBUTING.md).

## Features

* Adopts the [GOVUK Design System](https://design-system.service.gov.uk/) which provides well-researched, accessible markup out of the box
* Handles complex, conditional journey routing logic so you easily tailor users' journeys on the fly
* Provides basic protection against some [OWASP Top Ten](https://www.owasp.org/index.php/Category:OWASP_Top_Ten_Project) vulnerabilities such as XSS, CSRF
* Choose your own session management extension for customised data storage (e.g. apply encryption as required)
* Shallow learning curve

## Getting started

CASA aims to maintain support for the **latest CURRENT even version** and the **previous LTS version** of NodeJS (currently `12` and `10` respectively as of May 2019), and requires at least version `6.4.0` of npm. See the [NodeJS release schedule](https://nodejs.org/en/about/releases/) for more information.

Prepare your new project and install dependencies:
```bash
mkdir -p my-project
cd my-project
npm init -y
npm install --save-exact express express-session @dwp/govuk-casa
```

You can use any folder structure you're most comfortable with, but here's a suggested convention:
```bash
definitions/
  field-validators/
  journey.js
  pages.js
locales/
  en/
  cy/
routes/
static/
views/
  layouts/
  pages/
  partials/
app.js
```

If you just want to get a quick and dirty CASA application up and running, take a look at **[Deploying a CASA app](docs/deploying.md)** first or browse through one of the [example applications](examples/).

However, if you'd like to build an understanding of the core concepts involved in building a CASA app, a good place to start is to begin designing your _User Journey_. This will provide CASA with information about the high-level flow that a user takes through your service, including the various conditional forks that may appear in the journey. Visit **[Designing a User Journey](docs/user-journey.md)** to get started.

Once your user journey begins to take shape, you can start to create the HTML pages that will take your users through that journey, capturing data from them along the way. All markup is generated through Nunjucks templates, and you can use the [GOVUK Design System components](https://design-system.service.gov.uk/components/) to generate elements that match the GOVUK styling. Visit **[Creating Pages](docs/page-markup.md)** to get started.

Now you've got some pages ready to collect data from the user, you'll most likely want to add a bit of validation logic to those data fields to make sure you're capturing the right stuff, in the right format. Visit **[Defining Field Validation](docs/field-validation.md)** to get started.

Finally, we need to bring all of this together, by creating a bootstrap script for our service. Visit **[Deploying a CASA app](docs/deploying.md)** to get started.

That's it! The basics have been covered here, but if you want to delve deeper under the hood then take a read through the **[developer API documentation](docs/api.md)** too.
