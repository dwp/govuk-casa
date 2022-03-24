import { expect } from 'chai';

import { verifyBody } from '../../src/middleware/body-parser.js';

describe('body-parser middleware (verifyBody)', () => {
  it('throws an error on presence of __proto__', () => {
    [
      'a[__proto__]=123',
      'a[\'__proto__\']=123',
      'a["__proto__"]=123',
      'a.__proto__=123',
      'a[__pro\u200Bto__]=123',
      'a[\u0027__proto__\u0027]=123',
    ].forEach((payload) => {
      expect(() => verifyBody(null, null, Buffer.from(payload, 'utf8'), 'utf8')).to.throw(Error, 'Request body verification failed (__proto__)', payload);
      expect(() => verifyBody(null, null, Buffer.from(encodeURI(payload), 'utf8'), 'utf8')).to.throw(Error, 'Request body verification failed (__proto__)', `${payload} encoded`);
    });
  });

  it('throws an error on presence of prototype', () => {
    [
      'a[prototype]=123',
      'a[\'prototype\']=123',
      'a["prototype"]=123',
      'a.prototype=123',
      'a[prototype\u200B]=123',
      'a[\u0022prototype\u0022]=123',
    ].forEach((payload) => {
      expect(() => verifyBody(null, null, Buffer.from(payload), 'utf8')).to.throw(Error, 'Request body verification failed (prototype)', payload);
      expect(() => verifyBody(null, null, Buffer.from(encodeURI(payload), 'utf8'), 'utf8')).to.throw(Error, 'Request body verification failed (prototype)', `${payload} encoded`);
    });
  });

  it('throws an error on presence of constructor', () => {
    [
      'a[constructor]=123',
      'a[\'constructor\']=123',
      'a["constructor"]=123',
      'a.constructor=123',
      'a[constructor\u200B]=123',
      'a[\u2028constructor\u2029]=123',
    ].forEach((payload) => {
      expect(() => verifyBody(null, null, Buffer.from(payload), 'utf8')).to.throw(Error, 'Request body verification failed (constructor)', payload);
      expect(() => verifyBody(null, null, Buffer.from(encodeURI(payload), 'utf8'), 'utf8')).to.throw(Error, 'Request body verification failed (constructor)', `${payload} encoded`);
    });
  });
});
