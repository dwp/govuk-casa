const chai = require('chai');

const { expect } = chai;
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const nino = require('../../../../../lib/validation/rules/nino.js');
const ValidationError = require('../../../../../lib/validation/ValidationError.js');

describe('Validation rule: nino', () => {
  it('should reject with a ValidationError', () => {
    return expect(nino.make().validate('bad-args')).to.eventually.be.rejected.and.be.an.instanceOf(ValidationError);
  });

  it('should resolve for valid NI numbers where the suffix is either: A, B, C or D', () => {
    const queue = [];
    const rule = nino.make().validate;

    queue.push(expect(rule('RN001001A')).to.be.fulfilled);
    queue.push(expect(rule('RN001001B')).to.be.fulfilled);
    queue.push(expect(rule('RN001001C')).to.be.fulfilled);
    queue.push(expect(rule('RN001001D')).to.be.fulfilled);

    return Promise.all(queue);
  });

  it('should resolve for valid NI numbers where the suffix is either: a, b, c or d (lowercase letters)', () => {
    const queue = [];
    const rule = nino.make().validate;

    queue.push(expect(rule('rn001001a')).to.be.fulfilled);
    queue.push(expect(rule('rn001001b')).to.be.fulfilled);
    queue.push(expect(rule('rn001001c')).to.be.fulfilled);
    queue.push(expect(rule('rn001001d')).to.be.fulfilled);

    return Promise.all(queue);
  });


  it('should reject for invalid NI numbers where first letter is: D, F, I, Q, U, V', () => {
    const queue = [];
    const rule = nino.make().validate;

    queue.push(expect(rule('DA123456A')).to.be.rejected);
    queue.push(expect(rule('FA123456B')).to.be.rejected);
    queue.push(expect(rule('IA123456C')).to.be.rejected);
    queue.push(expect(rule('QA123456A')).to.be.rejected);
    queue.push(expect(rule('UA123456A')).to.be.rejected);
    queue.push(expect(rule('VA123456E')).to.be.rejected);

    return Promise.all(queue);
  });

  it('should reject for invalid NI numbers where second letter is: D, F, I, Q, U, V', () => {
    const queue = [];
    const rule = nino.make().validate;

    queue.push(expect(rule('AD123456A')).to.be.rejected);
    queue.push(expect(rule('AF123456B')).to.be.rejected);
    queue.push(expect(rule('AI123456C')).to.be.rejected);
    queue.push(expect(rule('AQ123456A')).to.be.rejected);
    queue.push(expect(rule('AU123456A')).to.be.rejected);
    queue.push(expect(rule('AV123456E')).to.be.rejected);

    return Promise.all(queue);
  });

  it('should reject for invalid NI numbers where first two letters are: BG, GB, NK, KN, TN, NT, ZZ', () => {
    const queue = [];
    const rule = nino.make().validate;

    queue.push(expect(rule('BG123456A')).to.be.rejected);
    queue.push(expect(rule('GB123456B')).to.be.rejected);
    queue.push(expect(rule('NK123456C')).to.be.rejected);
    queue.push(expect(rule('KN123456A')).to.be.rejected);
    queue.push(expect(rule('TN123456A')).to.be.rejected);
    queue.push(expect(rule('NT123456E')).to.be.rejected);
    queue.push(expect(rule('ZZ123456E')).to.be.rejected);

    return Promise.all(queue);
  });

  it('should reject for invalid NI numbers where the suffix is not: A, B, C or D', () => {
    const queue = [];
    const rule = nino.make().validate;

    queue.push(expect(rule('RN001001E')).to.be.rejected);
    queue.push(expect(rule('RN001001F')).to.be.rejected);
    queue.push(expect(rule('RN001001G')).to.be.rejected);
    queue.push(expect(rule('RN001001H')).to.be.rejected);
    // ...
    queue.push(expect(rule('RN001001X')).to.be.rejected);
    queue.push(expect(rule('RN001001Y')).to.be.rejected);
    queue.push(expect(rule('RN001001Z')).to.be.rejected);

    return Promise.all(queue);
  });

  it('should reject valid NI numbers with spaces by default', () => {
    const queue = [];
    const rule = nino.make().validate;

    queue.push(expect(rule('RN 00 10 01 A')).to.be.rejected);
    queue.push(expect(rule('RN\u002000\u002010\u002001\u0020A')).to.be.rejected);
    queue.push(expect(rule('RN 001001A ')).to.be.rejected);

    return Promise.all(queue);
  });

  it('should accept valid NI numbers with spaces when allowWhitespace is true', () => {
    const rule = nino.make({
      allowWhitespace: true,
    }).validate;
    const queue = [];

    queue.push(expect(rule('RN 001001A ')).to.be.fulfilled);
    queue.push(expect(rule('RN 001 001A')).to.be.fulfilled);
    queue.push(expect(rule('RN\u002000\u002010\u002001\u0020A')).to.be.fulfilled);

    return Promise.all(queue);
  });

  it('should reject valid NI numbers with non standard spaces when allowWhitespace is true', () => {
    const rule = nino.make({
      allowWhitespace: true,
    }).validate;
    return expect(rule('RN\u200200\u200210\u200201\u2002A')).to.be.rejected;
  });

  it('should throw TypeError when allowWhitespace isnt a boolean', () => {
    const rule = nino.make({
      allowWhitespace: 'true',
    }).validate;
    return expect(() => rule('RN 00 10 01 A')).to.throw(TypeError, 'NINO validation rule option "allowWhitespace" must been a boolean. received string');
  });

  describe('sanitise()', () => {
    [
      // type | input | expected output
      ['string', '', ''],
      ['number', 123, '123'],
      ['object', {}, ''],
      ['function', () => {}, ''],
      ['array', [], ''],
      ['boolean', true, ''],
    ].forEach(([type, input, output]) => {
      it(`should coerce ${type} to a string`, () => {
        const sanitise = nino.make().sanitise;

        expect(sanitise(input)).to.equal(output);
      });
    });

    it('should let an undefined value pass through', () => {
      const sanitise = nino.make().sanitise;

      expect(sanitise()).to.be.undefined;
    });
  });
});
