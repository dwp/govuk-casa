import ExpressJS from "express";

import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

import { configure } from "@dwp/govuk-casa";

import pages from "./definitions/pages.js";
import planFactory from "./definitions/plan.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const application = ({
  sessionStore,
  mountUrl = "/",
  subAppMountUrl = "/",
}) => {
  const plan = planFactory({
    subAppMountUrl,
  });

  const { staticRouter, ancillaryRouter, mount } = configure({
    mountUrl,
    views: [resolve(__dirname, "views")],
    session: {
      name: "myappsessionid",
      secret: "secret",
      ttl: 3600,
      secure: false,
      store: sessionStore,
    },
    i18n: {
      dirs: [resolve(__dirname, "locales")],
      locales: ["en"],
    },
    pages: pages(),
    plan,
  });

  staticRouter.get("/css/application.css", (req, res, next) => {
    res.set("content-type", "text/css");
    res.send(".govuk-header { background-color: #003078; }");
  });

  // Ensure we start on the first waypoint in the journey
  ancillaryRouter.use(/^\/$/, (req, res, next) => {
    res.redirect(302, `${mountUrl}start`);
  });

  // Create the sub-app and mount CASA's middleware on it
  const app = ExpressJS();
  mount(app);

  return app;
};

export default application;
