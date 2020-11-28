const { expect } = require('chai');

const { sanitiseWaypoint, sanitiseAbsolutePath, sanitiseRelativeUrl } = require('../../../../lib/utils/sanitise.js');

describe('utils: sanitiseWaypoint()', () => {
  it('should return an empty string for non-string types', () => {
    const types = [{}, [],  true,  false,  () => {},  null,  undefined];
    types.forEach((type) => {
      expect(sanitiseWaypoint(type)).to.equal('')
    });
  });

  it('should remove invalid characters', () => {
    [':', '@', '&', '_', '*', '%', '<', '>'].forEach(char => {
      expect(sanitiseWaypoint(`test-/${char}/-out`)).to.equal('test-/-out');
    });
  });

  it('should lowercase valid characters', () => {
    expect(sanitiseWaypoint(`LoWeR/cAsE`)).to.equal('lower/case');
  });

  it('should strip leading, trailing and double forward slashes', () => {
    ['/test', 'test/', '/test/'].forEach(wp => {
      expect(sanitiseWaypoint(wp)).to.equal('test');
    });

    ['/test/test', 'test/test', '/test/test/', 'test/test/', '//test//test//', '/test/*/test/'].forEach(wp => {
      expect(sanitiseWaypoint(wp)).to.equal('test/test');
    });
  });
});

describe('utils: sanitiseAbsolutePath()', () => {
  it('should return a / for non-string types', () => {
    const types = [{}, [],  true,  false,  () => {},  null,  undefined];
    types.forEach(type => {
      expect(sanitiseAbsolutePath(type)).to.equal('/')
    });
  });

  it('should remove invalid characters', () => {
    [':', '@', '&', '_', '*', '%', '<', '>'].forEach(char => {
      expect(sanitiseAbsolutePath(`/test-/${char}/-out`)).to.equal('/test-/-out');
    });
  });

  it('should lowercase valid characters', () => {
    expect(sanitiseAbsolutePath(`/LoWeRcAsE`)).to.equal('/lowercase');
  });

  it('should strip trailing slash and prepend slash', () => {
    ['/test', 'test/', '/test/'].forEach(wp => {
      expect(sanitiseAbsolutePath(wp)).to.equal('/test');
    });

    ['/test/test', 'test/test', '/test/test/', 'test/test/', '//test//test//', '/test/*/test/'].forEach(wp => {
      expect(sanitiseAbsolutePath(wp)).to.equal('/test/test');
    });
  });

  describe('utils: sanitiseRelativeUrl()', () => {
    it('should return a / for non-string types', () => {
      const types = [{}, [],  true,  false,  () => {},  null,  undefined];
      types.forEach(type => {
        expect(sanitiseRelativeUrl(type)).to.equal('/')
      });
    });

    it('should prepend a single leading slash', () => {
      expect(sanitiseRelativeUrl(`rel-path`)).to.equal('/rel-path');
      expect(sanitiseRelativeUrl(`/rel-path`)).to.equal('/rel-path');
      expect(sanitiseRelativeUrl(`/%2Frel-path`)).to.equal('/%2Frel-path');
      expect(sanitiseRelativeUrl(`//rel-path`)).to.equal('/');
      expect(sanitiseRelativeUrl(`////rel-path`)).to.equal('/');
    });
  
    it('should return only the pathname if a domain/auth is provided', () => {
      expect(sanitiseRelativeUrl(`//other.test/rel-path`)).to.equal('/rel-path');

      expect(sanitiseRelativeUrl(`https://other.test/rel-path`)).to.equal('/rel-path');
      expect(sanitiseRelativeUrl(`http://other.test/rel-path`)).to.equal('/rel-path');

      expect(sanitiseRelativeUrl(`https:other.test/rel-path`)).to.equal('/other.test/rel-path');
      expect(sanitiseRelativeUrl(`http:other.test/rel-path`)).to.equal('/rel-path');

      expect(sanitiseRelativeUrl(`user:pass@other.test/rel-path`)).to.equal('/pass@other.test/rel-path');
      expect(sanitiseRelativeUrl(`user@other.test/rel-path`)).to.equal('/user@other.test/rel-path');
      expect(sanitiseRelativeUrl(`//user:pass@other.test/rel-path`)).to.equal('/rel-path');
      expect(sanitiseRelativeUrl(`//user@other.test/rel-path`)).to.equal('/rel-path');
    });

    it('should strip multiple leading slashes', () => {
      expect(sanitiseRelativeUrl(`//rel-path///part`)).to.equal('/part');
      expect(sanitiseRelativeUrl(`////rel-path///part`)).to.equal('/part');

      expect(sanitiseRelativeUrl(`https://other.test//rel-path///part`)).to.equal('/rel-path///part');
      expect(sanitiseRelativeUrl(`http://other.test//rel-path///part`)).to.equal('/rel-path///part');

      expect(sanitiseRelativeUrl(`https:other.test//rel-path`)).to.equal('/other.test//rel-path');
      expect(sanitiseRelativeUrl(`http:other.test//rel-path`)).to.equal('/rel-path');

      expect(sanitiseRelativeUrl(`user@other.test//rel-path`)).to.equal('/user@other.test//rel-path');
    });
  
    it('should include a url query where provided', () => {
      expect(sanitiseRelativeUrl(`https://other.test/rel/path?q1=123&q2=%2F`)).to.equal('/rel/path?q1=123&q2=%2F');
      expect(sanitiseRelativeUrl(`rel/path?q1=123&q2=%2F`)).to.equal('/rel/path?q1=123&q2=%2F');

      expect(sanitiseRelativeUrl(`rel/path?q1`)).to.equal('/rel/path?q1');
    });
  });
});