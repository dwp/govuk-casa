import { field } from "../../../../src/casa.js";

export default () => [
  field("meals", { optional: true }).processors([
    (fieldValue) => (Array.isArray(fieldValue) ? fieldValue : undefined),
  ]),
];
