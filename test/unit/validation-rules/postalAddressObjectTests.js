const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const { expect } = chai;

const postalAddressObject = require('../../../lib/validation-rules/postalAddressObject');

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

    queue.push(expect(postalAddressObject({
      address1: 'street',
      address3: 'town',
      postcode: 'AA0 0BB',
    })).to.be.fulfilled);

    return Promise.all(queue);
  });

  it('should resolve for valid address objects, using case insensitivity', () => {
    const queue = [];

    queue.push(expect(postalAddressObject({
      address1: 'Street',
      address3: 'Town',
      postcode: 'AA0 0BB',
    })).to.be.fulfilled);

    return Promise.all(queue);
  });

  it('should reject if an address[1-4] input breaches strlenmax attribute', () => {
    const queue = [];
    const rule = postalAddressObject.bind({
      strlenmax: 10,
    });

    queue.push(expect(rule({
      address1: 'LONGER THAN STRLENMAX',
      address3: 'Town',
      postcode: 'AA0 0BB',
    })).to.be.rejected.eventually.satisfy(v => JSON.stringify(v).match(errorInlineAddress1)));

    return Promise.all(queue);
  });

  it('should resolve for valid address with postcode flagged as optional', () => {
    const rule = postalAddressObject.bind({
      requiredFields: ['address1', 'address2', 'address3', 'address4'],
    });

    return expect(rule({
      address1: 'House',
      address2: 'Street',
      address3: 'Town',
      address4: 'County',
    })).to.be.fulfilled;
  });

  it('should resolve for empty address with all fields flagged as optional', () => {
    const rule = postalAddressObject.bind({
      requiredFields: [],
    });

    return expect(rule({
    })).to.be.fulfilled;
  });

  it('should reject for invalid address objects', () => {
    const queue = [];

    // eslint-disable-next-line arrow-body-style
    queue.push(expect(postalAddressObject()).to.be.rejected.eventually.satisfy((v) => {
      return JSON.stringify(v).match(errorInlineDefault);
    }));

    queue.push(expect(postalAddressObject({
      address2: '$INVALID$',
      address4: '$INVALID$',
    })).to.be.rejected.eventually.satisfy((v) => {
      const s = JSON.stringify(v);
      return s.match(errorInlineAddress1)
        && s.match(errorInlineAddress2)
        && s.match(errorInlineAddress4)
        && s.match(errorInlinePostcode);
    }));

    queue.push(expect(postalAddressObject({
      address3: 'town',
      postcode: 'AA0 0BB',
    })).to.be.rejected.eventually.satisfy(v => JSON.stringify(v).match(errorInlineAddress1)));

    queue.push(expect(postalAddressObject({
      address1: 'street',
      postcode: 'AA0 0BB',
    })).to.be.rejected.eventually.satisfy((v) => {
      const s = JSON.stringify(v);
      return s.match(errorInlineAddress3);
    }));

    queue.push(expect(postalAddressObject({
      address1: 'street',
      address3: 'town',
    })).to.be.rejected.eventually.satisfy((v) => {
      const s = JSON.stringify(v);
      return s.match(errorInlinePostcode);
    }));

    queue.push(expect(postalAddressObject({
      address1: 'street',
      address3: 'town',
      postcode: '!@£$%^&*()<>,.~`/?\\:;"\'{[}]_-+=',
    })).to.be.rejected.eventually.satisfy((v) => {
      const s = JSON.stringify(v);
      return s.match(errorInlinePostcode);
    }));

    queue.push(expect(postalAddressObject({
      address1: 'street',
      address3: 'town',
      postcode: '-',
    })).to.be.rejected.eventually.satisfy((v) => {
      const s = JSON.stringify(v);
      return s.match(errorInlinePostcode);
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

    queue.push(expect(rule({
      address1: '$INVALID$',
      address2: '$INVALID$',
      address3: '$INVALID$',
      address4: '$INVALID$',
      postcode: '$INVALID$',
    }).catch(err => Promise.reject(JSON.stringify(err)))).to.be.rejectedWith(/err1.+err2.+err3.+err4.+err5/));

    queue.push(expect(rule().catch(err => Promise.reject(JSON.stringify(err)))).to.be.rejectedWith(/errdefault/));

    return Promise.all(queue);
  });

  it('should reject for address components only containing spaces', () => {
    const rule = postalAddressObject.bind({
      requiredFields: ['address1', 'address2', 'address3', 'address4'],
    });

    return expect(rule({
      address1: ' ',
      address2: ' ',
      address3: ' ',
      address4: ' ',
    })).to.be.rejected.eventually.satisfy((v) => {
      const s = JSON.stringify(v);
      return s.match(errorInlineAddress1)
        && s.match(errorInlineAddress2)
        && s.match(errorInlineAddress3)
        && s.match(errorInlineAddress4);
    });
  });

  it('should reject invalid postcodes', () => {
    const queue = [];

    queue.push(expect(postalAddressObject({
      address1: 'street',
      address3: 'town',
      postcode: '',
    })).to.be.rejected.eventually.satisfy((v) => {
      const s = JSON.stringify(v);
      return s.match(errorInlinePostcode);
    }));

    queue.push(expect(postalAddressObject({
      address1: 'street',
      address3: 'town',
      postcode: '0A 8AA',
    })).to.be.rejected.eventually.satisfy((v) => {
      const s = JSON.stringify(v);
      return s.match(errorInlinePostcode);
    }));

    queue.push(expect(postalAddressObject({
      address1: 'street',
      address3: 'town',
      postcode: 'A9 HH',
    })).to.be.rejected.eventually.satisfy((v) => {
      const s = JSON.stringify(v);
      return s.match(errorInlinePostcode);
    }));

    return Promise.all(queue);
  });
});
