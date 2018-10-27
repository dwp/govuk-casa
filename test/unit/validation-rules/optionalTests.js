const chai = require('chai');

const { expect } = chai;
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const optional = require('../../../lib/validation-rules/optional');

describe('Validation rule: optional', () => {
  it('should return true if the value is empty', () => {
    /* eslint-disable no-unused-expressions */
    expect(optional('')).to.be.true;
    expect(optional()).to.be.true;
    expect(optional(null)).to.be.true;
    expect(optional({ dd: '', mm: '', yyyy: '' })).to.be.true;
    expect(optional({
      attr1: '', attr2: null, attr3: undefined, attr4: []
    })).to.be.true;
    /* eslint-enable no-unused-expressions */
  });

  it('should return false if the value is not empty', () => {
    /* eslint-disable no-unused-expressions */
    expect(optional('value')).to.be.false;
    expect(optional(123)).to.be.false;
    expect(optional('null')).to.be.false;
    expect(optional(' ')).to.be.false;
    expect(optional(' v')).to.be.false;
    expect(optional({ dd: '01', mm: '02', yyyy: '2121' })).to.be.false;
    expect(optional({
      attr1: 'x', attr2: null, attr3: undefined, attr4: ' '
    })).to.be.false;
    /* eslint-enable no-unused-expressions */
  });
});
