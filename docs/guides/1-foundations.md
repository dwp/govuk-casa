# Foundations

There are 3 main concepts that underpin a CASA service:

1. The Plan
2. Journey Contexts
3. Pages

## The Plan

CASA's primary purpose is to make it simple to develop a multi-page, data-gathering service. And the journey that a visitor takes through that service is defined by a **[Plan](docs/guides/2-plan.md)**.

At its heart, a Plan is just a [directed graph](https://en.wikipedia.org/wiki/Directed_graph) with a few specific controls around it, and a terminology specific to CASA, i.e. a Plan is made up of **Waypoints** (equivalent to graph nodes), which are each connected by **Routes** (equivalent to graph edges).

A Plan is also global - all visitors use the same Plan to navigate through the service, but the concept that determines where they have been, and where they can go within that Plan, is the **[Journey Context](#journey-contexts)**.

## Journey Contexts

As a visitor navigates their way through a service's Plan, the state of that journey is captured within their own **[Journey Context](docs/api/journey-state.md)**. Every visitor's Journey Context is unique to them.

This contains three categories of state:

1. **Data**<br/>
  Typically this holds all the data submitted via forms, but you can effectively store anything else you may need.<br/>
2. **Validation**<br/>
  As visitors submit forms, their submission is validated against some defined criteria. The results of the validation for each waypoint are stored here.<br/>
3. **Navigation**<br/>
  _Not yet used_

Whilst each visitor has a single _core_ Journey Context, you can also use specialised **[Ephemeral Contexts](docs/ephemeral-contexts.md)** to temporarily adjust the user's route through the Plan, for example.

## Pages

Whilst a Plan is made up of abstract _Waypoints_, the tangible representation of those elements (that a visitor sees) are **[Pages](docs/page-markup.md)**.

A Page comprises:

* An HTML form, defined using a Nunjucks template
* Some defined validation logic for each of the fields within that form
* Optionally, some controller logic to be executed at various "hook" points

