const { expect } = require('chai');
const flattenErrorArray = require('../../../../../lib/validation/processor/flattenErrorArray.js');
const ValidationError = require('../../../../../lib/validation/ValidationError.js');

describe('Validation processor: flattenErrorArray()', () => {
  it('should return a non-array error wrapped inside an array', () => {
    const error = new ValidationError();
    expect(flattenErrorArray(error)).to.deep.equal([ error ]);
  });

  it('should return a one-dimensional array exactly the same', () => {
    const error = [new ValidationError(), new ValidationError(), new ValidationError()];
    expect(flattenErrorArray(error)).to.deep.equal(error);
  });

  it('should return a flattened nested array', () => {
    const v1 = new ValidationError();
    const v2 = new ValidationError();
    const v3 = new ValidationError();
    const error = [v1, [v2, [v3]]];
    expect(flattenErrorArray(error)).to.deep.equal([v1, v2, v3]);
  });

  it('should not throw an exception if all errors are ValidationError instances in a one-dimensional array', () => {
    const errors = [new ValidationError(), new ValidationError()];
    expect(() => flattenErrorArray(errors)).to.not.throw();
  });

  it('should throw a TypeError if any errors are not a ValidationError instance in a one-dimensional array', () => {
    const errors = [new ValidationError(), 'error2'];
    expect(() => flattenErrorArray(errors)).to.throw(TypeError, 'All errors must be instances of ValidationError');
  });

  it('should throw a TypeError if any errors are not a ValidationError instance in a nested array', () => {
    const errors = [new ValidationError(), [new ValidationError(), ['error2']]];
    expect(() => flattenErrorArray(errors)).to.throw(TypeError, 'All errors must be instances of ValidationError');
  });
});
