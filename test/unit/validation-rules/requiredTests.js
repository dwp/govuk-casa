const chai = require('chai');

const { expect } = chai;
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const required = require('../../../lib/validation-rules/required');

describe('Validation rule: required', () => {
  it('should resolve non-empty values', () => {
    const queue = [];

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
});
