import { field, validators as r } from "../../../../src/casa.js";

export default () => [
  field("havePartner").validators([
    r.required.make({
      errorMsg: "live-with-partner:field.havePartner.required",
    }),
    r.inArray.make({
      source: ["yes", "no"],
      errorMsg: "live-with-partner:field.havePartner.required",
    }),
  ]),

  field("partnerDateOfBirth")
    .validators([
      r.required.make({
        errorMsg: {
          summary: "live-with-partner:field.partnerDateOfBirth.required",
          focusSuffix: ["[dd]", "[mm]", "[yyyy]"],
        },
      }),
      r.dateObject.make({
        allowSingleDigitDay: true,
        allowSingleDigitMonth: true,
        beforeOffsetFromNow: { days: 1 },
        errorMsg: {
          summary: "live-with-partner:field.partnerDateOfBirth.format",
          focusSuffix: ["[dd]", "[mm]", "[yyyy]"],
        },
        errorMsgBeforeOffset: {
          summary: "live-with-partner:field.partnerDateOfBirth.future",
          focusSuffix: ["[dd]", "[mm]", "[yyyy]"],
        },
      }),
    ])
    .conditions([
      // Only validate the `partnerDateOfBirth` field if user has partner
      ({ journeyContext: c, waypoint: w }) =>
        c.data?.[w]?.havePartner === "yes",
    ]),
];
