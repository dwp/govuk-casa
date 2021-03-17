const chai = require('chai');

const { expect } = chai;
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const WordCount = require('../../../../../lib/validation/rules/wordCount.js');
const ValidationError = require('../../../../../lib/validation/ValidationError.js');

describe('Validation rule: WordCount', () => {
  it('should reject with a ValidationError', () => {
    const rule1 = WordCount.make({
      min: 5,
    }).validate;
    return expect(rule1('one two three four')).to.eventually.be.rejected.and.be.an.instanceOf(ValidationError);
  });

  it('should resolve for strings falling within the defined word count parameters', () => {
    const queue = [];

    const rule1 = WordCount.make({
      min: 5,
    }).validate;
    queue.push(expect(rule1('one two three four five')).to.be.fulfilled);
    queue.push(expect(rule1('one two three four five six')).to.be.fulfilled);

    const rule2 = WordCount.make({
      max: 5,
    }).validate;
    queue.push(expect(rule2('')).to.be.fulfilled);
    queue.push(expect(rule2('one two three four five')).to.be.fulfilled);

    const rule3 = WordCount.make({
      min: 5,
      max: 10,
    }).validate;
    queue.push(expect(rule3('one two three four five')).to.be.fulfilled);
    queue.push(expect(rule3('one two three four five six seven eight nine ten')).to.be.fulfilled);

    return Promise.all(queue);
  });

  it('should reject for strings falling outside the defined word count parameters', () => {
    const queue = [];

    const rule1 = WordCount.make({
      min: 5,
    }).validate;
    queue.push(expect(rule1('one two three four')).to.be.rejected);
    queue.push(expect(rule1('')).to.be.rejected);

    const rule2 = WordCount.make({
      max: 5,
    }).validate;
    queue.push(expect(rule2('one two three four five six seven eight nine ten')).to.be.rejected);
    queue.push(expect(rule2('one two three four five six')).to.be.rejected);

    const rule3 = WordCount.make({
      min: 5,
      max: 10,
    }).validate;
    queue.push(expect(rule3('one two three four')).to.be.rejected);
    queue.push(expect(rule3('one two three four five six seven eight nine ten eleven')).to.be.rejected);

    return Promise.all(queue);
  });

  it('should use a specific error message if defined', () => {
    const queue = [];

    const rule1 = WordCount.make({
      min: 5,
      max: 10,
      errorMsgMin: 'TEST MIN',
      errorMsgMax: 'TEST MAX',
    }).validate;
    queue.push(expect(rule1('one two three four').catch(err => Promise.reject(JSON.stringify(err)))).to.be.rejectedWith(/TEST MIN/));
    queue.push(expect(rule1('one two three four five six seven eight nine ten eleven').catch(err => Promise.reject(JSON.stringify(err)))).to.be.rejectedWith(/TEST MAX/));

    return Promise.all(queue);
  });
  describe('sanitise()', () =>{
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
        const sanitise = WordCount.make().sanitise;

        expect(sanitise(input)).to.equal(output);
      });
    });

    it('should let an undefined value pass through', () => {
      const sanitise = WordCount.make().sanitise;

      expect(sanitise()).to.be.undefined;
    });
  });
});
