const chai = require('chai');

const { expect } = chai;
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const Required = require('../../../../../lib/validation/rules/required.js');
const ValidationError = require('../../../../../lib/validation/ValidationError.js');

describe('Validation rule: required', () => {
  it('should reject with a ValidationError', () => {
    return expect(Required.make().validate(null)).to.eventually.be.rejected.and.be.an.instanceOf(ValidationError);
  });

  it('should resolve non-empty values', () => {
    const queue = [];
    const required = Required.make().validate;

    queue.push(expect(required('string')).to.be.fulfilled);
    queue.push(expect(required(123)).to.be.fulfilled);
    queue.push(expect(required(0)).to.be.fulfilled);
    queue.push(expect(required({ a: 'string' })).to.be.fulfilled);
    queue.push(expect(required({ a: 123 })).to.be.fulfilled);
    queue.push(expect(required(['string'])).to.be.fulfilled);
    queue.push(expect(required([123])).to.be.fulfilled);
    queue.push(expect(required([null, 123])).to.be.fulfilled);

    return Promise.all(queue);
  });

  it('should reject for empty values', () => {
    const queue = [];
    const required = Required.make().validate;

    queue.push(expect(required()).to.be.rejected);
    queue.push(expect(required(null)).to.be.rejected);
    queue.push(expect(required('')).to.be.rejected);
    queue.push(expect(required(' ')).to.be.rejected);
    queue.push(expect(required([])).to.be.rejected);
    queue.push(expect(required([' '])).to.be.rejected);
    queue.push(expect(required(['\t'])).to.be.rejected);
    queue.push(expect(required([null])).to.be.rejected);

    return Promise.all(queue);
  });

  describe('sanitise()', () => {
    [
      // type | target-type | input | expected output
      ['string', 'string', '123', '123'],
      ['number', 'string', 123, '123'],
      ['array', 'array', [], []],
      ['object', 'object', {}, {}],
      ['function', 'undefined', () => {}, undefined],
      ['boolean', 'undefined', true, undefined],
    ].forEach(([type, target, input, output]) => {
      it(`should coerce ${type} to ${target}`, () => {
        const sanitise = Required.make().sanitise;

        expect(sanitise(input)).to.deep.equal(output);
      });
    });

    [
      // type | input | expected output
      ['mixed array', ['12', 3], ['12', '3']],
      ['numeric array', [1, 2, 3], ['1', '2', '3']],
      ['array of unstringables', [{}, () => {}, []], [undefined, undefined, undefined]],
    ].forEach(([type, input, output]) => {
      it(`should coerce ${type} elements to a one-dimensional array`, () => {
        const sanitise = Required.make().sanitise;

        expect(sanitise(input)).to.deep.equal(output);
      });
    });

    [
      // type | input | expected output
      ['simple object', {a: 1, b: '2'}, {a: '1', b: '2'}],
      ['nested object', {a: {b: '1'}, c: '2', d: [1, 2]}, {a: undefined, c: '2', d: undefined}],
    ].forEach(([type, input, output]) => {
      it(`should coerce ${type} elements to a one-dimensional object`, () => {
        const sanitise = Required.make().sanitise;

        expect(sanitise(input)).to.deep.equal(output);
      });
    });
  });
});
