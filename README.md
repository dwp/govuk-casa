# CASA 

A framework of ExpressJS middleware for building services based on the [GOV.UK Design System](https://design-system.service.gov.uk/).

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

## Requirements

CASA aims to maintain support for the **latest LTS version** of NodeJS, and requires at least version `6.4.0` of npm. See the [NodeJS release schedule](https://nodejs.org/en/about/releases/) for more information.

## Getting started

To get started quickly, take a look through the ["barebones" example application](examples/barebones/). This provides you with a basic application out of the box, covering most features of CASA.

Alternatively, read through our **[Guides](docs/guide.md)** to start building an understanding of the core concepts involved in building a CASA app.

## Migrating between versions

A series of migration guides are provided in [`docs/migration-guides/`](docs/migration-guides/) that should help you upgrade between major versions of CASA.
