const { expect } = require('chai');
const JourneyMap = require('../../../lib/JourneyMap.js');
const JourneyRoad = require('../../../lib/JourneyRoad.js');

describe('JourneyRoad', () => {
  describe('addWaypoints()', () => {
    it('should throw a TypeError if any waypoints are not string, array or object', () => {
      const r1 = new JourneyRoad();
      expect(() => {
        r1.addWaypoints([1, true, 'valid']);
      }).to.throw(TypeError);
    });

    describe('should throw an Error if an array waypoint ', () => {
      it('does not have 2 elements', () => {
        const r1 = new JourneyRoad();
        expect(() => {
          r1.addWaypoints([
            [],
          ]);
        }).to.throw(SyntaxError);
      });

      it('does not have a string for the first element', () => {
        const r1 = new JourneyRoad();
        expect(() => {
          r1.addWaypoints([
            [1, () => {}],
          ]);
        }).to.throw(TypeError);
      });

      it('does not have a function for the second element', () => {
        const r1 = new JourneyRoad();
        expect(() => {
          r1.addWaypoints([
            ['', true],
          ]);
        }).to.throw(TypeError);
      });
    });

    describe('should throw an Error if an object waypoint ', () => {
      it('does not have an id element', () => {
        const r1 = new JourneyRoad();
        expect(() => {
          r1.addWaypoints([
            {},
          ]);
        }).to.throw(SyntaxError);
      });

      it('does not have a string id', () => {
        const r1 = new JourneyRoad();
        expect(() => {
          r1.addWaypoints([
            { id: true },
          ]);
        }).to.throw(TypeError);
      });

      it('includes a non-function "is_present" condition', () => {
        const r1 = new JourneyRoad();
        expect(() => {
          r1.addWaypoints([
            { id: '', is_present: true },
          ]);
        }).to.throw(TypeError, /^Object waypoint is_present condition must be a function$/);
      });

      it('includes a non-function "is_passable" condition', () => {
        const r1 = new JourneyRoad();
        [true, '', {}, [], null, 123].forEach((wrongType) => {
          expect(() => {
            r1.addWaypoints([
              { id: '', is_passable: wrongType },
            ]);
          }).to.throw(TypeError, /^Object waypoint is_passable condition must be a function$/);
        });
      });
    });

    it('should push an object onto the stack containing the correct id and a noop function for an object waypoint', () => {
      const r1 = new JourneyRoad();
      r1.addWaypoints([
        { id: 'test0' },
      ]);
      const wp = r1.getPOIs().pop();
      expect(wp).to.have.property('id').and.equals('test0');
      expect(wp).to.have.property('show').and.be.an.instanceOf(Function);
      expect(wp.show()).to.equal(true);
    });

    it('should push an object onto the stack containing the correct id and is_present function for an object waypoint', () => {
      /* eslint-disable-next-line require-jsdoc */
      const testFunction = () => {};
      const r1 = new JourneyRoad();
      r1.addWaypoints([
        { id: 'test0', is_present: testFunction },
      ]);
      const wp = r1.getPOIs().pop();
      expect(wp).to.have.property('id').and.equals('test0');
      expect(wp).to.have.property('show').and.equals(testFunction);
    });

    it('should throw an error when adding waypoint after a fork/merge/end', () => {
      const r1 = new JourneyRoad();
      const r2 = new JourneyRoad();
      r1.addWaypoints('point0');
      r1.fork([r2], () => r2);
      expect(() => {
        r1.addWaypoints('point1');
      }).to.throw(Error);

      const r3 = new JourneyRoad();
      r3.end();
      expect(() => {
        r3.addWaypoints('p0');
      }).to.throw(Error);

      const r4 = new JourneyRoad();
      const r5 = new JourneyRoad();
      r4.mergeWith(r5);
      expect(() => {
        r4.addWaypoints('p0');
      }).to.throw(Error);
    });
  });

  describe('end()', () => {
    it('should throw an error when ending after a fork/merge/end', () => {
      const r1 = new JourneyRoad();
      const r2 = new JourneyRoad();
      r1.addWaypoints('point0');
      r1.fork([r2], () => r2);
      expect(() => {
        r1.end();
      }).to.throw(Error);

      const r3 = new JourneyRoad();
      const r4 = new JourneyRoad();
      r3.mergeWith(r4);
      expect(() => {
        r3.end();
      }).to.throw(Error);

      const r5 = new JourneyRoad();
      r5.end();
      expect(() => {
        r5.end();
      }).to.throw(Error);
    });
  });

  describe('mergeWith()', () => {
    it('should throw an error when merging after a fork/merge/end', () => {
      const r1 = new JourneyRoad();
      const r2 = new JourneyRoad();
      r1.addWaypoints('point0');
      r1.fork([r2], () => r2);
      expect(() => {
        r1.mergeWith(r2);
      }).to.throw(Error);

      const r3 = new JourneyRoad();
      const r4 = new JourneyRoad();
      const r5 = new JourneyRoad();
      r3.mergeWith(r4);
      expect(() => {
        r3.mergeWith(r5);
      }).to.throw(Error);

      const r6 = new JourneyRoad();
      const r7 = new JourneyRoad();
      r6.end();
      expect(() => {
        r6.mergeWith(r7);
      }).to.throw(Error);
    });

    it('should merge with the correct waypoint after skipping a conditional waypoint', () => {
      const map = new JourneyMap();
      const r1 = new JourneyRoad();
      const r2 = new JourneyRoad();
      const r3 = new JourneyRoad();

      r1.addWaypoints('p0');
      r1.mergeWith(r2);

      r2.addWaypoints([
        ['p1', () => (false)],
        'p2',
      ]);
      r2.mergeWith(r3);

      r3.end();

      map.startAt(r1);
      const t = map.traverse({
        p0: { data: true },
        p1: { data: true },
        p2: { data: true },
      });
      expect(t).to.contain('p0');
      expect(t).to.not.contain('p1');
      expect(t).to.contain('p2');
    })
  });

  describe('fork()', () => {
    it('should throw an error when forking after a fork/merge/end', () => {
      const r1 = new JourneyRoad();
      const r2 = new JourneyRoad();
      r1.addWaypoints('point0');
      r1.fork([r2], () => r2);
      expect(() => {
        r1.mergeWith(r2);
      }).to.throw(Error);

      const r3 = new JourneyRoad();
      const r4 = new JourneyRoad();
      const r5 = new JourneyRoad();
      r3.mergeWith(r4);
      expect(() => {
        r3.fork([r5], () => r5);
      }).to.throw(Error);

      const r6 = new JourneyRoad();
      const r7 = new JourneyRoad();
      r6.end();
      expect(() => {
        r6.fork([r7], () => r7);
      }).to.throw(Error);
    });
  });
});
