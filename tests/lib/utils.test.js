import { expect } from 'chai';
import { notProto, validateUrlPath, stripProxyFromUrlPath } from '../../src/lib/utils.js';

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

describe('stripProxyFromUrlPath', () => {
  it('leaves non-proxied mountpath in tact', () => {
    const req = {
      app: { mountpath: '/test/' },
      baseUrl: '/test/',
    }

    expect(stripProxyFromUrlPath(req)).to.equal('/test/');
  });

  it('includes only the mountpath segments', () => {
    const req = {
      app: { mountpath: '/test/' },
      baseUrl: '/test/do/not/include/',
    }

    expect(stripProxyFromUrlPath(req)).to.equal('/test/');
  });

  it('reverts to / when no segments match anywhere in the baseUrl', () => {
    const req = {
      app: { mountpath: '/test/' },
      baseUrl: '/not/present/',
    }

    expect(stripProxyFromUrlPath(req)).to.equal('/');
  });

  it('reverts to / when no segments match at the start of the baseUrl', () => {
    const req = {
      app: { mountpath: '/test/' },
      baseUrl: '/not/test/',
    }

    expect(stripProxyFromUrlPath(req)).to.equal('/');
  });

  it('removes a proxy prefix segment', () => {
    const req = {
      app: { mountpath: '/proxy/test/' },
      baseUrl: '/test/this/',
    }

    expect(stripProxyFromUrlPath(req)).to.equal('/test/');
  });

  it('removes all proxy prefix segments', () => {
    const req = {
      app: { mountpath: '/multiple/proxies/test/' },
      baseUrl: '/test/this/',
    }

    expect(stripProxyFromUrlPath(req)).to.equal('/test/');
  });

  it('throws if there are multiple mountpaths', () => {
    const req = {
      app: { mountpath: ['/first/test/', '/second/test/'] },
      baseUrl: '/test/',
    }

    expect(() => stripProxyFromUrlPath(req)).to.throw(Error);
  });
});
