import { field } from "../../../../src/casa.js";

export default () => [
  field("accounts", { optional: true }).processors([
    (fieldValue) => (Array.isArray(fieldValue) ? fieldValue : undefined),
  ]),
];
