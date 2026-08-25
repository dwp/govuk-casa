import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ExpressJS from "express";
import session from "express-session";
import request from "supertest";

import i18nMiddleware from "../../src/middleware/i18n.js";

describe("i18n middleware", () => {
  let localesDir;

  beforeEach(() => {
    localesDir = mkdtempSync(join(tmpdir(), "casa-i18n-"));
    const enDir = join(localesDir, "en");
    mkdirSync(enDir);

    writeFileSync(
      join(enDir, "common.json"),
      JSON.stringify({ greeting: "Hello" }),
    );
    // Files that should be ignored when loading translation resources
    writeFileSync(join(enDir, ".DS_Store"), "not json");
    writeFileSync(join(enDir, "README.md"), "not json");
  });

  afterEach(() => {
    rmSync(localesDir, { recursive: true, force: true });
  });

  it("ignores non-translation files such as .DS_Store when loading resources", (done) => {
    const app = ExpressJS();
    app.use(
      session({ secret: "test", resave: false, saveUninitialized: true }),
    );
    app.use(i18nMiddleware({ languages: ["en"], directories: [localesDir] }));
    app.get("/", (req, res) => {
      res.status(200).send(req.t("common:greeting"));
    });

    request(app).get("/").expect(200, "Hello", done);
  });
});
