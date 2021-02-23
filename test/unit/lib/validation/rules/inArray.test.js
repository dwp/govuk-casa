const chai = require('chai');

const { expect } = chai;
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const inArray = require('../../../../../lib/validation/rules/inArray.js');
const ValidationError = require('../../../../../lib/validation/ValidationError.js');

describe('Validation rule: inArray', () => {
  it('should reject with a ValidationError', () => {
    return expect(inArray.make().validate('bad-args')).to.eventually.be.rejected.and.be.an.instanceOf(ValidationError);
  });

  it('should resolve if value is contained within array', () => {
    const rule = inArray.make({
      source: ['a', 'b', 'c'],
    }).validate;
    const queue = [];

    const result = rule('b');
    queue.push(expect(result).to.be.a('Promise'));
    queue.push(expect(result).to.be.fulfilled);
    queue.push(expect(rule(['a'])).to.be.fulfilled);
    queue.push(expect(rule(['a', 'b'])).to.be.fulfilled);

    return Promise.all(queue);
  });

  it('should reject if value is null', () => expect(inArray.make().validate(null)).to.be.rejected);

  it('should reject if value is undefined', () => expect(inArray.make().validate()).to.be.rejected);

  it('should reject if value is not contained within array', () => {
    const rule = inArray.make({
      source: ['a', 'b', 'c'],
    }).validate;
    const queue = [];

    let result = rule('not present').catch(() => (false));
    queue.push(expect(result).to.be.a('Promise'));

    result = rule(['a', 'b', 'not present']);
    queue.push(expect(result).to.be.rejected);

    queue.push(expect(rule([])).to.be.rejected);

    queue.push(expect(inArray.make({
      source: [undefined],
    }).validate()).to.be.rejected);

    queue.push(expect(inArray.make().validate()).to.be.rejected);

    return Promise.all(queue);
  });

  it('should use a specific error message if defined', () => {
    const rule = inArray.make({
      source: ['a', 'b', 'c'],
      errorMsg: {
        inline: 'TEST INLINE',
        summary: 'TEST SUMMARY',
      },
    }).validate;
    const queue = [];

    // Will result in an undefined result
    const result = rule('not present');
    queue.push(expect(result.catch(err => Promise.reject(JSON.stringify(err)))).to.be.rejectedWith(/TEST INLINE/));

    return Promise.all(queue);
  });

  describe('sanitise()', () => {
    [
      // type | input | expected output
      ['string', 'string',  '', ''],
      ['number', 'string', 123, '123'],
      ['array', 'array', [], []],
    ].forEach(([type, target, input, output]) => {
      it(`should coerce ${type} to a ${target}`, () => {
        const sanitise = inArray.make().sanitise;

        expect(sanitise(input)).to.deep.equal(output);
      });
    });
    [
      // type | input | expected output
      ['object', {}],
      ['function', () => {}],
      ['boolean', true],
    ].forEach(([type, input, output]) => {
      it(`should coerce ${type} to an undefined value`, () => {
        const sanitise = inArray.make().sanitise;

        expect(sanitise(input)).to.be.undefined;
      });
    });

    [
      // type | input | expected output
      ['mixed array', ['12', 3], ['12', '3']],
      ['numeric array', [1, 2, 3], ['1', '2', '3']],
      ['array of unstringables', [{}, () => {}, []], [undefined, undefined, undefined]],
    ].forEach(([type, input, output]) => {
      it(`should coerce ${type} elements to a one-dimensional array`, () => {
        const sanitise = inArray.make().sanitise;

        expect(sanitise(input)).to.deep.equal(output);
      });
    });

    it('should let an undefined value pass through', () => {
      const sanitise = inArray.make().sanitise;

      expect(sanitise()).to.be.undefined;
    });
  });
});
