const { expect } = require('chai');

const parseRequest = require('../../../../lib/utils/parseRequest.js');

describe('parseRequest', () => {
  it('should throw when provided an invalid request object', () => {
    const msg = 'Request object is invalid (must include a method and url)';
    expect(() => parseRequest()).to.throw(TypeError, msg);
    expect(() => parseRequest({})).to.throw(TypeError, msg);
    expect(() => parseRequest({ method: 'GET' })).to.throw(TypeError, msg);
  });

  it('should throw when provided an invalid request method', () => {
    const msg = 'Unsupported, or undefined request method';
    expect(() => parseRequest({ method: 'HEAD', url: '' })).to.throw(Error, msg);
    expect(() => parseRequest({ method: 'OPTION', url: '' })).to.throw(Error, msg);

    expect(() => parseRequest({ method: 'GET', url: '' })).not.to.throw(Error, msg);
    expect(() => parseRequest({ method: 'POST', url: '' })).not.to.throw(Error, msg);
  });

  it('should extract the full path name to represent the waypoint', () => {
    const base = { method: 'GET', query: '' };
    const req1 = parseRequest({ ...base, url: 'https://somewhere.test/' });
    const req2 = parseRequest({ ...base, url: 'https://somewhere.test/first' });
    const req3 = parseRequest({ ...base, url: 'https://somewhere.test/first/second' });
    const req4 = parseRequest({ ...base, url: 'https://somewhere.test/first/second/third'});

    expect(req1).to.have.property('waypoint').that.equals('');
    expect(req2).to.have.property('waypoint').that.equals('first');
    expect(req3).to.have.property('waypoint').that.equals('first/second');
    expect(req4).to.have.property('waypoint').that.equals('first/second/third');
  });

  it('should include a truthy editMode flag when GET request signals edit mode', () => {
    const base = { method: 'GET', query: { edit: '' } };
    const req1 = parseRequest({ ...base, url: 'https://somewhere.test/' });

    expect(req1).to.have.property('editMode').that.is.true;
  });

  it('should include a truthy editMode flag when POST request signals edit mode', () => {
    const base = { method: 'POST', body: { edit: '' } };
    const req1 = parseRequest({ ...base, url: 'https://somewhere.test/' });

    expect(req1).to.have.property('editMode').that.is.true;
  });

  it('should include a falsey editMode flag when GET request does not signal edit mode', () => {
    const base = { method: 'GET', query: {} };
    const req1 = parseRequest({ ...base, url: 'https://somewhere.test/'  });

    expect(req1).to.have.property('editMode').that.is.false;
  });

  it('should include a falsey editMode flag when POST request does not signal edit mode', () => {
    const base = { method: 'POST', body: {} };
    const req1 = parseRequest({ ...base, url: 'https://somewhere.test/'  });

    expect(req1).to.have.property('editMode').that.is.false;
  });

  it('should contain editOrigin when parsing an edit mode GET request', () => {
    const base = { method: 'GET', query: { edit: '', editorigin: 'abc' } };
    const req1 = parseRequest({ ...base, url: 'https://somewhere.test/' });

    expect(req1).to.have.property('editOrigin').that.equals('/abc');
  });

  it('should contain editOrigin when parsing a POST request', () => {
    const base = { method: 'POST', body: { edit: '', editorigin: 'abc' } };
    const req1 = parseRequest({ ...base, url: 'https://somewhere.test/' });

    expect(req1).to.have.property('editOrigin').that.equals('/abc');
  });

  it('should not contain editOrigin if not in edit mode', () => {
    const base = { method: 'GET', query: { editorigin: 'abc' } };
    const req1 = parseRequest({ ...base, url: 'https://somewhere.test/' });

    expect(req1).to.not.have.property('editOrigin');
  });

  it('should contain contextId when parsing a GET request', () => {
    const base = { method: 'GET', query: { contextid: 'abc' } };
    const req1 = parseRequest({ ...base, url: 'https://somewhere.test/' });

    expect(req1).to.have.property('contextId').that.equals('abc');
  });

  it('should contain contextId when parsing a POST request', () => {
    const base = { method: 'POST', body: { contextid: 'abc' } };
    const req1 = parseRequest({ ...base, url: 'https://somewhere.test/' });

    expect(req1).to.have.property('contextId').that.equals('abc');
  });
});
