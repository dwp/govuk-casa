/**
 * Worker-initialisation script.
 */
import { dirname, resolve } from "path";
import { load } from "js-yaml";
import { readFileSync } from "fs";
import { Environment, FileSystemLoader } from "nunjucks";
import { fileURLToPath } from "url";

import application from "./app/app.js";
import planConstructor from "./app/plan.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async () => {
  const expressApp = application();
  const plan = planConstructor();
  const selectors = load(
    readFileSync(resolve(__dirname, "selectors.yaml")),
    "utf8",
  );

  const tplLoader = new FileSystemLoader(
    resolve(__dirname, "content"),
  );
  const nunjucksEnv = new Environment(tplLoader, { autoescape: false });

  return {
    expressApp,
    plan,
    selectors,
    nunjucksEnv,
  };
};
