import { expect } from "chai";

import { load } from "cheerio";
import nunjucks from "../../../src/lib/nunjucks.js";

const njks = nunjucks({
  views: ["views", "node_modules/govuk-frontend/"],
});

describe("Character count  macro", () => {
  it("should render default component when called", () => {
    const output = njks.render(
      "./casa/components/character-count/template.njk",
      {
        params: {
          name: "inputName",
          maxlength: 200,
          label: {
            text: "inputLabel",
            classes: "govuk-label--l",
          },
          hint: {
            text: "hintText",
          },
          items: [
            {
              value: "yes",
              text: "Yes",
            },
            {
              value: "no",
              text: "No",
            },
          ],
        },
      },
    );
    const $ = load(output);
    const textarea = $("textarea");
    const label = $("label");
    const div = $("div");

    expect(textarea.get(0).attribs.name).to.equal("inputName");
    expect(textarea.get(0).attribs.id).to.equal("f-inputName");
    expect(label.get(0).attribs.for).to.equal("f-inputName");
    expect(div.get(3).attribs.class).to.equal(
      "govuk-hint govuk-character-count__message",
    );
    expect(div.get(3).children[0].data).to.include(
      "You can enter up to 200 characters",
    );
  });

  it("should render error message when supplied", () => {
    const output = njks.render(
      "./casa/components/character-count/template.njk",
      {
        params: {
          name: "inputName",
          maxlength: 200,
          label: {
            text: "inputLabel",
            classes: "govuk-label--l",
          },
          hint: {
            text: "hintText",
          },
          items: [
            {
              value: "yes",
              text: "Yes",
            },
            {
              value: "no",
              text: "No",
            },
          ],
          casaErrors: {
            inputName: "Error",
          },
        },
        t: (item) => item,
      },
    );
    const $ = load(output);
    const div = $("div");
    const p = $("p");
    const textarea = $("textarea");

    expect(div.get(0).attribs.class).to.equal("govuk-character-count");
    expect(p.get(0).attribs.class).to.equal("govuk-error-message");
    expect(textarea.get(0).attribs.class).to.equal(
      "govuk-textarea govuk-textarea--error govuk-js-character-count",
    );
    expect(textarea.get(0).attribs["aria-describedby"]).to.equal(
      "f-inputName-info f-inputName-hint f-inputName-error",
    );
    expect(p.get(0).attribs["data-ga-question"]).to.equal(undefined);
  });

  it("should render data analytics tags when flagged", () => {
    const output = njks.render(
      "./casa/components/character-count/template.njk",
      {
        params: {
          name: "inputName",
          maxlength: 200,
          label: {
            html: "inputLabel",
            classes: "govuk-label--l",
          },
          hint: {
            text: "hintText",
          },
          items: [
            {
              value: "yes",
              text: "Yes",
            },
            {
              value: "no",
              text: "No",
            },
          ],
          casaWithAnalytics: true,
          casaErrors: {
            inputName: "Error",
          },
        },
        t: (item) => item,
      },
    );
    const $ = load(output);
    const p = $("p");

    expect(p.get(0).attribs["data-ga-question"]).to.equal("inputLabel");
  });

  it("should strip html tags from the data-ga-question value", () => {
    const output = njks.render(
      "./casa/components/character-count/template.njk",
      {
        params: {
          name: "inputName",
          maxlength: 200,
          label: {
            html: "<marquee>inputLabel</marquee>",
          },
          hint: {
            text: "hintText",
          },
          items: [
            {
              value: "yes",
              text: "Yes",
            },
            {
              value: "no",
              text: "No",
            },
          ],
          casaWithAnalytics: true,
          casaErrors: {
            inputName: "Error",
          },
        },
        t: (item) => item,
      },
    );
    const $ = load(output);
    const p = $("p");

    expect(p.get(0).attribs["data-ga-question"]).to.equal("inputLabel");
  });
});
