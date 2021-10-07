import { expect } from 'chai';

import required from '../../../src/lib/validators/required.js';
import ValidationError from '../../../src/lib/ValidationError.js';

describe('validators/required', () => {
  it('should reject with a ValidationError', () => {
    expect(required.make().validate(null)).to.satisfy(([e]) => e instanceof ValidationError);
  });

  it('should resolve non-empty values', () => {
    const validate = required.make().validate;

    expect(validate('string')).to.be.empty;
    expect(validate(123)).to.be.empty;
    expect(validate(0)).to.be.empty;
    expect(validate({ a: 'string' })).to.be.empty;
    expect(validate({ a: 123 })).to.be.empty;
    expect(validate(['string'])).to.be.empty;
    expect(validate([123])).to.be.empty;
    expect(validate([null, 123])).to.be.empty;
  });

  it('should reject for empty values', () => {
    const validate = required.make().validate;
    expect(validate()).to.not.be.empty;
    expect(validate(null)).to.not.be.empty;
    expect(validate('')).to.not.be.empty;
    expect(validate([])).to.not.be.empty;
    expect(validate([null])).to.not.be.empty;
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
      ['string with whitespace', 'string', ' ', ''],
      ['string with whitespace', 'string', '\t', ''],
    ].forEach(([type, target, input, output]) => {
      it(`should coerce ${type} to ${target}`, () => {
        const sanitise = required.make().sanitise;

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
        const sanitise = required.make().sanitise;

        expect(sanitise(input)).to.deep.equal(output);
      });
    });

    [
      // type | input | expected output
      ['simple object', { a: 1, b: '2' }, { a: '1', b: '2' }],
      ['nested object', { a: { b: '1' }, c: '2', d: [1, 2] }, { a: undefined, c: '2', d: undefined }],
    ].forEach(([type, input, output]) => {
      it(`should coerce ${type} elements to a one-dimensional object`, () => {
        const sanitise = required.make().sanitise;

        expect(sanitise(input)).to.deep.equal(output);
      });
    });
  });
});
