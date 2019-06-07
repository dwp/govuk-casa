const { expect } = require('chai');

const includes = require('../../../lib/view-filters/includes.js');

describe('View filter: includes', () => {
  it('should return true if array contains element', () => expect(includes(['test'], 'test')).to.be.true);

  it('should return false if array does not contain element', () => expect(includes(['test'], 'not here')).to.be.false);

  it('should return false if array is undefined', () => expect(includes(undefined)).to.be.false);

  it('should return false if element is undefined', () => expect(includes([], undefined)).to.be.false);
});
