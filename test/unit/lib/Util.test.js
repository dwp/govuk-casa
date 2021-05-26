const path = require('path');
const { expect } = require('chai');
const { getPageIdFromUrl, objectPathString, objectPathValue, normalizeHtmlObjectPath, isEmpty, getJourneyFromUrl, getPageIdFromJourneyUrl, isObjectWithKeys, resolveModulePath, isStringable, stringifyInput } = require('../../../lib/Util.js');
const UserJourney = require('../../../lib/UserJourney.js');

describe('Util', () => {
  describe('getPageIdFromUrl()', () => {
    it('should return a valid page ID from a top level directory path', () => {
      expect(getPageIdFromUrl('/page')).to.equal('page');
    });

    it('should return a valid page ID from a parent and child directory path', () => {
      expect(getPageIdFromUrl('/page/sub')).to.equal('page/sub');
    });

    it('should return a valid page ID from an ill-formatted top level directory path', () => {
      expect(getPageIdFromUrl('///page')).to.equal('page');
    });

    it('should return a valid page ID from a directory path with a hypenated name', () => {
      expect(getPageIdFromUrl('/page-slug')).to.equal('page-slug');
    });

    it('should return a valid page ID from a directory path with a query string', () => {
      expect(getPageIdFromUrl('/page?query')).to.equal('page');
    });

    it('should return a valid page ID from a url with a directory path', () => {
      expect(getPageIdFromUrl('http://domain/page')).to.equal('page');
    });

    it('should return a valid page ID from a url with a parent/child directory path', () => {
      expect(getPageIdFromUrl('http://domain/page/sub')).to.equal('page/sub');
    });

    it('should return a valid page ID from a url with a query string', () => {
      expect(getPageIdFromUrl('http://domain/page?query')).to.equal('page');
    });

    it('should return a valid page ID from a url with a fragment identifier', () => {
      expect(getPageIdFromUrl('http://domain/page#hash')).to.equal('page');
    });
  });

  describe('objectPathString()', () => {
    it('should empty string for missing paths', () => {
      expect(objectPathString()).to.equal('');
    });

    it('should place quotes around each unquoted bracketed element in a single string', () => {
      expect(objectPathString('ab[cd]')).to.equal('ab["cd"]');
    });

    it('should place quotes around each unquoted bracketed element, in a list of strings', () => {
      expect(objectPathString('a[b]', 'cd[e]')).to.equal('a["b"].cd["e"]');
    });
  });

  describe('objectPathValue()', () => {
    it('should return undefined for missing paths', () => {
      /* eslint-disable-next-line no-unused-expressions */
      expect(objectPathValue({}, 'missing_path')).to.be.undefined;
    });

    it('should return undefined for missing paths using dot notation', () => {
      /* eslint-disable no-unused-expressions */
      expect(objectPathValue({}, 'missing_path')).to.be.undefined;
      expect(objectPathValue({ a: { b: { c: 'hi' } } }, 'a.b.c.d')).to.be.undefined;
      expect(objectPathValue({ a: { b: { c: 'hi' } } }, 'a.c.b')).to.be.undefined;
      expect(objectPathValue({'a.b': { c: 'hi' }}, 'a.b.c')).to.be.undefined;
      /* eslint-enable no-unused-expressions */
    });

    it('should return undefined for missing paths using bracket notation', () => {
      /* eslint-disable no-unused-expressions */
      expect(objectPathValue({ a: { b: { c: 'hi' } } }, 'a[b][c][d]')).to.be.undefined;
      expect(objectPathValue({ a: { b: { c: 'hi' } } }, 'a["b"]["c"]["d"]')).to.be.undefined;
      expect(objectPathValue({ a: { b: { c: 'hi' } } }, 'a["b"]["c"]["d"]')).to.be.undefined;
      expect(objectPathValue({ a: { b: { c: 'hi' } } }, 'a[b.c]')).to.be.undefined;
      /* eslint-enable no-unused-expressions */
    });

    it('should return a value for a single path containing invalid characters', () => {
      expect(objectPathValue({ 'Path-with-HYPHENS': 123 }, 'Path-with-HYPHENS')).to.equal(123);
      expect(objectPathValue({ 'a-b': { c: { d: 456 } } }, 'a-b.c.d')).to.equal(456);
    });

    it('should return a value for a valid top level path', () => {
      expect(objectPathValue({ a: { b: { c: 'hi' } } }, 'a')).to.be.an('object');
    });

    it('should return a value for a valid nested path using dot notation', () => {
      expect(objectPathValue({ a: { b: { c: 'hi' } } }, 'a.b.c')).to.equal('hi');
    });

    it('should return a value for a valid nested path using bracket notation', () => {
      expect(objectPathValue({ a: { b: { c: 'hi' } } }, 'a[b][c]')).to.equal('hi');
    });

    it('should return a value for a nested path using mixed bracket and dot notation', () => {
      expect(objectPathValue({ a: { b: { c: 'hi' } } }, 'a["b"].c')).to.equal('hi');
      expect(objectPathValue({ a: { b: { c: 'hi' } } }, "a['b'].c")).to.equal('hi');
      expect(objectPathValue({ a: { b: { c: 'hi' } } }, 'a[b].c')).to.equal('hi');
      expect(objectPathValue({ a: { b: { c: 'hi' } } }, 'a.b["c"]')).to.equal('hi');
      expect(objectPathValue({ a: { b: [{ c: 'hi', d: 'bye' }] } }, 'a.b')).to.be.an('array');
      expect(objectPathValue({ a: { b: [{ c: 'hi', d: 'bye' }] } }, 'a.b[0]["c"]')).to.equal('hi');
      expect(objectPathValue({ a: { b: [{ c: 'hi', d: 'bye' }] } }, 'a.b[0]["d"]')).to.equal('bye');
      expect(objectPathValue({ a: { b: [[]] } }, 'a.b[0]')).to.be.an('array');
      expect(objectPathValue({ a: { b: [['a', 'b']] } }, 'a.b[0][1]')).to.equal('b');
      expect(objectPathValue({'a b': { c: 'hi' }}, 'a b.c')).to.equal('hi');

      expect(objectPathValue({ $a: { b: { c: 'hi' } } }, '$a.b.c')).to.equal('hi');
      expect(objectPathValue({ a: { $b: { c: 'hi' } } }, 'a.$b.c')).to.equal('hi');
    });

    it('should return undefined when given an invalid path', () => {
      /* eslint-disable no-unused-expressions */
      expect(objectPathValue({ a: { b: { c: 'hi' } } }, '[a].b.c')).to.be.undefined;
      expect(objectPathValue({ "": { b: { c: 'hi' } } }, '[.b.c')).to.be.undefined;
      expect(objectPathValue({ a: { b: { c: 'hi' } } }, ']a.b.c')).to.be.undefined;
      expect(objectPathValue({ a: { b: { c: 'hi' } } }, 'a..b.c')).to.be.undefined;

      // Don't allow string indexing
      expect(objectPathValue({ a: { b: { c: 'hi' } } }, 'a.b.c[0]')).to.be.undefined;
      /* eslint-enable no-unused-expressions */
    });

    it('should throw when protected properties are referenced', () => {
      expect(() => objectPathValue({ a: { b: function () {} } }, 'a.b.constructor')).to.throw(Error, /Refusing to update blacklisted property/);
      expect(() => objectPathValue({ a: { b: {} } }, 'a.b.__proto__')).to.throw(Error, /Refusing to update blacklisted property/);
      expect(() => objectPathValue({ a: { b: {} } }, 'a.b.prototype')).to.throw(Error, /Refusing to update blacklisted property/);
    });
  });

  describe('normalizeHtmlObjectPath()', () => {
    it('should correctly convert a top level path for use in HTML field names', () => {
      expect(normalizeHtmlObjectPath('first')).to.equal('first');
    });

    it('should correctly convert a two level path using dot notation for use in HTML field names', () => {
      expect(normalizeHtmlObjectPath('first.second')).to.equal('first[second]');
    });

    it('should correctly convert a two level path using array notation for use in HTML field names', () => {
      expect(normalizeHtmlObjectPath('first["second"]')).to.equal('first[second]');
    });

    it('should correctly convert a three level path using dot notation for use in HTML field names', () => {
      expect(normalizeHtmlObjectPath('first.second.third')).to.equal('first[second][third]');
    });

    it('should correctly convert a nested path using a mix of dot and array notation for use in HTML field names', () => {
      expect(normalizeHtmlObjectPath('first[second].third')).to.equal('first[second][third]');
      expect(normalizeHtmlObjectPath('first.second["third"]')).to.equal('first[second][third]');
    });
  });

  describe('isEmpty()', () => {
    it('should be true when given an undefined value', () => expect(isEmpty(undefined)).to.be.true);

    it('should be true when given an empty string', () => expect(isEmpty('')).to.be.true);

    it('should be false when given a string containing only spaces', () => expect(isEmpty(' ')).to.be.false);

    it('should be false when given a string containing only whitespace', () => expect(isEmpty(' \t')).to.be.false);

    it('should be true when given an empty array', () => expect(isEmpty([])).to.be.true);

    it('should be true when given an array containing only empty values', () => expect(isEmpty([null, undefined, '', { a: null, b: undefined, c: '' }])).to.be.true);

    it('should be true when given an object containing only empty values', () => expect(isEmpty({
      a: null, b: undefined, c: '', e: [], f: {},
    })).to.be.true);

    it('should be false when given an array containing non-empty values', () => expect(isEmpty([' ', null, undefined, '', {
      a: null, b: undefined, c: '', d: ' ',
    }])).to.be.false);

    it('should be false when given a non-zero number', () => expect(isEmpty(1)).to.be.false);

    it('should be false when given a 0', () => expect(isEmpty(0)).to.be.false);

    it('should be false when given a non empty array', () => expect(isEmpty([1])).to.be.false);

    it('should be false when given a non empty object', () => expect(isEmpty({ a: 1 })).to.be.false);

    it('should be true when custom character regexes are removed on a string', () => expect(isEmpty(' ', {
      regexRemove: /\s/g,
    })).to.be.true);

    it('should be true when custom character regexes are removed on an object', () => expect(isEmpty({ a: ' ', b: { c: ' ' }, d: ['\t'] }, {
      regexRemove: /\s/g,
    })).to.be.true);

    it('should be true when custom character regexes are removed on an array', () => expect(isEmpty([' ', '\t'], {
      regexRemove: /\s/g,
    })).to.be.true);
  });

  describe('getJourneyFromUrl()', () => {
    it('should return the only journey in an array', () => {
      const journey = new UserJourney.Map();
      expect(getJourneyFromUrl([journey], 'completely-ignored')).to.equal(journey);
    });

    it('should return a matching user journey', () => {
      const journeys = [
        new UserJourney.Map('example-one'),
        new UserJourney.Map('example-onemore'),
        new UserJourney.Map('example-two'),
      ];
      expect(getJourneyFromUrl(journeys, 'example-one')).to.equal(journeys[0]);
      expect(getJourneyFromUrl(journeys, 'example-one/with-a-page')).to.equal(journeys[0]);
      expect(getJourneyFromUrl(journeys, 'example-one/with/sub/pages')).to.equal(journeys[0]);
      expect(getJourneyFromUrl(journeys, 'example-two/with/sub/pages')).to.equal(journeys[2]);
    });

    it('should return null when no match is found', () => {
      const journeys = [
        new UserJourney.Map('example-one'),
        new UserJourney.Map('example-two'),
      ];
      expect(getJourneyFromUrl(journeys, 'example-onemore')).to.equal(null);
    });
  });

  describe('getPageIdFromJourneyUrl()', () => {
    it('should return the page url portion of a journey-prefixed url', () => {
      const journey = new UserJourney.Map('example-one');
      expect(getPageIdFromJourneyUrl(journey, 'example-one/waypoint-test')).to.equal('waypoint-test');
      expect(getPageIdFromJourneyUrl(journey, 'example-one/waypoint/test')).to.equal('waypoint/test');
    });

    it('should return the page url portion of a journey-prefixed url, when journey guid is empty', () => {
      const journey = new UserJourney.Map();
      expect(getPageIdFromJourneyUrl(journey, 'example-one/waypoint-test')).to.equal('example-one/waypoint-test');
      expect(getPageIdFromJourneyUrl(journey, 'example-one/waypoint/test')).to.equal('example-one/waypoint/test');
    });

    it('should return the original page url if the journey prefix is not featured in the url', () => {
      const journey = new UserJourney.Map('example-one');
      expect(getPageIdFromJourneyUrl(journey, 'example-two/waypoint/test')).to.equal('example-two/waypoint/test');
    });

    it('should return the original page url if the journey is undefined', () => {
      expect(getPageIdFromJourneyUrl(null, 'example-two/waypoint/test')).to.equal('example-two/waypoint/test');
    });
  });

  describe('isObjectWithKeys()', () => {
    it('should return false if inspected value is not an object', () => {
      expect(isObjectWithKeys(0)).to.be.false;
      expect(isObjectWithKeys(false)).to.be.false;
      expect(isObjectWithKeys([])).to.be.false;
      expect(isObjectWithKeys('string')).to.be.false;
      expect(isObjectWithKeys(new Set())).to.be.false;
    });

    it('should return false if inspected object does not have all keys', () => {
      const obj = {
        test0: 'value',
        test1: false,
      };

      expect(isObjectWithKeys(obj, ['test0', 'test1', 'test2'])).to.be.false;
    });

    it('should return true if inspected object has all keys', () => {
      const obj = {
        test0: 'value',
        test1: false,
      };

      expect(isObjectWithKeys(obj, ['test0', 'test1'])).to.be.true;
    });
  });

  describe('resolveModulePath()', () => {
    it('should return the absolute path of a module that exists on one of the specified paths', () => {
      const path0 = path.resolve(__dirname, '../testdata/fake-node_modules');
      let modAPath;

      modAPath = resolveModulePath('govuk_template_jinja', [path0]);
      expect(modAPath).to.equal(path.normalize(`${path0}/govuk_template_jinja`));

      modAPath = resolveModulePath('govuk_template_jinja', ['/non-existent-path', path0]);
      expect(modAPath).to.equal(path.normalize(`${path0}/govuk_template_jinja`));
    });

    it('should throw an Error if the module is not found on any of the paths', () => {
      const path0 = path.resolve(__dirname, '../testdata/fake-node_modules');
      expect(() => {
        resolveModulePath('non-existent-module', [path0]);
      }).to.throw(Error, "Cannot resolve module 'non-existent-module'");
    });

    it('should throw a SyntaxError when the module name contains invalid characters', () => {
      expect(() => {
        resolveModulePath('/invalid...module@name', []);
      }).to.throw(SyntaxError);
    });
  });

  describe('isStringable', () => {
    it('should return true for strings and numbers', () => {
      expect(isStringable('')).to.be.true;
      expect(isStringable(123)).to.be.true;
    });

    it('should return false for everything else', () => {
      expect(isStringable()).to.be.false;
      expect(isStringable(undefined)).to.be.false;
      expect(isStringable(null)).to.be.false;
      expect(isStringable(true)).to.be.false;
      expect(isStringable(false)).to.be.false;
      expect(isStringable([])).to.be.false;
      expect(isStringable({})).to.be.false;
      expect(isStringable(() => {})).to.be.false;
      expect(isStringable(new Set())).to.be.false;
    });
  });

  describe('stringifyInput', () => {
    it('should return a string for a valid stringable', () => {
      expect(stringifyInput('123')).to.equal('123');
      expect(stringifyInput(123)).to.equal('123');
      expect(stringifyInput('123', 'should-not-be-used')).to.equal('123');
    });

    it('should return the fallback value for non-stringables', () => {
      expect(stringifyInput()).to.equal('');
      expect(stringifyInput(undefined)).to.equal('');
      expect(stringifyInput(null)).to.equal('');
      expect(stringifyInput([])).to.equal('');
      expect(stringifyInput({})).to.equal('');
      expect(stringifyInput(() => {})).to.equal('');
      expect(stringifyInput(new Set())).to.equal('');

      expect(stringifyInput(undefined, 'test')).to.equal('test');
      expect(stringifyInput([], 'test')).to.equal('test');
      expect(stringifyInput(undefined, undefined)).to.equal(undefined);
    });
  });
});
