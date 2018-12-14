const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const { expect } = chai;
chai.use(chaiAsPromised);

const GatherModifier = require('../../../lib/GatherModifier.js');

/* eslint-disable no-unused-expressions */
describe('GatherModifier', () => {
  describe('GatherModifier ', () => {
    it('should an object with at least two known gatherers', () => {
      expect(GatherModifier).to.be.an('object');
      expect(GatherModifier.trimWhitespace).to.be.an('function');
      expect(GatherModifier.trimPostalAddressObject).to.be.an('function');
    });
  });

  describe('trimWhitespace ', () => {
    it('should remove whitespace', () => {
      expect(GatherModifier.trimWhitespace({ fieldValue: '  xyz' })).to.equal('xyz');
      expect(GatherModifier.trimWhitespace({ fieldValue: 'xyz  ' })).to.equal('xyz');
      expect(GatherModifier.trimWhitespace({ fieldValue: '  xyz  ' })).to.equal('xyz');
      expect(GatherModifier.trimWhitespace({ fieldValue: 'x yz' })).to.equal('x yz');
    });
    it('copes with non strings', () => {
      expect(GatherModifier.trimWhitespace({})).to.equal();
      expect(GatherModifier.trimWhitespace({ fieldValue: 999 })).to.equal(999);
      expect(GatherModifier.trimWhitespace({ fieldValue: null })).to.equal(null);
    });
  });

  /**
   * Test this is a valid address structure
   *
   * @param {object} v address object
   * @returns {boolean} true if valid
   */
  function validAddressStructure(v) {
    expect(v).to.have.property('address1');
    expect(v).to.have.property('address2');
    expect(v).to.have.property('address3');
    expect(v).to.have.property('address4');
    expect(v).to.have.property('postcode');
    expect(v).not.to.have.property('dodgy');
  }

  describe('trimPostalAddressObject ', () => {
    it('returns a valid address given an invalid one', () => {
      const v = GatherModifier.trimPostalAddressObject({ fieldValue: { dodgy: 'value' } });
      validAddressStructure(v);
    });

    it('returns a valid address with items all trimmed', () => {
      const v = GatherModifier.trimPostalAddressObject({
        fieldValue: {
          dodgy: 'value',
          address1: ' address1 ',
          address2: ' address2 ',
          address3: ' address3 ',
          address4: ' address4 ',
          postcode: ' W1 1QA ',
        },
      });
      validAddressStructure(v);
      expect(v.address1).to.equal('address1');
      expect(v.address2).to.equal('address2');
      expect(v.address3).to.equal('address3');
      expect(v.address4).to.equal('address4');
      expect(v.postcode).to.equal('W1 1QA');
    });

    it('reformats the postcode with extra spaces', () => {
      const v = GatherModifier.trimPostalAddressObject({
        fieldValue: {
          postcode: ' W1     1QA ',
        },
      });
      validAddressStructure(v);
      expect(v.postcode).to.equal('W1 1QA');
    });

    it('reformats the postcode with no spaces', () => {
      const v = GatherModifier.trimPostalAddressObject({
        fieldValue: {
          postcode: 'W11QA',
        },
      });
      validAddressStructure(v);
      expect(v.postcode).to.equal('W1 1QA');
    });

    it('reformats the postcode with lower', () => {
      const v = GatherModifier.trimPostalAddressObject({
        fieldValue: {
          postcode: 'w1 1qa',
        },
      });
      validAddressStructure(v);
      expect(v.postcode).to.equal('W1 1QA');
    });
  });
});
