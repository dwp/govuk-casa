import { expect } from "chai";

import postalAddressObject from "../../../src/lib/validators/postalAddressObject.js";
import ValidationError from "../../../src/lib/ValidationError.js";

describe("validators/postalAddressObject", () => {
  const { validate, sanitise } = postalAddressObject.make();

  const errorInlineDefault = "validation:rule.postalAddressObject.group.inline";
  const errorInlineAddress1 =
    "validation:rule.postalAddressObject.address1.inline";
  const errorInlineAddress2 =
    "validation:rule.postalAddressObject.address2.inline";
  const errorInlineAddress3 =
    "validation:rule.postalAddressObject.address3.inline";
  const errorInlineAddress4 =
    "validation:rule.postalAddressObject.address4.inline";
  // const errorInlineAddressRegex = /validation:rule\.postalAddressObject\.address[0-9]+\.inline/;
  const errorInlinePostcode =
    "validation:rule.postalAddressObject.postcode.inline";

  it("should reject with an Array of ValidationError objects", () => {
    return expect(validate("bad-args")).to.satisfy(
      (result) =>
        Array.isArray(result) &&
        result.every((r) => r instanceof ValidationError),
    );
  });

  it("should resolve for valid address objects", () => {
    expect(
      validate({
        address1: "street",
        address3: "town",
        postcode: "AA0 0BB",
      }),
    ).to.be.empty;
  });

  it("should resolve for valid address objects, using case insensitivity", () => {
    expect(
      validate({
        address1: "Street",
        address3: "Town",
        postcode: "AA0 0BB",
      }),
    ).to.be.empty;
  });

  it("should resolve for valid address with a single digit first line", () => {
    expect(
      validate({
        address1: "3",
        address2: "street",
        address3: "town",
        postcode: "AA0 0BB",
      }),
    ).to.be.empty;
  });

  it("should reject if an address[1-4] input breaches strlenmax attribute", () => {
    const rule = postalAddressObject.make({ strlenmax: 10 }).validate;
    expect(
      rule({
        address1: "LONGER THAN STRLENMAX",
        address3: "Town",
        postcode: "AA0 0BB",
      }),
    ).to.satisfy(([e]) => e.inline === errorInlineAddress1);
  });

  it("should resolve for valid address with postcode flagged as optional", () => {
    const rule = postalAddressObject.make({
      requiredFields: ["address1", "address2", "address3", "address4"],
    }).validate;

    expect(
      rule({
        address1: "House",
        address2: "Street",
        address3: "Town",
        address4: "County",
      }),
    ).to.be.empty;
  });

  it("should resolve for empty address with all fields flagged as optional", () => {
    const rule = postalAddressObject.make({ requiredFields: [] }).validate;

    expect(rule({})).to.be.empty;
  });

  it("should reject for invalid address objects", () => {
    expect(validate()).to.satisfy(([e]) => e.inline === errorInlineDefault);

    expect(
      validate({
        address2: "$INVALID$",
        address4: "$INVALID$",
      }),
    ).to.satisfy(
      ([addr1, addr2, addr3, addr4]) =>
        addr1.inline === errorInlineAddress1 &&
        addr2.inline === errorInlineAddress2 &&
        addr3.inline === errorInlineAddress3 &&
        addr4.inline === errorInlineAddress4,
    );

    expect(
      validate({
        address3: "town",
        postcode: "AA0 0BB",
      }),
    ).to.satisfy(([e]) => e.inline === errorInlineAddress1);

    expect(
      validate({
        address1: "street",
        postcode: "AA0 0BB",
      }),
    ).to.satisfy(([e]) => e.inline.match(errorInlineAddress3));

    expect(
      validate({
        address1: "street",
        address3: "town",
      }),
    ).to.satisfy(([e]) => e.inline.match(errorInlinePostcode));

    expect(
      validate({
        address1: "street",
        address3: "town",
        postcode: "!@£$%^&*()<>,.~`/?\\:;\"'{[}]_-+=",
      }),
    ).to.satisfy(([e]) => e.inline.match(errorInlinePostcode));

    expect(
      validate({
        address1: "street",
        address3: "town",
        postcode: "-",
      }),
    ).to.satisfy(([e]) => e.inline === errorInlinePostcode);

    expect(
      validate({
        address1: "house",
        address2: "8",
        address3: "town",
        postcode: "SW1 3SW",
      }),
    ).to.satisfy(([e]) => e.inline.match(errorInlineAddress2));
  });

  it("should use a specific error message if defined", () => {
    const rule = postalAddressObject.make({
      errorMsg: "errdefault",
      errorMsgAddress1: "err1",
      errorMsgAddress2: "err2",
      errorMsgAddress3: "err3",
      errorMsgAddress4: "err4",
      errorMsgPostcode: "err5",
    }).validate;

    expect(
      rule({
        address1: "$INVALID$",
        address2: "$INVALID$",
        address3: "$INVALID$",
        address4: "$INVALID$",
        postcode: "$INVALID$",
      }),
    ).to.satisfy(
      ([addr1, addr2, addr3, addr4, postcode]) =>
        addr1.inline === "err1" &&
        addr2.inline === "err2" &&
        addr3.inline === "err3" &&
        addr4.inline === "err4" &&
        postcode.inline === "err5",
    );

    expect(rule()).to.satisfy(([e]) => e.inline.match(/errdefault/));
  });

  it("should reject for address components only containing spaces", () => {
    const rule = postalAddressObject.make({
      requiredFields: ["address1", "address2", "address3", "address4"],
    }).validate;

    expect(
      rule({
        address1: " ",
        address2: " ",
        address3: " ",
        address4: " ",
      }),
    ).to.satisfy(
      ([addr1, addr2, addr3, addr4]) =>
        addr1.inline.match(errorInlineAddress1) &&
        addr2.inline.match(errorInlineAddress2) &&
        addr3.inline.match(errorInlineAddress3) &&
        addr4.inline.match(errorInlineAddress4),
    );
  });

  /**
   *
   * @param postcode
   */
  function testPostcodeChecker(postcode) {
    return validate({
      address1: "street",
      address3: "town",
      postcode,
    });
  }

  /**
   *
   * @param postcode
   */
  function testValidPostcodeChecker(postcode) {
    expect(testPostcodeChecker(postcode)).to.be.empty;
  }
  /**
   *
   * @param postcode
   */
  function testInvalidPostcodeChecker(postcode) {
    return expect(testPostcodeChecker(postcode)).to.satisfy((v) => {
      const s = JSON.stringify(v);
      return s.match(errorInlinePostcode);
    });
  }

  it("should reject invalid postcodes", () => {
    testInvalidPostcodeChecker("");
    testInvalidPostcodeChecker("0A 8AA");
    testInvalidPostcodeChecker("A9 HH");
    testInvalidPostcodeChecker("e107aee");
  });

  it("should accept valid postcodes", () => {
    testValidPostcodeChecker("AA0 0BB");
    testValidPostcodeChecker("YO40 4RN");
    testValidPostcodeChecker("SW1A 0AA");
    testValidPostcodeChecker("G72 6AA");
    testValidPostcodeChecker("LL31 9LS");
    testValidPostcodeChecker("AB30 1YT");
    testValidPostcodeChecker("PL11 2LL");
    testValidPostcodeChecker("DY10 3XH");
    testValidPostcodeChecker("BD9 4JR");
    testValidPostcodeChecker("NE31 2TB");
    testValidPostcodeChecker("NN16 9EH");
    testValidPostcodeChecker("BB2 6DN");
    testValidPostcodeChecker("DY5 9BG");
  });

  it("should reject invalid special case postcodes", () => {
    // givenQVXInTheFirstPosition
    testInvalidPostcodeChecker("QA9B 9DD");

    // givenIJZInTheSecondPosition
    testInvalidPostcodeChecker("AI9B 9DD");

    // givenILMNOQRVXYZInTheThirdPosition
    testInvalidPostcodeChecker("A9L 9DD");

    // givenCDFGIJKLOQSTUZInTheFourthPosition
    testInvalidPostcodeChecker("AI9C 9DD");

    // givenCIKMOVInTheLastPosition
    testInvalidPostcodeChecker("AI9C 9DK");

    // givenCIKMOVInThePenultimatePosition
    testInvalidPostcodeChecker("AI9C 9KD");
  });

  it("handle BFPO postcodes", () => {
    // givenQVXInTheFirstPosition
    testValidPostcodeChecker("BFPO 1");
    testValidPostcodeChecker("BFPO 1234");

    testInvalidPostcodeChecker("BFPO 12345");
    testInvalidPostcodeChecker("BFPO");
    testInvalidPostcodeChecker("BFPO 3AA");
  });

  describe("sanitise", () => {
    [
      // type | input | expected output
      ["string", "", {}],
      ["number", 123, {}],
      ["function", () => {}, {}],
      ["array", [], {}],
      ["boolean", true, {}],
      ["undefined", undefined, {}],
    ].forEach(([type, input, output]) => {
      it(`should coerce ${type} to an object`, () => {
        expect(sanitise(input)).to.deep.equal(output);
      });
    });

    it("should prune unrecognised attributes", () => {
      expect(
        sanitise({
          unknown: "",
          address2_custom: "another",
          address1: "street",
          address2: "suburb",
          address3: "town",
          address4: "province",
          postcode: "",
        }),
      ).to.deep.equal({
        address1: "street",
        address2: "suburb",
        address3: "town",
        address4: "province",
        postcode: "",
      });
    });

    it("should coerce each attribute to a string", () => {
      expect(
        sanitise({
          address1: 1,
          address2: [],
          address3: () => {},
          address4: true,
          postcode: new Set(),
        }),
      ).to.deep.equal({
        address1: "1",
        address2: "",
        address3: "",
        address4: "",
        postcode: "",
      });
    });
  });
});
