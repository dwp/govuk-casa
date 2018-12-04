const chai = require('chai');

const { expect } = chai;
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const inArray = require('../../../lib/validation-rules/inArray');

describe('Validation rule: inArray', () => {
  it('should resolve if value is contained within array', () => {
    const rule = inArray.bind({
      source: ['a', 'b', 'c'],
    })
    const queue = [];

    const result = rule('b');
    queue.push(expect(result).to.be.a('Promise'));
    queue.push(expect(result).to.be.fulfilled);
    queue.push(expect(rule(['a'])).to.be.fulfilled);
    queue.push(expect(rule(['a', 'b'])).to.be.fulfilled);

    return Promise.all(queue);
  });

  it('should reject if value is null', () => expect(inArray(null)).to.be.rejected);

  it('should reject if value is undefined', () => expect(inArray()).to.be.rejected);

  it('should reject if value is not contained within array', () => {
    const rule = inArray.bind({
      source: ['a', 'b', 'c'],
    })
    const queue = [];

    let result = rule('not present').catch(() => (false));
    queue.push(expect(result).to.be.a('Promise'));

    result = rule(['a', 'b', 'not present']);
    queue.push(expect(result).to.be.rejected);

    queue.push(expect(rule([])).to.be.rejected);

    queue.push(expect(inArray.bind({
      source: [undefined],
    })()).to.be.rejected);

    queue.push(expect(inArray()).to.be.rejected);

    return Promise.all(queue);
  });

  it('should use a specific error message if defined', () => {
    const rule = inArray.bind({
      source: ['a', 'b', 'c'],
      errorMsg: {
        inline: 'TEST INLINE',
        summary: 'TEST SUMMARY',
      },
    });
    const queue = [];

    // Will result in an undefined result
    const result = rule('not present');
    queue.push(expect(result.catch(err => Promise.reject(JSON.stringify(err)))).to.be.rejectedWith(/TEST INLINE/));

    return Promise.all(queue);
  });
});
