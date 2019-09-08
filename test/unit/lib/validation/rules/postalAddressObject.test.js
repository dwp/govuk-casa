const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const { expect } = chai;

const postalAddressObject = require('../../../../../lib/validation/rules/postalAddressObject.js');

describe('Validation rule: postalAddressObject', () => {
  const errorInlineDefault = 'validation:rule.postalAddressObject.group.inline';
  const errorInlineAddress1 = 'validation:rule.postalAddressObject.address1.inline';
  const errorInlineAddress2 = 'validation:rule.postalAddressObject.address2.inline';
  const errorInlineAddress3 = 'validation:rule.postalAddressObject.address3.inline';
  const errorInlineAddress4 = 'validation:rule.postalAddressObject.address4.inline';
  // const errorInlineAddressRegex = /validation:rule\.postalAddressObject\.address[0-9]+\.inline/;
  const errorInlinePostcode = 'validation:rule.postalAddressObject.postcode.inline';

  it('should resolve for valid address objects', () => {
    const queue = [];

    queue.push(
      expect(
        postalAddressObject({
          address1: 'street',
          address3: 'town',
          postcode: 'AA0 0BB',
        }),
      ).to.be.fulfilled,
    );

    return Promise.all(queue);
  });

  it('should resolve for valid address objects, using case insensitivity', () => {
    const queue = [];

    queue.push(
      expect(
        postalAddressObject({
          address1: 'Street',
          address3: 'Town',
          postcode: 'AA0 0BB',
        }),
      ).to.be.fulfilled,
    );

    return Promise.all(queue);
  });

  it('should resolve for valid address with a single digit first line', () => {
    const queue = [];

    queue.push(expect(postalAddressObject({
      address1: '3',
      address2: 'street',
      address3: 'town',
      postcode: 'AA0 0BB',
    })).to.be.fulfilled);

    return Promise.all(queue);
  });

  it('should reject if an address[1-4] input breaches strlenmax attribute', () => {
    const queue = [];
    const rule = postalAddressObject.bind({
      strlenmax: 10,
    });

    queue.push(
      expect(
        rule({
          address1: 'LONGER THAN STRLENMAX',
          address3: 'Town',
          postcode: 'AA0 0BB',
        }),
      ).to.be.rejected.eventually.satisfy((v) => JSON.stringify(v).match(errorInlineAddress1)),
    );

    return Promise.all(queue);
  });

  it('should resolve for valid address with postcode flagged as optional', () => {
    const rule = postalAddressObject.bind({
      requiredFields: ['address1', 'address2', 'address3', 'address4'],
    });

    return expect(
      rule({
        address1: 'House',
        address2: 'Street',
        address3: 'Town',
        address4: 'County',
      }),
    ).to.be.fulfilled;
  });

  it('should resolve for empty address with all fields flagged as optional', () => {
    const rule = postalAddressObject.bind({
      requiredFields: [],
    });

    return expect(rule({})).to.be.fulfilled;
  });

  it('should reject for invalid address objects', () => {
    const queue = [];

    // eslint-disable-next-line arrow-body-style
    queue.push(
      expect(postalAddressObject()).to.be.rejected.eventually
        .satisfy((v) => JSON.stringify(v).match(errorInlineDefault)),
    );

    queue.push(
      expect(
        postalAddressObject({
          address2: '$INVALID$',
          address4: '$INVALID$',
        }),
      ).to.be.rejected.eventually.satisfy((v) => {
        const s = JSON.stringify(v);
        return (
          s.match(errorInlineAddress1)
          && s.match(errorInlineAddress2)
          && s.match(errorInlineAddress4)
          && s.match(errorInlinePostcode)
        );
      }),
    );

    queue.push(
      expect(
        postalAddressObject({
          address3: 'town',
          postcode: 'AA0 0BB',
        }),
      ).to.be.rejected.eventually.satisfy((v) => JSON.stringify(v).match(errorInlineAddress1)),
    );

    queue.push(
      expect(
        postalAddressObject({
          address1: 'street',
          postcode: 'AA0 0BB',
        }),
      ).to.be.rejected.eventually.satisfy((v) => {
        const s = JSON.stringify(v);
        return s.match(errorInlineAddress3);
      }),
    );

    queue.push(
      expect(
        postalAddressObject({
          address1: 'street',
          address3: 'town',
        }),
      ).to.be.rejected.eventually.satisfy((v) => {
        const s = JSON.stringify(v);
        return s.match(errorInlinePostcode);
      }),
    );

    queue.push(
      expect(
        postalAddressObject({
          address1: 'street',
          address3: 'town',
          postcode: '!@£$%^&*()<>,.~`/?\\:;"\'{[}]_-+=',
        }),
      ).to.be.rejected.eventually.satisfy((v) => {
        const s = JSON.stringify(v);
        return s.match(errorInlinePostcode);
      }),
    );

    queue.push(
      expect(
        postalAddressObject({
          address1: 'street',
          address3: 'town',
          postcode: '-',
        }),
      ).to.be.rejected.eventually.satisfy((v) => {
        const s = JSON.stringify(v);
        return s.match(errorInlinePostcode);
      }),
    );

    queue.push(expect(postalAddressObject({
      address1: 'house',
      address2: '8',
      address3: 'town',
      postcode: 'SW1 3SW',
    })).to.be.rejected.eventually.satisfy((v) => {
      const s = JSON.stringify(v);
      return s.match(errorInlineAddress2);
    }));


    return Promise.all(queue);
  });

  it('should use a specific error message if defined', () => {
    const rule = postalAddressObject.bind({
      errorMsg: 'errdefault',
      errorMsgAddress1: 'err1',
      errorMsgAddress2: 'err2',
      errorMsgAddress3: 'err3',
      errorMsgAddress4: 'err4',
      errorMsgPostcode: 'err5',
    });
    const queue = [];

    queue.push(
      expect(
        rule({
          address1: '$INVALID$',
          address2: '$INVALID$',
          address3: '$INVALID$',
          address4: '$INVALID$',
          postcode: '$INVALID$',
        }).catch((err) => Promise.reject(JSON.stringify(err))),
      ).to.be.rejectedWith(/err1.+err2.+err3.+err4.+err5/),
    );

    queue.push(
      expect(rule().catch((err) => Promise.reject(JSON.stringify(err)))).to.be.rejectedWith(
        /errdefault/,
      ),
    );

    return Promise.all(queue);
  });

  it('should reject for address components only containing spaces', () => {
    const rule = postalAddressObject.bind({
      requiredFields: ['address1', 'address2', 'address3', 'address4'],
    });

    return expect(
      rule({
        address1: ' ',
        address2: ' ',
        address3: ' ',
        address4: ' ',
      }),
    ).to.be.rejected.eventually.satisfy((v) => {
      const s = JSON.stringify(v);
      return (
        s.match(errorInlineAddress1)
        && s.match(errorInlineAddress2)
        && s.match(errorInlineAddress3)
        && s.match(errorInlineAddress4)
      );
    });
  });

  function testPostcodeChecker(postcode) {
    return postalAddressObject({
      address1: 'street',
      address3: 'town',
      postcode,
    });
  }

  function testValidPostcodeChecker(postcode) {
    return expect(testPostcodeChecker(postcode)).to.be.fulfilled;
  }
  function testInvalidPostcodeChecker(postcode) {
    return expect(testPostcodeChecker(postcode)).to.be.rejected.eventually.satisfy((v) => {
      const s = JSON.stringify(v);
      return s.match(errorInlinePostcode);
    });
  }

  it('should reject invalid postcodes', () => {
    const queue = [];

    queue.push(testInvalidPostcodeChecker(''));
    queue.push(testInvalidPostcodeChecker('0A 8AA'));
    queue.push(testInvalidPostcodeChecker('A9 HH'));
    queue.push(testInvalidPostcodeChecker('e107aee'));
    return Promise.all(queue);
  });

  it('should accept valid postcodes', () => {
    const queue = [];

    queue.push(testValidPostcodeChecker('AA0 0BB'));
    queue.push(testValidPostcodeChecker('YO40 4RN'));
    queue.push(testValidPostcodeChecker('SW1A 0AA'));
    queue.push(testValidPostcodeChecker('G72 6AA'));
    queue.push(testValidPostcodeChecker('LL31 9LS'));
    queue.push(testValidPostcodeChecker('AB30 1YT'));
    queue.push(testValidPostcodeChecker('PL11 2LL'));
    queue.push(testValidPostcodeChecker('DY10 3XH'));
    queue.push(testValidPostcodeChecker('BD9 4JR'));
    queue.push(testValidPostcodeChecker('NE31 2TB'));
    queue.push(testValidPostcodeChecker('NN16 9EH'));
    queue.push(testValidPostcodeChecker('BB2 6DN'));
    queue.push(testValidPostcodeChecker('DY5 9BG'));

    return Promise.all(queue);
  });

  it('should reject invalid special case postcodes', () => {
    const queue = [];

    // givenQVXInTheFirstPosition
    queue.push(testInvalidPostcodeChecker('QA9B 9DD'));

    // givenIJZInTheSecondPosition
    queue.push(testInvalidPostcodeChecker('AI9B 9DD'));

    // givenILMNOQRVXYZInTheThirdPosition
    queue.push(testInvalidPostcodeChecker('A9L 9DD'));

    // givenCDFGIJKLOQSTUZInTheFourthPosition
    queue.push(testInvalidPostcodeChecker('AI9C 9DD'));

    // givenCIKMOVInTheLastPosition
    queue.push(testInvalidPostcodeChecker('AI9C 9DK'));

    // givenCIKMOVInThePenultimatePosition
    queue.push(testInvalidPostcodeChecker('AI9C 9KD'));

    return Promise.all(queue);
  });

  it('handle BFPO postcodes', () => {
    const queue = [];

    // givenQVXInTheFirstPosition
    queue.push(testValidPostcodeChecker('BFPO 1'));
    queue.push(testValidPostcodeChecker('BFPO 1234'));

    queue.push(testInvalidPostcodeChecker('BFPO 12345'));
    queue.push(testInvalidPostcodeChecker('BFPO'));
    queue.push(testInvalidPostcodeChecker('BFPO 3AA'));

    return Promise.all(queue);
  });
});
