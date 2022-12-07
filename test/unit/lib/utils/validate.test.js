const { expect } = require('chai');

const { validateWaypoint, validateMountUrl } = require('../../../../lib/utils/validate.js');

describe('utils: validateWaypoint()', () => {
  it('should throw if given a non-string', () => {
    [{}, [], true, false, () => {}, null, undefined].forEach(waypoint => {
      expect(() => validateWaypoint(waypoint)).to.throw(TypeError);
    });
  });

  it('should throw if given any non-valid characters', () => {
    [':', '@', '&', '_', '*', '%', '<', '>', 'UPPERCASE', '/'].forEach(char => {
      expect(() => validateWaypoint(char)).to.throw(SyntaxError);
    });
  });

  it('should not throw given valid characters', () => {
    ['a', '0', '-'].forEach(char => {
      expect(() => validateWaypoint(char)).to.not.throw();
    });

    ['a', '0', '-', '/'].forEach(char => {
      expect(() => validateWaypoint(char, { withOrigin: true })).to.not.throw();
    });
  });
});

describe('utils: validateMountUrl()', () => {
  it('should throw if given a non-string', () => {
    [{}, [], true, false, () => {}, null, undefined].forEach(waypoint => {
      expect(() => validateMountUrl(waypoint)).to.throw(TypeError);
    });
  });

  it('should throw if given any non-valid characters', () => {
    [':', '@', '&', '_', '*', '%', '<', '>', 'UPPERCASE'].forEach(char => {
      expect(() => validateMountUrl(char)).to.throw(SyntaxError);
    });
  });

  it('should throw if leading or trailing slashes are not present', () => {
    expect(() => validateMountUrl('test')).to.throw(SyntaxError);
    expect(() => validateMountUrl('test/')).to.throw(SyntaxError);
    expect(() => validateMountUrl('/test')).to.throw(SyntaxError);
  });

  it('should not throw given valid characters', () => {
    ['a', '0', '-', '/'].forEach(char => {
      expect(() => validateMountUrl(`/${char}/`)).to.not.throw();
    });
  });

  it('should not throw if leading and trailing slashes are present', () => {
    expect(() => validateMountUrl('/test/')).to.not.throw();
  });
});
