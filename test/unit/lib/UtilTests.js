const { expect } = require('chai');
const Util = require('../../../lib/Util.js');

describe('Util', () => {
  describe('getPageIdFromUrl()', () => {
    it('should return a valid page ID from a top level directory path', () => {
      expect(Util.getPageIdFromUrl('/page')).to.equal('page');
    });

    it('should return a valid page ID from a parent and child directory path', () => {
      expect(Util.getPageIdFromUrl('/page/sub')).to.equal('page/sub');
    });

    it('should return a valid page ID from an ill-formatted top level directory path', () => {
      expect(Util.getPageIdFromUrl('///page')).to.equal('page');
    });

    it('should return a valid page ID from a directory path with a hypenated name', () => {
      expect(Util.getPageIdFromUrl('/page-slug')).to.equal('page-slug');
    });

    it('should return a valid page ID from a directory path with a query string', () => {
      expect(Util.getPageIdFromUrl('/page?query')).to.equal('page');
    });

    it('should return a valid page ID from a url with a directory path', () => {
      expect(Util.getPageIdFromUrl('http://domain/page')).to.equal('page');
    });

    it('should return a valid page ID from a url with a parent/child directory path', () => {
      expect(Util.getPageIdFromUrl('http://domain/page/sub')).to.equal('page/sub');
    });

    it('should return a valid page ID from a url with a query string', () => {
      expect(Util.getPageIdFromUrl('http://domain/page?query')).to.equal('page');
    });

    it('should return a valid page ID from a url with a fragment identifier', () => {
      expect(Util.getPageIdFromUrl('http://domain/page#hash')).to.equal('page');
    });
  });

  describe('objectPathString()', () => {
    it('should empty string for missing paths', () => {
      expect(Util.objectPathString()).to.equal('');
    });
  });

  describe('objectPathValue()', () => {
    it('should return undefined for an invalid path', () => expect(Util.objectPathValue({}, 'invalid_path')).to.be.undefined);

    it('should return undefined for missing paths using dot notation', () => {
      /* eslint-disable no-unused-expressions */
      expect(Util.objectPathValue({ a: { b: { c: 'hi' } } }, 'a.b.c.d')).to.be.undefined;
      expect(Util.objectPathValue({ a: { b: { c: 'hi' } } }, 'a.c.b')).to.be.undefined;
      /* eslint-enable no-unused-expressions */
    });

    it('should return undefined for missing paths using array notation', () => {
      /* eslint-disable no-unused-expressions */
      expect(Util.objectPathValue({ a: { b: { c: 'hi' } } }, 'a["b"]["c"]["d"]')).to.be.undefined;
      expect(Util.objectPathValue({ a: { b: { c: 'hi' } } }, 'a["b"]["c"]["d"]')).to.be.undefined;
      /* eslint-enable no-unused-expressions */
    });

    it('should return a value for a single path containing invalid characters', () => {
      expect(Util.objectPathValue({ 'Path-with-HYPHENS': 123 }, 'Path-with-HYPHENS')).to.equal(123);
      expect(Util.objectPathValue({ 'a-b': { c: { d: 456 } } }, 'a-b.c.d')).to.equal(456);
    });

    it('should return a value for a valid top level path', () => {
      expect(Util.objectPathValue({ a: { b: { c: 'hi' } } }, 'a')).to.be.an('object');
    });

    it('should return a value for a valid nested path using dot notation', () => {
      expect(Util.objectPathValue({ a: { b: { c: 'hi' } } }, 'a.b.c')).to.equal('hi');
    });

    it('should return a value for a valid nested path using array notation', () => {
      expect(Util.objectPathValue({ a: { b: { c: 'hi' } } }, 'a[b][c]')).to.equal('hi');
    });

    it('should return a value for a nested path using mixed array and dot notation', () => {
      expect(Util.objectPathValue({ a: { b: { c: 'hi' } } }, 'a["b"].c')).to.equal('hi');
      expect(Util.objectPathValue({ a: { b: { c: 'hi' } } }, 'a.b["c"]')).to.equal('hi');
      expect(Util.objectPathValue({ a: { b: [{ c: 'hi', d: 'bye' }] } }, 'a.b')).to.be.an('array');
      expect(Util.objectPathValue({ a: { b: [{ c: 'hi', d: 'bye' }] } }, 'a.b[0]["c"]')).to.equal('hi');
      expect(Util.objectPathValue({ a: { b: [{ c: 'hi', d: 'bye' }] } }, 'a.b[0]["d"]')).to.equal('bye');
      expect(Util.objectPathValue({ a: { b: [[]] } }, 'a.b[0]')).to.be.an('array');
      expect(Util.objectPathValue({ a: { b: [['a', 'b']] } }, 'a.b[0][1]')).to.equal('b');
    });
  });

  describe('normalizeHtmlObjectPath()', () => {
    it('should correctly convert a top level path for use in HTML field names', () => {
      expect(Util.normalizeHtmlObjectPath('first')).to.equal('first');
    });

    it('should correctly convert a two level path using dot notation for use in HTML field names', () => {
      expect(Util.normalizeHtmlObjectPath('first.second')).to.equal('first[second]');
    });

    it('should correctly convert a two level path using array notation for use in HTML field names', () => {
      expect(Util.normalizeHtmlObjectPath('first["second"]')).to.equal('first[second]');
    });

    it('should correctly convert a three level path using dot notation for use in HTML field names', () => {
      expect(Util.normalizeHtmlObjectPath('first.second.third')).to.equal('first[second][third]');
    });

    it('should correctly convert a nested path using a mix of dot and array notation for use in HTML field names', () => {
      expect(Util.normalizeHtmlObjectPath('first[second].third')).to.equal('first[second][third]');
      expect(Util.normalizeHtmlObjectPath('first.second["third"]')).to.equal('first[second][third]');
    });
  });

  describe('isEmpty()', () => {
    it('should be true when given an undefined value', () => expect(Util.isEmpty(undefined)).to.be.true);

    it('should be true when given an empty string', () => expect(Util.isEmpty('')).to.be.true);

    it('should be false when given a string containing only spaces', () => expect(Util.isEmpty(' ')).to.be.false);

    it('should be false when given a string containing only whitespace', () => expect(Util.isEmpty(' \t')).to.be.false);

    it('should be true when given an empty array', () => expect(Util.isEmpty([])).to.be.true);

    it('should be true when given an array containing only empty values', () => expect(Util.isEmpty([null, undefined, '', { a: null, b: undefined, c: '' }])).to.be.true);

    it('should be true when given an object containing only empty values', () => expect(Util.isEmpty({
      a: null, b: undefined, c: '', e: [], f: {},
    })).to.be.true);

    it('should be false when given an array containing non-empty values', () => expect(Util.isEmpty([' ', null, undefined, '', {
      a: null, b: undefined, c: '', d: ' ',
    }])).to.be.false);

    it('should be false when given a non-zero number', () => expect(Util.isEmpty(1)).to.be.false);

    it('should be false when given a 0', () => expect(Util.isEmpty(0)).to.be.false);

    it('should be false when given a non empty array', () => expect(Util.isEmpty([1])).to.be.false);

    it('should be false when given a non empty object', () => expect(Util.isEmpty({ a: 1 })).to.be.false);

    it('should be true when custom character regexes are removed on a string', () => expect(Util.isEmpty(' ', {
      regexRemove: /\s/g,
    })).to.be.true);

    it('should be true when custom character regexes are removed on an object', () => expect(Util.isEmpty({ a: ' ', b: { c: ' ' }, d: ['\t'] }, {
      regexRemove: /\s/g,
    })).to.be.true);

    it('should be true when custom character regexes are removed on an array', () => expect(Util.isEmpty([' ', '\t'], {
      regexRemove: /\s/g,
    })).to.be.true);
  });
});
