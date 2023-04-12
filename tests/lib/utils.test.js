import { expect } from 'chai';
import { stripWhitespace, notProto, validateUrlPath } from '../../src/lib/utils.js';

describe('stripWhitespace', () => {
  it('throws if value is not a string ', () => {
    expect(() => stripWhitespace(2)).to.throw(TypeError, 'value must be a string');
  });

  it('throws if leading is not a string ', () => {
    expect(() => stripWhitespace('', {
      leading: 2,
    })).to.throw(TypeError, 'leading must be a string');
  });

  it('throws if trailing is not a string ', () => {
    expect(() => stripWhitespace('', {
      trailing: 2,
    })).to.throw(TypeError, 'trailing must be a string');
  });

  it('throws if nested is not a string ', () => {
    expect(() => stripWhitespace('', {
      nested: 2,
    })).to.throw(TypeError, 'nested must be a string');
  });

  it('does not throw if value and options are valid', () => {
    expect(() => stripWhitespace('', {
      leading: '',
      trailing: '',
      nested: '',
    })).to.not.throw();
  });

  it('returns value stripped of white space (default)', () => {
    expect(stripWhitespace('   hello   world   ')).to.equal('hello world');
  });

  it('returns value stripped of white space (overrides)', () => {
    expect(stripWhitespace('   hello   world   ', {
      leading: '^',
      trailing: '$',
      nested: '_',
    })).to.equal('^hello_world$');
  });
});

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
