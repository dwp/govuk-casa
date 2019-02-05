const { expect } = require('chai');

const mergeObjectsDeep = require('../../../app/view-filters/mergeObjectsDeep.js');

describe('View filter: mergeObjectsDeep', () => {
  it('should throw an Error if an empty value is passed', () => {
    expect(() => {
      mergeObjectsDeep();
    }).to.throw(Error, 'You must specify some objects to merge');
  });

  it('should throw a TypeError if any non-object arguments are passed', () => {
    expect(() => {
      mergeObjectsDeep({}, () => {}, null);
    }).to.throw(TypeError, /Cannot merge objects of type/i);
  });

  it('should merge simple valid objects', () => {
    const merged = mergeObjectsDeep({ x: 1 }, { y: 2 }, { x: 3 }, { z: 4 });
    expect(merged).to.eql({
      x: 3,
      y: 2,
      z: 4,
    });
  });

  it('should merge nested valid objects', () => {
    const obj1 = {
      args: [{
        x: 1,
        y: 2,
      }],
    };
    const obj2 = {
      args: [{
        x: 'hello',
      }],
    };
    const merged = mergeObjectsDeep(obj1, obj2);
    expect(merged).to.eql({
      args: [{
        x: 'hello',
        y: 2,
      }],
    });
  });

  it('should not affect the original obejct', () => {
    const first = { x: 1 };
    const merged = mergeObjectsDeep(first, { x: 2 });
    expect(merged).to.eql({
      x: 2,
    });
    expect(first).to.eql({
      x: 1,
    });
  });
});
