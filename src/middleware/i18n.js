import { createInstance } from "i18next";
import { LanguageDetector, handle } from "i18next-http-middleware";
import { resolve, basename } from "node:path";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import deepmerge from "deepmerge";
import yaml from "js-yaml";
import logger from "../lib/logger.js";

const log = logger("middleware:i18n");

const loadJson = (file) => {
  // Strip out newlines (this is a legacy feature which we're keeping for
  // backwards compatibility).
  /* eslint-disable-next-line security/detect-non-literal-fs-filename */
  const json = readFileSync(file, "utf8");
  return JSON.parse(json.replace(/[\r\n]/g, ""));
};

/* eslint-disable-next-line security/detect-non-literal-fs-filename */
const loadYaml = (file) => yaml.load(readFileSync(file, "utf8"));

const extract = (file) => {
  const ext = /.yaml$/i.test(file) ? ".yaml" : ".json";
  const data = ext === ".yaml" ? loadYaml(file) : loadJson(file);

  return {
    ns: basename(file, ext),
    data,
  };
};

const loadResources = (languages, directories) => {
  const store = Object.create(null);

  for (const language of languages) {
    // ESLint disabled as `store`, `language` and `ns` are all dev-controlled,
    // and this function is only called once, at boot-time.
    /* eslint-disable security/detect-object-injection */
    store[language] = Object.create(null);

    for (const basedir of directories) {
      const dir = resolve(basedir, language);
      /* eslint-disable-next-line security/detect-non-literal-fs-filename */
      if (!existsSync(dir)) {
        continue;
      }

      log.info("Loading %s language from %s ...", language, dir);
      /* eslint-disable-next-line security/detect-non-literal-fs-filename */
      for (const file of readdirSync(dir)) {
        const { ns, data } = extract(resolve(dir, file));

        if (store[language][ns] === undefined) {
          store[language][ns] = Object.create(null);
        }

        store[language][ns] = deepmerge(store[language][ns], data);
      }
    }
    /* eslint-enable security/detect-object-injection */
  }

  return store;
};

/**
 * @param opts
 * @param opts.languages
 * @param opts.directories
 */
export default function i18nMiddleware({
  languages = ["en", "cy"],
  directories = [],
}) {
  // Load _all_ translations, from all directories into memory.
  const resources = loadResources(languages, directories);

  // Configure i18next
  const i18nInstance = createInstance();
  i18nInstance.use(LanguageDetector).init({
    initImmediate: false, // because we need synchronous loading
    supportedLngs: languages,
    fallbackLng: false,
    defaultNS: "common",
    // debug: true,

    // All translation resources
    resources,

    // LanguageDetector options
    detection: {
      lookupQuerystring: "lang",
      lookupSession: "language",
      order: ["querystring", "session"],
    },
  });

  // 2 middleware: one to read/set the session language, and one to enhance the
  // req/res objects with i18n features
  return [
    (req, res, next) => {
      if (!req.session.language) {
        req.session.language = languages[0];
      }
      if (req?.query.lang && languages.includes(req.query.lang)) {
        req.session.language = String(req.query.lang);
      }
      next();
    },
    handle(i18nInstance),
  ];
}
