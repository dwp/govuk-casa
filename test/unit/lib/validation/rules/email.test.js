const chai = require('chai');

const { expect } = chai;
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const email = require('../../../../../lib/validation/rules/email.js');
const ValidationError = require('../../../../../lib/validation/ValidationError.js');

describe('Validation rule: email', () => {
  it('should resolve for valid emails', () => {
    const queue = [];
    const rule = email.make().validate;

    queue.push(expect(rule('joe.bloggs@domain.net')).to.be.fulfilled);
    queue.push(expect(rule('user+category@domain.co.uk')).to.be.fulfilled);

    return Promise.all(queue);
  });

  it('should reject with a ValidationError', () => {
    const rule = email.make().validate;
    return expect(rule('bad-args')).to.eventually.be.rejected.and.be.an.instanceOf(ValidationError);
  });

  it('should reject for invalid emails', () => {
    const queue = [];
    const rule = email.make().validate;
    queue.push(expect(rule('invalid@domain@domain.net')).to.be.rejected);
    queue.push(expect(rule('invalid')).to.be.rejected);
    queue.push(expect(rule('cats@cats.co.')).to.be.rejected);
    return Promise.all(queue);
  });

  it('should not allow spaces in emails', () => {
    const queue = [];
    const rule = email.make().validate;

    queue.push(expect(rule(' has-leading-space@domain.net')).to.be.rejected);
    queue.push(expect(rule('has-trailing-space@domain.net ')).to.be.rejected);
    queue.push(expect(rule('has-mid space@domain.net')).to.be.rejected);
    queue.push(expect(rule('has-mid-space@domain .net')).to.be.rejected);
    queue.push(expect(rule('has-mid-tab@domain\t.net')).to.be.rejected);
    queue.push(expect(rule(' ')).to.be.rejected);
    queue.push(expect(rule('\t')).to.be.rejected);

    return Promise.all(queue);
  });

  it('should reject for non-string email', () => {
    const queue = [];
    const rule = email.make().validate;

    queue.push(expect(rule()).to.be.rejected);
    queue.push(expect(rule([])).to.be.rejected);
    queue.push(expect(rule({})).to.be.rejected);
    queue.push(expect(rule(1)).to.be.rejected);
    queue.push(expect(rule(false)).to.be.rejected);
    queue.push(expect(rule(() => {})).to.be.rejected);

    return Promise.all(queue);
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
        const sanitise = email.make().sanitise;

        expect(sanitise(input)).to.equal(output);
      });
    });

    it('should let an undefined value pass through', () => {
      const sanitise = email.make().sanitise;

      expect(sanitise()).to.be.undefined;
    });
  });
});
