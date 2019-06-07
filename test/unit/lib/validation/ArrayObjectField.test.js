const sinon = require('sinon');
const { expect } = require('chai');

const ArrayObjectField = require('../../../../lib/validation/ArrayObjectField.js');

describe('Validation: ArrayObjectField', () => {
  it('should return an object', () => {
    expect(ArrayObjectField()).to.be.an('object');
  });

  it('should throw a TypeError if child object is not an object', () => {
    expect(() => {
      ArrayObjectField('not-an-object');
    }).to.throw(TypeError, 'Children object must be an object, got string');
  });

  it('should throw a TypeError if any non-function validator has been used', () => {
    expect(() => {
      ArrayObjectField({}, ['not-a-function']);
    }).to.throw(TypeError, 'Validators must be a function, got string');
  });

  it('should throw a TypeError if a non-function condition has been used', () => {
    expect(() => {
      ArrayObjectField({}, [], 'not-a-function');
    }).to.throw(TypeError, 'Conditional must be a function, got string');
  });

  it('should have an immutable "type" property set to "object"', () => {
    const sf = ArrayObjectField();
    expect(sf.type).to.equal('array_object');

    const pd = Object.getOwnPropertyDescriptor(sf, 'type');
    expect(pd.writable).to.be.false;
    expect(pd.configurable).to.be.false;
  });

  it('should have an immutable "condition" property set to a true-returning function by default', () => {
    const sf = ArrayObjectField();
    expect(sf.condition).to.be.an.instanceOf(Function);
    expect(sf.condition()).to.be.true;

    const pd = Object.getOwnPropertyDescriptor(sf, 'condition');
    expect(pd.writable).to.be.false;
    expect(pd.configurable).to.be.false;
  });

  it('should accept a custom "condition" function property', () => {
    const stubCondition = sinon.stub().returns('test-output');
    const sf = ArrayObjectField({}, [], stubCondition);
    expect(sf.condition).to.equal(stubCondition);
    expect(sf.condition()).to.equal('test-output');
  });

  it('should have an immutable "children" property set to an empty object by default', () => {
    const sf = ArrayObjectField();
    expect(sf.children).to.be.an.instanceOf(Object);
    expect(sf.children).to.be.empty;

    const pd = Object.getOwnPropertyDescriptor(sf, 'children');
    expect(pd.writable).to.be.false;
    expect(pd.configurable).to.be.false;
  });

  it('should accept a custom "children" object property', () => {
    const testChildren = { test: 'value' };
    const sf = ArrayObjectField(testChildren);
    expect(sf.children).to.equal(testChildren);
  });

  it('should have an immutable "validators" property set to an empty array by default', () => {
    const sf = ArrayObjectField();
    expect(sf.validators).to.be.an.instanceOf(Array);
    expect(sf.validators).to.be.empty;

    const pd = Object.getOwnPropertyDescriptor(sf, 'validators');
    expect(pd.writable).to.be.false;
    expect(pd.configurable).to.be.false;
  });

  it('should accept a custom "validators" array property', () => {
    const testValidators = [() => {}];
    const sf = ArrayObjectField({}, testValidators);
    expect(sf.validators).to.equal(testValidators);
  });
});
