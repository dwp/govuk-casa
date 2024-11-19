import ExpressJS from "express";
import { MemoryStore } from "express-session";

import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

import { configure, corePlugins } from "../../../../../casa.js";

import pageFactory from "./pages.js";
import planFactory from "./plan.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const application = () => {
  const plan = planFactory();

  const { mount } = configure({
    views: [resolve(__dirname, "views")],
    session: {
      name: "myappsessionid",
      store: new MemoryStore(),
      secret: "secret",
      ttl: 3600,
      secure: false,
    },
    pages: pageFactory(plan),
    plan: plan,
    plugins: [
      corePlugins.editSnapshot(),
    ],
  });

  const casaApp = ExpressJS();
  mount(casaApp);

  const app = ExpressJS();
  app.use("/", casaApp);

  return app;
};

export default application;
