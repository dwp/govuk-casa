const { expect } = require('chai');

const makeEditLink = require('../../../../lib/utils/makeEditLink.js');

describe('Utility: makeEditLink()', () => {
  it('should generate just a querystring if no waypoint or mountUrl is defined', () => {
    expect(makeEditLink({})).to.equal('&edit');
    expect(makeEditLink({ origin: '/test' })).to.equal('&edit&editorigin=%2Ftest');
    expect(makeEditLink({ mountUrl: '/mount/' })).to.equal('/mount/?edit');
    expect(makeEditLink({ origin: '/test', mountUrl: '/mount/' })).to.equal('/mount/?edit&editorigin=%2Ftest');
  });

  it('should generate an edit URL prefixed with mountUrl', () => {
    const waypoint = 'test-waypoint';
    expect(makeEditLink({ waypoint })).to.equal('/test-waypoint?edit');
    expect(makeEditLink({ waypoint, mountUrl: '/mount/' })).to.equal('/mount/test-waypoint?edit');
  });

  it('should generate an edit URL containing a waypoint origin and prefixed with mountUrl', () => {
    const waypoint = 'the-origin/test-waypoint';
    expect(makeEditLink({ waypoint })).to.equal('/the-origin/test-waypoint?edit');
    expect(makeEditLink({ waypoint, mountUrl: '/mount/' })).to.equal('/mount/the-origin/test-waypoint?edit');
  });

  it('should generate an edit URL with a urlencoded editorigin in the querystring', () => {
    const waypoint = 'test-waypoint';
    expect(makeEditLink({ waypoint, origin: '/somewhere/else' })).to.equal('/test-waypoint?edit&editorigin=%2Fsomewhere%2Felse');
  });
});
