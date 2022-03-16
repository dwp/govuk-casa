import { expect } from 'chai';
import { notProto, validateUrlPath } from '../../src/lib/utils.js';

describe('notProto', () => {
  ['__proto__', 'prototype', 'constructor'].forEach((key) => {
    it(`throws when passed "${key}"`, () => {
      expect(() => notProto(key)).to.throw(Error);
    });
  });

  it('returns same key when given a valid key', () => {
    expect(notProto('valid')).to.equal('valid');
  });
});

describe('validateUrlPath', () => {
  it('throws if not a string', () => {
    expect(() => validateUrlPath(2)).to.throw(TypeError, 'URL path must be a string');
  });

  '!@$%&~?'.split('').forEach((char) => {
    it(`throws if path contains invalid character "${char}"`, () => {
      expect(() => validateUrlPath(`${char}`)).to.throw(SyntaxError, 'URL path must contain only a-z, 0-9, -, _ and / characters');
    });
  });

  it('does not thrown if path contains valid characters', () => {
    expect(() => validateUrlPath('/abc-123/this_that')).to.not.throw();
  });

  it('throws if path contains consecutive /', () => {
    expect(() => validateUrlPath('//path')).to.throw(SyntaxError, 'URL path must not contain consecutive /');
  });

  it('returns the passed path when valid', () => {
    expect(validateUrlPath('/valid/path')).to.equal('/valid/path');
  });
});
