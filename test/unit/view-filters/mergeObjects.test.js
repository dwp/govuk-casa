const { expect } = require('chai');

const mergeObjects = require('../../../lib/view-filters/mergeObjects.js');

describe('View filter: mergeObjects', () => {
  it('should throw an Error if an empty value is passed', () => {
    expect(() => {
      mergeObjects();
    }).to.throw(Error, 'You must specify some objects to merge');
  });

  it('should throw a TypeError if any non-object arguments are passed', () => {
    expect(() => {
      mergeObjects({}, () => {}, null);
    }).to.throw(TypeError, /Cannot merge objects of type/i);
  });

  it('should merge simple valid objects', () => {
    const merged = mergeObjects({ x: 1 }, { y: 2 }, { x: 3 }, { z: 4 });
    expect(merged).to.eql({
      x: 3,
      y: 2,
      z: 4,
    });
  });

  it('should not affect the original obejct', () => {
    const first = { x: 1 };
    const merged = mergeObjects(first, { x: 2 });
    expect(merged).to.eql({
      x: 2,
    });
    expect(first).to.eql({
      x: 1,
    });
  });
});
