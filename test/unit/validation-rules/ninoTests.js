const chai = require('chai');

const { expect } = chai;
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const nino = require('../../../lib/validation-rules/nino');

describe('Validation rule: nino', () => {
  it('should resolve for valid NI numbers', () => {
    const queue = [];

    queue.push(expect(nino('AA370773A')).to.be.fulfilled);

    return Promise.all(queue);
  });

  it('should reject for invalid NI numbers', () => {
    const queue = [];

    queue.push(expect(nino('DA123456A')).to.be.rejected);
    queue.push(expect(nino('AO123456B')).to.be.rejected);
    queue.push(expect(nino('QQ123456C')).to.be.rejected);
    queue.push(expect(nino('BG123456A')).to.be.rejected);
    queue.push(expect(nino('AA123456E')).to.be.rejected);

    return Promise.all(queue);
  });

  it('should reject valid NI numbers with spaces by default', () => {
    const queue = [];

    queue.push(expect(nino('AA 37 07 73 A')).to.be.rejected);
    queue.push(expect(nino('AA\u002037\u002007\u002073\u0020A')).to.be.rejected);
    queue.push(expect(nino('AA 370773A ')).to.be.rejected);

    return Promise.all(queue);
  });

  it('should accept valid NI numbers with spaces when allowWhitespace is true', () => {
    const rule = nino.bind({
      allowWhitespace: true,
    });
    const queue = [];

    queue.push(expect(rule('AA 370773A ')).to.be.fulfilled);
    queue.push(expect(rule('AA 370  773A')).to.be.fulfilled);
    queue.push(expect(rule('AA\u002037\u002007\u002073\u0020A')).to.be.fulfilled);

    return Promise.all(queue);
  });

  it('should reject valid NI numbers with non standard spaces when allowWhitespace is true', () => {
    const rule = nino.bind({
      allowWhitespace: true,
    });
    return expect(rule('AA\u200237\u200207\u200273\u2002A')).to.be.rejected;
  });

  it('should throw TypeError when allowWhitespace isnt a boolean', () => {
    const rule = nino.bind({
      allowWhitespace: 'true',
    });
    return expect(() => rule('AA 37 07 73 A')).to.throw(TypeError, 'NINO validation rule option "allowWhitespace" must been a boolean. received string');
  });
});
