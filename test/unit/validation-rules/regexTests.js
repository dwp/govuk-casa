const chai = require('chai');

const { expect } = chai;
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const regex = require('../../../lib/validation-rules/regex');

describe('Validation rule: regex', () => {
  it('should resolve for matching regular expressions', () => {
    const queue = [];

    queue.push(expect(regex('CAN BE ANYTHING BY DEFAULT')).to.be.fulfilled);

    const re1 = regex.bind({
      pattern: /^[0-9]{3}$/
    })
    queue.push(expect(re1('123')).to.be.fulfilled);
    queue.push(expect(re1('098')).to.be.fulfilled);

    return Promise.all(queue);
  });

  it('should reject for mismatching regular expressions', () => {
    const queue = [];

    const re1 = regex.bind({
      pattern: /^[0-9]{3}$/
    })
    queue.push(expect(re1('1234')).to.be.rejected);
    queue.push(expect(re1('12')).to.be.rejected);
    queue.push(expect(re1('abc')).to.be.rejected);

    return Promise.all(queue);
  });

  it('should use the custom error message for rejections', () => {
    const queue = [];

    const re1 = regex.bind({
      pattern: /^[0-9]{3}$/,
      errorMsg: 'REGEX_ERR'
    })
    queue.push(expect(re1('1234').catch(err => Promise.reject(JSON.stringify(err)))).to.be.rejectedWith(/REGEX_ERR/));

    return Promise.all(queue);
  });
});
