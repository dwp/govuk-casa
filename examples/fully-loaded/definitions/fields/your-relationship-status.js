import { field, validators as r } from "../../../../src/casa.js";

export default () => [
  field("relationshipStatus").validators([
    r.required.make({
      errorMsg: "your-relationship-status:field.relationshipStatus.required",
    }),
    r.inArray.make({
      source: ["husband", "wife", "civilPartner", "other"],
      errorMsg: "your-relationship-status:field.relationshipStatus.required",
    }),
  ]),
];
