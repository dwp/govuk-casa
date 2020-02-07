const sinon = require('sinon');
const { expect } = require('chai');

const ValidationError = require('../../../../lib/validation/ValidationError.js');

describe('Validation: ValidationError', () => {
  describe('constructor', () => {
    it('should throw a TypeError if not given a string or object', () => {
      expect(() => new ValidationError(123)).to.throw(TypeError, 'Constructor requires a string or object');
    });

    it('should not throw an exception when constructing with a string', () => {
      expect(() => new ValidationError('test string')).to.not.throw();
    });

    it('should not throw an exception when constructing with an object', () => {
      expect(() => new ValidationError({})).to.not.throw();
    });
  });

  describe('make', () => {

  });

  describe('withContext', () => {
    it('should set public "field" parameter', () => {
      const context = { fieldName: 'testField' };
      const error = new ValidationError({});
      expect(error.withContext(context)).to.have.property('field').that.equals('testField');
    });

    it('should set public "field" parameter with defined fieldKeySuffix', () => {
      const context = { fieldName: 'testField' };
      const error = new ValidationError({ fieldKeySuffix: '-test-suffix' });
      expect(error.withContext(context)).to.have.property('field').that.equals('testField-test-suffix');
    });

    it('should set public "fieldHref" parameter', () => {
      const context = { fieldName: 'testField' };
      const error = new ValidationError({});
      expect(error.withContext(context)).to.have.property('fieldHref').that.equals('#f-testField');
    });

    it('should set public "fieldHref" parameter with defined fieldKeySuffix', () => {
      const context = { fieldName: 'testField' };
      const error = new ValidationError({ fieldKeySuffix: '-test-suffix' });
      expect(error.withContext(context)).to.have.property('fieldHref').that.equals('#f-testField-test-suffix');
    });

    it('should set public "fieldHref" parameter with defined focusSuffix', () => {
      const context = { fieldName: 'testField' };
      const error = new ValidationError({ focusSuffix: '-test-suffix' });
      error.withContext(context);
      expect(error).to.have.property('fieldHref').that.equals('#f-testField-test-suffix');
      expect(error).to.have.property('focusSuffix').that.deep.equals(['-test-suffix']);
    });

    it('should reset public variables paramter between each context application', () => {
      const error = new ValidationError({
        variables: ({ fieldName }) => ({ name: fieldName ===  'a' ? 'testA' : 'testB' }),
      });
      const context1 = { fieldName: 'a' };
      const context2 = { fieldName: 'b' };

      error.withContext(context1);
      expect(error).to.have.property('variables').that.deep.equals({ name: 'testA' });

      error.withContext(context2);
      expect(error).to.have.property('variables').that.deep.equals({ name: 'testB' });
    });

    it('should set public "validator" parameter', () => {
      const context = { validator: 'testValidator' };
      const error = new ValidationError({});
      expect(error.withContext(context)).to.have.property('validator').that.equals('testValidator');
    });
  });
});
