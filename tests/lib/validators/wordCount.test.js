import { expect } from 'chai';

import wordCount from '../../../src/lib/validators/wordCount.js';
import ValidationError from '../../../src/lib/ValidationError.js';

describe('validators/wordCount', () => {
  it('should reject with a ValidationError', () => {
    const rule1 = wordCount.make({
      min: 5,
    }).validate;
    expect(rule1('one two three four')).to.satisfy(([e]) => e instanceof ValidationError);
  });

  it('should resolve for strings falling within the defined word count parameters', () => {
    const rule1 = wordCount.make({
      min: 5,
    }).validate;
    expect(rule1('one two three four five')).to.be.empty;
    expect(rule1('one two three four five six')).to.be.empty;

    const rule2 = wordCount.make({
      max: 5,
    }).validate;
    expect(rule2('')).to.be.empty;
    expect(rule2('one two three four five')).to.be.empty;

    const rule3 = wordCount.make({
      min: 5,
      max: 10,
    }).validate;
    expect(rule3('one two three four five')).to.be.empty;
    expect(rule3('one two three four five six seven eight nine ten')).to.be.empty;
  });

  it('should reject for strings falling outside the defined word count parameters', () => {
    const rule1 = wordCount.make({
      min: 5,
    }).validate;
    expect(rule1('one two three four')).to.not.be.empty;
    expect(rule1('')).to.not.be.empty;

    const rule2 = wordCount.make({
      max: 5,
    }).validate;
    expect(rule2('one two three four five six seven eight nine ten')).to.not.be.empty;
    expect(rule2('one two three four five six')).to.not.be.empty;

    const rule3 = wordCount.make({
      min: 5,
      max: 10,
    }).validate;
    expect(rule3('one two three four')).to.not.be.empty;
    expect(rule3('one two three four five six seven eight nine ten eleven')).to.not.be.empty;
  });

  it('should use a specific error message if defined', () => {
    const rule1 = wordCount.make({
      min: 5,
      max: 10,
      errorMsgMin: 'TEST MIN',
      errorMsgMax: 'TEST MAX',
    }).validate;
    expect(rule1('one two three four')).to.satisfy(([e]) => e.inline === 'TEST MIN');
    expect(rule1('one two three four five six seven eight nine ten eleven')).to.satisfy(([e]) => e.inline === 'TEST MAX');
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
        const sanitise = wordCount.make().sanitise;

        expect(sanitise(input)).to.equal(output);
      });
    });

    it('should let an undefined value pass through', () => {
      const sanitise = wordCount.make().sanitise;

      expect(sanitise()).to.be.undefined;
    });
  });
});
