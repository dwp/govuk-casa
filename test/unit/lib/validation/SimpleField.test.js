const sinon = require('sinon');
const { expect } = require('chai');

const { format } = require('util');
const SimpleField = require('../../../../lib/validation/SimpleField.js');
const { ValidatorFactory } = require('../../../../casa.js');

class StubValidator extends ValidatorFactory {}

describe('Validation: SimpleField', () => {
  it('should return an object', () => {
    expect(SimpleField()).to.be.an('object');
  });

  it('should throw a TypeError if neither a ValidatorFactory or function validator has been used', () => {
    const msg = 'Cannot coerce input to a validator object (typeof = %s)';
    expect(() => SimpleField(['not-a-function'])).to.throw(TypeError, format(msg, 'string'));
    expect(() => SimpleField([[]])).to.throw(TypeError, format(msg, 'object'));
    expect(() => SimpleField([1])).to.throw(TypeError, format(msg, 'number'));
    expect(() => SimpleField([false])).to.throw(TypeError, format(msg, 'boolean'));

    expect(() => SimpleField([ ValidatorFactory ])).not.to.throw();
    expect(() => SimpleField([ new StubValidator ])).not.to.throw();
    expect(() => SimpleField([ () => {} ])).not.to.throw();
    expect(() => SimpleField([ (function (){}).bind() ])).not.to.throw();
  });

  it('should throw a TypeError if a non-function condition has been used', () => {
    expect(() => {
      SimpleField([], 'not-a-function');
    }).to.throw(TypeError, 'Conditional must be a function, got string');
  });

  it('should have an immutable "type" property set to "simple"', () => {
    const sf = SimpleField();
    expect(sf.type).to.equal('simple');

    const pd = Object.getOwnPropertyDescriptor(sf, 'type');
    expect(pd.writable).to.be.false;
    expect(pd.configurable).to.be.false;
  });

  it('should have an immutable "condition" property set to a true-returning function by default', () => {
    const sf = SimpleField();
    expect(sf.condition).to.be.an.instanceOf(Function);
    expect(sf.condition()).to.be.true;

    const pd = Object.getOwnPropertyDescriptor(sf, 'condition');
    expect(pd.writable).to.be.false;
    expect(pd.configurable).to.be.false;
  });

  it('should accept a custom "condition" function property', () => {
    const stubCondition = sinon.stub().returns('test-output');
    const sf = SimpleField([], stubCondition);
    expect(sf.condition).to.equal(stubCondition);
    expect(sf.condition()).to.equal('test-output');
  });

  it('should have an immutable "validators" property set to an empty array by default', () => {
    const sf = SimpleField();
    expect(sf.validators).to.be.an.instanceOf(Array);
    expect(sf.validators).to.have.length(0);

    const pd = Object.getOwnPropertyDescriptor(sf, 'validators');
    expect(pd.writable).to.be.false;
    expect(pd.configurable).to.be.false;
  });

  it('should accept a custom "validators" array property', () => {
    const stubRule = sinon.stub().returns('test-run');
    const sf = SimpleField([ stubRule ]);
    expect(sf.validators[0].validate()).to.equal('test-run');
  });
});
