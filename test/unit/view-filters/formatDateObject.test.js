const proxyquire = require('proxyquire');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');

chai.use(sinonChai);

const { expect } = chai;

const NOOP = () => {};
const UNIT_SRC = '../../../lib/view-filters/formatDateObject.js';

const formatDateObject = require(UNIT_SRC);

describe('View filter: formatDateObject', () => {
  it('should output INVALID DATE OBJECT when given an invalid object structure', () => {
    const expected = 'INVALID DATE OBJECT';
    expect(formatDateObject({ mm: 3, yyyy: 2007 })).to.equal(expected);
    expect(formatDateObject('not an object')).to.equal(expected);
    expect(formatDateObject(0)).to.equal(expected);
    expect(formatDateObject([])).to.equal(expected);
    expect(formatDateObject(true)).to.equal(expected);
  });

  it('should enforce a numerical lower boundary on each date component', () => {
    const stubLuxon = {
      DateTime: {
        fromObject: sinon.stub().returns({ toFormat: NOOP, setLocale: () => ({ toFormat: NOOP }) }),
      },
    };
    const formatDateObjectProxy = proxyquire(UNIT_SRC, {
      luxon: stubLuxon,
    });

    formatDateObjectProxy({
      dd: 0,
      mm: 0,
      yyyy: 0,
    });

    expect(stubLuxon.DateTime.fromObject).to.be.calledOnceWithExactly({
      day: 1,
      month: 0,
      year: 0,
    });
  });

  it('should output a string date in the expected format, given valid date object with single digits', () => {
    const output = formatDateObject({
      dd: 1,
      mm: 3,
      yyyy: 2007,
    });
    expect(output).to.equal('1 March 2007');
  });

  it('should output a string date in the expected format, given valid date object with double digits', () => {
    const output = formatDateObject({
      dd: 11,
      mm: 10,
      yyyy: 1998,
    });
    expect(output).to.equal('11 October 1998');
  });

  it('should output a string date in the expected locale', () => {
    const output = formatDateObject({
      dd: 11,
      mm: 1,
      yyyy: 1998,
    }, {
      locale: 'cy',
    });
    expect(output).to.equal('11 Ionawr 1998');
  });

  it('should output a string date in the expected format, given a custom output format', () => {
    const output = formatDateObject({
      dd: 5,
      mm: 4,
      yyyy: 2021,
    }, {
      format: 'd MMM yy',
    });
    expect(output).to.equal('5 Apr 21');
  });
});
