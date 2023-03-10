import sinonChai from 'sinon-chai';
import chai from 'chai';
import nunjucks from 'nunjucks';

import {
  formatDateObject,
  includes,
  mergeObjects,
  renderAsAttributes,
} from '../../src/lib/nunjucks-filters.js';

chai.use(sinonChai);
const { expect } = chai;

describe('View filter: formatDateObject', () => {
  it('should output INVALID DATE OBJECT when given an invalid object structure', () => {
    const expected = 'INVALID DATE OBJECT';
    expect(formatDateObject({ mm: 3, yyyy: 2007 })).to.equal(expected);
    expect(formatDateObject('not an object')).to.equal(expected);
    expect(formatDateObject(0)).to.equal(expected);
    expect(formatDateObject([])).to.equal(expected);
    expect(formatDateObject(true)).to.equal(expected);
  });

  it('should output a string date in the default format if no format argument is provided in config object argument', () => {
    const output = formatDateObject({
      dd: 1,
      mm: 3,
      yyyy: 2007,
    });
    expect(output).to.equal('1 March 2007');
  });

  it('should output a string date in custom format if a format is provided in config object argument', () => {
    const output = formatDateObject({
      dd: 1,
      mm: 3,
      yyyy: 2007,
    }, {
      format: 'cccc d LLLL',
    });
    expect(output).to.equal('Thursday 1 March');
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
});


describe('View filter: includes', () => {
  it('should return true if array contains element', () => expect(includes(['test'], 'test')).to.be.true);

  it('should return false if array does not contain element', () => expect(includes(['test'], 'not here')).to.be.false);

  it('should return false if array is undefined', () => expect(includes(undefined)).to.be.false);

  it('should return false if element is undefined', () => expect(includes([], undefined)).to.be.false);
});


describe('View filter: mergeObjects', () => {
  it('should throw a TypeError if any non-object arguments are passed', () => {
    expect(() => {
      mergeObjects({}, () => {}, null);
    }).to.throw(TypeError, /^Cannot convert .+ to object$/i);
  });

  it('should merge simple valid objects', () => {
    const merged = mergeObjects({ x: 1 }, { y: 2 }, { x: 3 }, { z: 4 });
    expect(merged).to.eql({
      x: 3,
      y: 2,
      z: 4,
    });
  });

  it('should merge nested valid objects', () => {
    const obj1 = {
      args: [{
        x: 1,
        y: 2,
      }],
    };
    const obj2 = {
      args: [{
        x: 'hello',
      }],
    };
    const merged = mergeObjects(obj1, obj2);
    expect(merged).to.eql({
      args: [{
        x: 'hello',
        y: 2,
      }],
    });
  });

  it('should not affect the original obejct', () => {
    const first = { x: 1 };
    const merged = mergeObjects(first, { x: 2 });
    expect(merged).to.eql({
      x: 2,
    });
    expect(first).to.eql({
      x: 1,
    });
  });

  it('should not pollute prototypes', () => {
    const first = { ['__proto__']: { x: 1 } };
    const merged = mergeObjects({}, first);
    expect(merged.x).to.be.undefined;
    expect(Object.prototype.x).to.be.undefined;
    expect(({}).x).to.be.undefined;
  });
});


describe('View filter: renderAsAttributes', () => {
  it('should generate a SafeString instance', () => {
    const attrsString = renderAsAttributes({
      attr1: 1,
    });
    return expect(attrsString instanceof nunjucks.runtime.SafeString).to.be.true;
  });

  it('should output an empty string if given a non-object', () => {
    const attrsString = renderAsAttributes().toString();
    expect(attrsString).to.equal('');
  });

  it('should output all attribute:name pairs as a space-separated string', () => {
    const attrsString = renderAsAttributes({
      attr1: 1,
      attr2: 'two',
      attr3: 3,
    }).toString();
    expect(attrsString).to.equal('attr1="1" attr2="two" attr3="3"');
  });

  it('should escape attribute values', () => {
    const attrsString = renderAsAttributes({
      attr1: '<>"\'&',
    }).toString();
    expect(attrsString).to.equal('attr1="&lt;&gt;&quot;&#039;&amp;"');
  });
});
