const chai = require('chai');

const { expect } = chai;
const chaiAsPromised = require('chai-as-promised');
const Regex = require('../../../../../lib/validation/rules/regex.js');

chai.use(chaiAsPromised);

const regex = require('../../../../../lib/validation/rules/regex.js');
const ValidationError = require('../../../../../lib/validation/ValidationError.js');

describe('Validation rule: regex', () => {
  it('should reject with a ValidationError', () => {
    const re1 = regex.make({
      pattern: /^[0-9]$/,
    }).validate;

    return expect(re1('bad-args')).to.eventually.be.rejected.and.be.an.instanceOf(ValidationError);
  });

  it('should resolve for matching regular expressions', () => {
    const queue = [];

    queue.push(expect(regex.make().validate('CAN BE ANYTHING BY DEFAULT')).to.be.fulfilled);

    const re1 = regex.make({
      pattern: /^[0-9]{3}$/,
    }).validate;
    queue.push(expect(re1('123')).to.be.fulfilled);
    queue.push(expect(re1('098')).to.be.fulfilled);

    return Promise.all(queue);
  });

  it('should reject for mismatching regular expressions', () => {
    const queue = [];

    const re1 = regex.make({
      pattern: /^[0-9]{3}$/,
    }).validate;
    queue.push(expect(re1('1234')).to.be.rejected);
    queue.push(expect(re1('12')).to.be.rejected);
    queue.push(expect(re1('abc')).to.be.rejected);

    return Promise.all(queue);
  });

  it('should use the custom error message for rejections', () => {
    const queue = [];

    const re1 = regex.make({
      pattern: /^[0-9]{3}$/,
      errorMsg: 'REGEX_ERR',
    }).validate;
    queue.push(expect(re1('1234').catch(err => Promise.reject(JSON.stringify(err)))).to.be.rejectedWith(/REGEX_ERR/));

    return Promise.all(queue);
  });

  it('should allow inverse matches - i.e. reject for matching expressions', () => {
    const queue = [];

    const re1 = regex.make({
      pattern: /^[0-9]{3}$/,
      errorMsg: 'REGEX_ERR',
      invert: true,
    }).validate;

    queue.push(expect(re1('123')).to.be.rejectedWith(/REGEX_ERR/));
    queue.push(expect(re1('098')).to.be.rejectedWith(/REGEX_ERR/));

    return Promise.all(queue);
  });

  it('should resolve for mismatching regular expressions if inverse match is specified', () => {
    const queue = [];

    const re1 = regex.make({
      pattern: /^[0-9]{3}$/,
      invert: true,
    }).validate;
    queue.push(expect(re1('1234')).to.be.fulfilled);
    queue.push(expect(re1('12')).to.be.fulfilled);
    queue.push(expect(re1('abc')).to.be.fulfilled);

    return Promise.all(queue);
  });

  describe('sanitise()', () => {
    [
      // type | input | expected output
      ['string', '', ''],
      ['number', 123, '123'],
      ['object', {}, ''],
      ['function', () => {}, ''],
      ['array', [], ''],
      ['boolean', true, ''],
    ].forEach(([type, input, output]) => {
      it(`should coerce ${type} to a string`, () => {
        const sanitise = Regex.make().sanitise;

        expect(sanitise(input)).to.equal(output);
      });
    });

    it('should let an undefined value pass through', () => {
      const sanitise = Regex.make().sanitise;

      expect(sanitise()).to.be.undefined;
    });
  });
});
