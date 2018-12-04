const nunjucks = require('nunjucks');
const { expect } = require('chai');

const renderAsAttributes = require('../../../app/view-filters/renderAsAttributes.js');

describe('View filter: renderAsAttributes', () => {
  it('should generate a SafeString instance', () => {
    const attrsString = renderAsAttributes({
      attr1: 1,
    });
    return expect(attrsString instanceof nunjucks.runtime.SafeString).to.be.true;
  });

  it('should output an empty string if given a non-object', () => {
    const attrsString = renderAsAttributes().toString();
    expect(attrsString).to.equal('');
  });

  it('should output all attribute:name pairs as a space-separated string', () => {
    const attrsString = renderAsAttributes({
      attr1: 1,
      attr2: 'two',
      attr3: 3,
    }).toString();
    expect(attrsString).to.equal('attr1="1" attr2="two" attr3="3"');
  });

  it('should escape attribute values', () => {
    const attrsString = renderAsAttributes({
      attr1: '<>"\'&',
    }).toString();
    expect(attrsString).to.equal('attr1="&lt;&gt;&quot;&#039;&amp;"');
  });
});
