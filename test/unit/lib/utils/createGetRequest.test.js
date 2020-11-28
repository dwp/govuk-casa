const { expect } = require('chai');

const createGetRequest = require('../../../../lib/utils/createGetRequest.js');

describe('createGetRequest', () => {
  it('should create a relative waypoint url', () => {
    expect(createGetRequest({ waypoint: 'first' })).to.equal('/first');
    expect(createGetRequest({ waypoint: 'first/second' })).to.equal('/first/second');
    expect(createGetRequest({ waypoint: 'first/second/third' })).to.equal('/first/second/third');

    expect(createGetRequest({ waypoint: '/first' })).to.equal('/first');
    expect(createGetRequest({ waypoint: '//first/second' })).to.equal('/first/second');

    expect(createGetRequest({ mountUrl: '/mount/' })).to.equal('/mount/');
  });

  it('should throw if waypoint is invalid', () => {
    expect(() => createGetRequest({ waypoint: 'first/second%2Fthird' })).to.throw(Error, 'waypoint contains invalid characters');
    expect(() => createGetRequest({ waypoint: 'first_' })).to.throw(Error, 'waypoint contains invalid characters');
  });

  it('should return a relative url, with no domain/auth', () => {
    expect(createGetRequest({ waypoint: '//first/second/third' })).to.equal('/first/second/third');
  });

  it('should include an edit flag when in edit mode', () => {
    expect(createGetRequest({
      waypoint: 'first/second',
      editMode: true,
    })).to.equal('/first/second?edit=');
  });

  it('should include a relative editorigin when in edit mode', () => {
    expect(createGetRequest({
      waypoint: 'first/second',
      editMode: true,
      editOrigin: 'http://domain.test/go/back/here?q=1',
    })).to.equal('/first/second?edit=&editorigin=%2Fgo%2Fback%2Fhere%3Fq%3D1');
  });

  it('should include a contextid when provided with one', () => {
    expect(createGetRequest({
      waypoint: 'first/second',
      editMode: true,
      editOrigin: 'edit-origin',
      contextId: 'test-context-id',
    })).to.equal('/first/second?edit=&editorigin=%2Fedit-origin&contextid=test-context-id');
  });

  it('should generate just a querystring if no waypoint or mountUrl is defined', () => {
    expect(createGetRequest()).to.equal('');
    expect(createGetRequest({ editMode: true, editOrigin: '/test' })).to.equal('?edit=&editorigin=%2Ftest');
    expect(createGetRequest({ editMode: true, editOrigin: '/test', mountUrl: '/mount/' })).to.equal('/mount/?edit=&editorigin=%2Ftest');
  });

  it('should generate an edit URL prefixed with mountUrl', () => {
    const base = { waypoint: 'test-waypoint', editMode: true };
    expect(createGetRequest({ ...base })).to.equal('/test-waypoint?edit=');
    expect(createGetRequest({ ...base, mountUrl: '/mount/' })).to.equal('/mount/test-waypoint?edit=');
  });
});
