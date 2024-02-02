import { field, validators as r } from "../../../../src/casa.js";

export default () => [
  field("assetsValue").validators([
    r.required.make({
      errorMsg: "your-assets:field.assetsValue.required",
    }),
    r.range.make({
      min: 1,
      max: 1000000000,
      errorMsgMax: "your-assets:field.assetsValue.tooMuch",
      errorMsgMin: "your-assets:field.assetsValue.tooLess",
    }),
  ]),
];
