import { expect } from 'chai';
import { notProto } from '../../src/lib/utils.js';

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
