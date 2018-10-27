const chai = require('chai');

const { expect } = chai;
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const strlen = require('../../../lib/validation-rules/strlen');

describe('Validation rule: strlen', () => {
  it('should resolve for strings falling within the defined length parameters', () => {
    const queue = [];

    const rule1 = strlen.bind({
      min: 5
    });
    queue.push(expect(rule1('12345')).to.be.fulfilled);
    queue.push(expect(rule1('123456')).to.be.fulfilled);

    const rule2 = strlen.bind({
      max: 5
    });
    queue.push(expect(rule2('')).to.be.fulfilled);
    queue.push(expect(rule2('1234')).to.be.fulfilled);

    const rule3 = strlen.bind({
      min: 5,
      max: 10
    });
    queue.push(expect(rule3('12345')).to.be.fulfilled);
    queue.push(expect(rule3('1234567890')).to.be.fulfilled);

    return Promise.all(queue);
  });

  it('should reject for strings falling outside the defined length parameters', () => {
    const queue = [];

    const rule1 = strlen.bind({
      min: 5
    });
    queue.push(expect(rule1('1234')).to.be.rejected);
    queue.push(expect(rule1('')).to.be.rejected);

    const rule2 = strlen.bind({
      max: 5
    });
    queue.push(expect(rule2('123456')).to.be.rejected);
    queue.push(expect(rule2('1234567890')).to.be.rejected);

    const rule3 = strlen.bind({
      min: 5,
      max: 10
    });
    queue.push(expect(rule3('1234')).to.be.rejected);
    queue.push(expect(rule3('12345678901')).to.be.rejected);

    return Promise.all(queue);
  });

  it('should use a specific error message if defined', () => {
    const queue = [];

    const rule1 = strlen.bind({
      min: 5,
      max: 10,
      errorMsgMin: 'TEST MIN',
      errorMsgMax: 'TEST MAX'
    });
    queue.push(expect(rule1('1234').catch(err => Promise.reject(JSON.stringify(err)))).to.be.rejectedWith(/TEST MIN/));
    queue.push(expect(rule1('12345678901').catch(err => Promise.reject(JSON.stringify(err)))).to.be.rejectedWith(/TEST MAX/));

    return Promise.all(queue);
  });
});
