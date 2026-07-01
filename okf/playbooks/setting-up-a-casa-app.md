---
type: Playbook
title: Setting up a CASA app
description: Step-by-step guide to standing up a minimal CASA application.
tags: [playbook, getting-started, setup]
timestamp: 2026-06-30T00:00:00Z
---

This playbook walks through the minimal steps to stand up a CASA service. For a
working version, see the [barebones example](/examples/barebones.md).

# Steps

1. **Define a Plan** in its own file, wrapped in a function so config can be
   injected at runtime. See [The Plan](/concepts/plan.md).

   ```javascript
   // definitions/plan.js
   import { Plan } from "@dwp/govuk-casa";
   export default function () {
     const plan = new Plan();
     plan.addSequence("personal-details", "contact", "check-your-answers");
     return plan;
   }
   ```

2. **Define pages** for each [waypoint](/concepts/waypoint.md), binding a view
   and [fields](/concepts/field.md). See [Page](/concepts/page.md).

3. **Configure** the app, passing views, session settings, the plan, and pages.
   See [`configure()`](/concepts/configure.md).

   ```javascript
   import { configure, field } from "@dwp/govuk-casa";
   import plan from "./definitions/plan.js";

   const { mount } = configure({
     views: ["views"],
     session: { name: "myapp", secret: process.env.SECRET, ttl: 3600 },
     i18n: { dirs: ["locales"], locales: ["en", "cy"] },
     plan: plan(),
     pages: [
       {
         waypoint: "personal-details",
         view: "pages/personal-details.njk",
         fields: [field("fullName").validators([/* ... */])],
       },
     ],
   });
   ```

4. **Mount** onto an ExpressJS app, optionally serving the first waypoint at the
   root. See [`mount()`](/concepts/mount.md).

   ```javascript
   import express from "express";
   const app = express();
   app.use("/", mount(express(), { serveFirstWaypoint: true }));
   app.listen(3000);
   ```

5. **Add templates, translations, validators, and extensions** as needed —
   [Templating](/concepts/templating.md), [i18n](/concepts/i18n.md),
   [Validation](/concepts/validation.md), [Hooks](/concepts/hooks.md),
   [Events](/concepts/events.md), and [Plugins](/concepts/plugins.md).

# Citations

[1] [Setting up a CASA application](https://github.com/dwp/govuk-casa/blob/main/docs/setup.md)
