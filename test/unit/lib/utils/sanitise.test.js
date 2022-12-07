const { expect } = require('chai');

const { sanitiseWaypoint, sanitiseAbsolutePath } = require('../../../../lib/utils/sanitise.js');

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
});
