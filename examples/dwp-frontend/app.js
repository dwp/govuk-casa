import { default as ExpressJS, static as expressStatic } from "express";

import { configure } from "@dwp/govuk-casa";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

import pages from "./definitions/pages.js";
import planFactory from "./definitions/plan.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const application = ({ MOUNT_URL = "/" }) => {
  const plan = planFactory();

  // Configure some CASA routes and other middleware for use in our CASA app
  // @dwp/dwp-frontend: include views
  const { staticRouter, ancillaryRouter, csrfMiddleware, mount } = configure({
    views: [
      resolve(__dirname, "views"),
      resolve(__dirname, "node_modules/@dwp/dwp-frontend")
    ],
    session: {
      name: "myappsessionid",
      secret: "secret",
      ttl: 3600,
      secure: false,
    },
    i18n: {
      dirs: [resolve(__dirname, "locales")],
      locales: ["en", "cy"],
    },
    pages: pages(),
    plan,
  });

  // @dwp/dwp-frontend: expose internal assets
  staticRouter.use("/assets", expressStatic(resolve(__dirname, "assets/")));
  staticRouter.all("/assets", (_req, res) => res.status(404).send("Not found"));

  // Example: Adding custom routes before page handlers
  // You can do this by adding a route/middleware to the `ancillaryRouter`.
  ancillaryRouter.use("/start", (_req, res) => res.render("welcome.njk"));

  // Example of how to mount a handler for the `/` index route. Need to use a
  // regex for the specific match to only `/`.
  ancillaryRouter.use(/^\/$/, (req, res) => {
    res.redirect(302, `${req.baseUrl}/start`);
  });

  // Now mount all CASA's routers and middleware
  // You cannot mount anything after this point because CASA will add its own
  // fall-through and error handling middleware
  const casaApp = ExpressJS();
  mount(casaApp);

  // Finally, mount our CASA app on the desired mountUrl.
  const app = ExpressJS();
  app.use(MOUNT_URL, casaApp);

  // Return the base web app
  return app;
};

export default application;
