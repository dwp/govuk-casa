const chai = require('chai');

const { expect } = chai;
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const email = require('../../../../../lib/validation/rules/email.js');

describe('Validation rule: email', () => {
  it('should resolve for valid emails', () => {
    const queue = [];

    queue.push(expect(email('joe.bloggs@domain.net')).to.be.fulfilled);
    queue.push(expect(email('user+category@domain.co.uk')).to.be.fulfilled);

    return Promise.all(queue);
  });

  it('should reject for invalid emails', () => {
    const queue = [];
    queue.push(expect(email('invalid@domain@domain.net')).to.be.rejected);
    queue.push(expect(email('invalid')).to.be.rejected);
    queue.push(expect(email('cats@cats.co.')).to.be.rejected);
    return Promise.all(queue);
  });

  it('should not allow spaces in emails', () => {
    const queue = [];

    queue.push(expect(email(' has-leading-space@domain.net')).to.be.rejected);
    queue.push(expect(email('has-trailing-space@domain.net ')).to.be.rejected);
    queue.push(expect(email('has-mid space@domain.net')).to.be.rejected);
    queue.push(expect(email('has-mid-space@domain .net')).to.be.rejected);
    queue.push(expect(email('has-mid-tab@domain\t.net')).to.be.rejected);
    queue.push(expect(email(' ')).to.be.rejected);
    queue.push(expect(email('\t')).to.be.rejected);

    return Promise.all(queue);
  });
});
