import { field, validators as r } from "../../../../src/casa.js";
import isValidPostcode from "../../utils/is-valid-postcode.js";

export default () => [
  field("addressLine1").validators([
    r.required.make({
      errorMsg: "your-address:field.addressLine1.required",
    }),
    r.strlen.make({
      max: 500,
      errorMsgMax: "your-address:field.addressLine1.length",
    }),
  ]),

  field("addressLine2").validators([
    r.strlen.make({
      max: 500,
      errorMsgMax: "your-address:field.addressLine2.length",
    }),
  ]),

  field("town").validators([
    r.strlen.make({
      max: 500,
      errorMsgMax: "your-address:field.town.length",
    }),
  ]),

  field("county").validators([
    r.strlen.make({
      max: 500,
      errorMsgMax: "your-address:field.county.length",
    }),
  ]),

  field("postcode").validators([
    r.required.make({
      errorMsg: "your-address:field.postcode.required",
    }),
    isValidPostcode("your-address:field.postcode.format"),
  ]),
];
