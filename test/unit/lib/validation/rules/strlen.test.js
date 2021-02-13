const chai = require('chai');

const { expect } = chai;
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const Strlen = require('../../../../../lib/validation/rules/strlen.js');
const ValidationError = require('../../../../../lib/validation/ValidationError.js');

describe('Validation rule: strlen', () => {
  it('should reject with a ValidationError', () => {
    const rule1 = Strlen.make({
      min: 5,
    }).validate;
    return expect(rule1('bad')).to.eventually.be.rejected.and.be.an.instanceOf(ValidationError);
  });

  it('should resolve for strings falling within the defined length parameters', () => {
    const queue = [];

    const rule1 = Strlen.make({
      min: 5,
    }).validate;
    queue.push(expect(rule1('12345')).to.be.fulfilled);
    queue.push(expect(rule1('123456')).to.be.fulfilled);

    const rule2 = Strlen.make({
      max: 5,
    }).validate;
    queue.push(expect(rule2('')).to.be.fulfilled);
    queue.push(expect(rule2('1234')).to.be.fulfilled);

    const rule3 = Strlen.make({
      min: 5,
      max: 10,
    }).validate;
    queue.push(expect(rule3('12345')).to.be.fulfilled);
    queue.push(expect(rule3('1234567890')).to.be.fulfilled);

    return Promise.all(queue);
  });

  it('should reject for strings falling outside the defined length parameters', () => {
    const queue = [];

    const rule1 = Strlen.make({
      min: 5,
    }).validate;
    queue.push(expect(rule1('1234')).to.be.rejected);
    queue.push(expect(rule1('')).to.be.rejected);

    const rule2 = Strlen.make({
      max: 5,
    }).validate;
    queue.push(expect(rule2('123456')).to.be.rejected);
    queue.push(expect(rule2('1234567890')).to.be.rejected);

    const rule3 = Strlen.make({
      min: 5,
      max: 10,
    }).validate;
    queue.push(expect(rule3('1234')).to.be.rejected);
    queue.push(expect(rule3('12345678901')).to.be.rejected);

    return Promise.all(queue);
  });

  it('should use a specific error message if defined', () => {
    const queue = [];

    const rule1 = Strlen.make({
      min: 5,
      max: 10,
      errorMsgMin: 'TEST MIN',
      errorMsgMax: 'TEST MAX',
    }).validate;
    queue.push(expect(rule1('1234').catch(err => Promise.reject(JSON.stringify(err)))).to.be.rejectedWith(/TEST MIN/));
    queue.push(expect(rule1('12345678901').catch(err => Promise.reject(JSON.stringify(err)))).to.be.rejectedWith(/TEST MAX/));

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
        const sanitise = Strlen.make().sanitise;

        expect(sanitise(input)).to.equal(output);
      });
    });

    it('should let an undefined value pass through', () => {
      const sanitise = Strlen.make().sanitise;

      expect(sanitise()).to.be.undefined;
    });
  });
});
