const chai = require('chai');

const { expect } = chai;
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const nino = require('../../../lib/validation-rules/nino');

describe('Validation rule: nino', () => {
  it('should resolve for valid NI numbers', () => {
    const queue = [];

    queue.push(expect(nino('AA000000A')).to.be.fulfilled);
    queue.push(expect(nino('JJ123456D')).to.be.fulfilled);

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
});
