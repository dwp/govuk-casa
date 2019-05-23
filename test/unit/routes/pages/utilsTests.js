const { expect } = require('chai');

const {
  extractSessionableData,
} = require('../../../../app/routes/pages/utils.js');

describe('Routes: utils.js', () => {
  describe('extractSessionableData()', () => {
    const validLogger = {
      warn: () => (null),
    };
    const validPageWaypointId = 'waypoint';
    const validFieldValidators = {
      waypoint: [],
    };
    const validData = {
      waypoint: null,
    };

    it('should not throw given valid arguments', () => {
      expect(() => {
        extractSessionableData(validLogger, validPageWaypointId, validFieldValidators, validData);
      }).to.not.throw();
    })

    it('should throw a TypeError if given incorrect logger type', () => {
      expect(() => {
        extractSessionableData(null);
      }).to.throw(TypeError, 'Expected logger to be a configured logging object');
    });

    it('should throw a TypeError if given incorrect pageWaypointId type', () => {
      expect(() => {
        extractSessionableData(validLogger, false);
      }).to.throw(TypeError, 'Expected pageWaypointId to be a string');
    });

    it('should throw a TypeError if given incorrect fieldValidators type', () => {
      expect(() => {
        extractSessionableData(validLogger, validPageWaypointId, false);
      }).to.throw(TypeError, 'Expected fieldValidators to be an object');
    });

    it('should throw a TypeError if given incorrect data type', () => {
      expect(() => {
        extractSessionableData(validLogger, validPageWaypointId, validFieldValidators, null);
      }).to.throw(TypeError, 'Expected data to be an object');
    });

    it('should return an empty object if no fieldValidators present', () => {
      const extracted = extractSessionableData(validLogger, validPageWaypointId, {}, validData);
      return expect(extracted).to.be.an('object').and.to.be.empty;
    });

    it('should remove data keys that do not have field validators', () => {
      const extracted = extractSessionableData(validLogger, 'test', {
        test: null,
      }, {
        test: 1,
        removeme: true,
      });
      expect(extracted).to.deep.equal({
        test: 1,
      });
    });

    it('should not add extract fields that are not present in original data object', () => {
      const extracted = extractSessionableData(validLogger, 'test', {
        test: null,
        another: null,
      }, {
        another: 2,
      });
      expect(extracted).to.not.have.property('test');
    });
  });
});
