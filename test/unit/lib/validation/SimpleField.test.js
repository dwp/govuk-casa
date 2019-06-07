const sinon = require('sinon');
const { expect } = require('chai');

const SimpleField = require('../../../../lib/validation/SimpleField.js');

describe('Validation: SimpleField', () => {
  it('should return an object', () => {
    expect(SimpleField()).to.be.an('object');
  });

  it('should throw a TypeError if any non-function validator has been used', () => {
    expect(() => {
      SimpleField(['not-a-function']);
    }).to.throw(TypeError, 'Validators must be a function, got string');
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
    const testValidators = [() => {}];
    const sf = SimpleField(testValidators);
    expect(sf.validators).to.equal(testValidators);
  });
});
