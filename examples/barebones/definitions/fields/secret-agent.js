import { field, validators as r } from "@dwp/govuk-casa";

export default () => [
  field("license", { optional: true }).validators([
    r.strlen.make({
      max: 20,
      errorMsgMax: "The license id is too long",
    }),
  ]),
];
