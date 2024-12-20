import { expect } from "chai";

import { load } from "cheerio";
import nunjucks from "../../../src/lib/nunjucks.js";

const njks = nunjucks({
  views: ["views", "node_modules/govuk-frontend/"],
});

describe("Checkboxes macro", () => {
  it("should render default component when called", () => {
    const output = njks.render("./casa/components/checkboxes/template.njk", {
      params: {
        name: "checkboxName",
        fieldset: {
          legend: {
            text: "Checkbox legend",
          },
        },
        hint: {
          text: "Checkbox hint",
        },
        items: [
          {
            value: "twistedflax",
            text: "Twisted Flax",
          },
          {
            value: "tworeeds",
            text: "Two Reeds",
          },
        ],
      },
    });
    const $ = load(output);
    const input = $("input");
    const legend = $("legend");
    const div = $("div");

    expect(input.get(0).attribs.name).to.equal("checkboxName[]");
    expect(input.get(0).attribs.id).to.equal("f-checkboxName");
    expect(input.get(1).attribs.name).to.equal("checkboxName[]");
    expect(input.get(1).attribs.id).to.equal("f-checkboxName-2");
    expect(legend.get(0).children[0].data).to.include("Checkbox legend");
    expect(div.get(1).children[0].data).to.include("Checkbox hint");
  });

  it("should render the errors supplied", () => {
    const output = njks.render("./casa/components/checkboxes/template.njk", {
      params: {
        name: "checkboxName",
        casaErrors: {
          checkboxName: "error",
        },
        fieldset: {
          legend: {
            text: "Checkbox legend",
          },
        },
        hint: {
          text: "Checkbox hint",
        },
        items: [
          {
            value: "twistedflax",
            text: "Twisted Flax",
          },
          {
            value: "tworeeds",
            text: "Two Reeds",
          },
        ],
      },
      t: (item) => item,
    });
    const $ = load(output);
    const div = $("div");
    const p = $("p");

    expect(div.get(0).attribs.class).to.equal(
      "govuk-form-group govuk-form-group--error",
    );
    expect(p.get(0).attribs.id).to.equal("f-checkboxName-error");
    expect(p.get(0).attribs.class).to.equal("govuk-error-message");
    expect(p.get(0).attribs["data-ga-question"]).to.equal(undefined);
  });

  it("should render data analytics tags when flagged", () => {
    const output = njks.render("./casa/components/checkboxes/template.njk", {
      params: {
        name: "checkboxName",
        casaErrors: {
          checkboxName: "error",
        },
        casaWithAnalytics: true,
        fieldset: {
          legend: {
            text: "Checkbox legend",
          },
        },
        hint: {
          text: "Checkbox hint",
        },
        items: [
          {
            value: "twistedflax",
            text: "Twisted Flax",
          },
          {
            value: "tworeeds",
            text: "Two Reeds",
          },
        ],
      },
      t: (item) => item,
    });
    const $ = load(output);
    const p = $("p");

    expect(p.get(0).attribs["data-ga-question"]).to.equal("Checkbox legend");
  });

  it("should strip html tags from the data-ga-question value", () => {
    const output = njks.render("./casa/components/checkboxes/template.njk", {
      params: {
        name: "checkboxName",
        casaErrors: {
          checkboxName: "error",
        },
        casaWithAnalytics: true,
        fieldset: {
          legend: {
            html: '<span class="visually hidden">Checkbox legend</span>',
          },
        },
        hint: {
          text: "Checkbox hint",
        },
        items: [
          {
            value: "twistedflax",
            text: "Twisted Flax",
          },
          {
            value: "tworeeds",
            text: "Two Reeds",
          },
        ],
      },
      t: (item) => item,
    });
    const $ = load(output);
    const p = $("p");

    expect(p.get(0).attribs["data-ga-question"]).to.equal("Checkbox legend");
  });
});
