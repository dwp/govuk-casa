import { expect } from "chai";
import { dirname } from "path";
import { fileURLToPath } from "url";

import CasaTemplateLoader from "../../src/lib/CasaTemplateLoader.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("CasaTemplateLoder", () => {
  describe("modifyBlock()", () => {
    it("applies block modifications to the original source", () => {
      const loader = new CasaTemplateLoader([__dirname]);

      loader.modifyBlock("head", () => "NEW CONTENT");

      expect(
        loader
          .getSource("test-template.njk")
          .src.replace(/\n/g, "")
          .replace(/\s+/g, " "),
      ).to.contain(
        "{% block head %}NEW CONTENT Original Content{% endblock %}",
      );
    });

    it("throws an Error when  given an unrecognised block name", () => {
      const loader = new CasaTemplateLoader([__dirname]);

      expect(() => loader.modifyBlock("test", () => "")).to.throw(
        Error,
        'Block "test" is not a recognised template block.',
      );
    });
  });
});
