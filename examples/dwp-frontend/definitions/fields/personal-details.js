import { field, validators as r } from "@dwp/govuk-casa";

export default () => [
  field("firstName").validators([
    r.required.make({
      errorMsg: "personal-details:field.firstName.empty",
    }),
  ]),

  field("lastName").validators([
    r.required.make({
      errorMsg: "personal-details:field.lastName.empty",
    }),
  ]),

  field("nino").validators([
    r.required.make({
      errorMsg: "personal-details:field.nino.empty",
    }),
    r.nino.make(),
  ]),
];
