const { expect } = require('chai');

const formatDateObject = require('../../../app/view-filters/formatDateObject.js');

describe('View filter: formatDateObject', () => {
  it('should output a string date from a given valid date object', () => {
    const str1 = formatDateObject({
      dd: 1,
      mm: 3,
      yyyy: 2007,
    });
    expect(str1).to.equal('1 March 2007');

    const str2 = formatDateObject({
      dd: 11,
      mm: 10,
      yyyy: 1998,
    });
    expect(str2).to.equal('11 October 1998');
  });

  it('should output INVALID DATE OBJECT for an invalid date object', () => {
    const str1 = formatDateObject({
      mm: 3,
      yyyy: 2007,
    });
    expect(str1).to.equal('INVALID DATE OBJECT');
  });
});
