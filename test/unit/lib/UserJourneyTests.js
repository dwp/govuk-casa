const { expect } = require('chai');
const UserJourney = require('../../../lib/UserJourney.js');

describe('UserJourney.Map', () => {
  describe('constructor', () => {
    it('should throw a SyntaxError if the guid is not a String', () => {
      const msg = /^guid must be a string$/;
      expect(() => new UserJourney.Map(1)).to.throw(TypeError, msg);
      expect(() => new UserJourney.Map([])).to.throw(TypeError, msg);
      expect(() => new UserJourney.Map({})).to.throw(TypeError, msg);
      expect(() => new UserJourney.Map(() => {})).to.throw(TypeError, msg);
    });

    it('should throw a SyntaxError if the guid is not a valid URL path', () => {
      expect(() => new UserJourney.Map('not/valid')).to.throw(SyntaxError);
      expect(() => new UserJourney.Map('not*valid')).to.throw(SyntaxError);
      expect(() => new UserJourney.Map('/not-valid')).to.throw(SyntaxError);
      expect(() => new UserJourney.Map(' notvalid')).to.throw(SyntaxError);
    });

    it('should not throw an exception for valid arguments', () => {
      expect(() => new UserJourney.Map('valid-url-12-3')).to.not.throw();
    });
  });

  describe('startAt()', () => {
    it('should throw an error if anything other than a Road is set', () => {
      const map = new UserJourney.Map();
      expect(() => {
        map.startAt(null);
      }).to.throw(Error);
    });
  });

  describe('addWaypoints()', () => {
    it('should throw a TypeError if any waypoints are not string, array or object', () => {
      const r1 = new UserJourney.Road();
      expect(() => {
        r1.addWaypoints([1, true, 'valid']);
      }).to.throw(TypeError);
    });

    describe('should throw an Error if an array waypoint ', () => {
      it('does not have 2 elements', () => {
        const r1 = new UserJourney.Road();
        expect(() => {
          r1.addWaypoints([
            [],
          ]);
        }).to.throw(SyntaxError);
      });

      it('does not have a string for the first element', () => {
        const r1 = new UserJourney.Road();
        expect(() => {
          r1.addWaypoints([
            [1, () => {}],
          ]);
        }).to.throw(TypeError);
      });

      it('does not have a function for the second element', () => {
        const r1 = new UserJourney.Road();
        expect(() => {
          r1.addWaypoints([
            ['', true],
          ]);
        }).to.throw(TypeError);
      });
    });

    describe('should throw an Error if an object waypoint ', () => {
      it('does not have an id element', () => {
        const r1 = new UserJourney.Road();
        expect(() => {
          r1.addWaypoints([
            {},
          ]);
        }).to.throw(SyntaxError);
      });

      it('does not have a string id', () => {
        const r1 = new UserJourney.Road();
        expect(() => {
          r1.addWaypoints([
            { id: true },
          ]);
        }).to.throw(TypeError);
      });

      it('includes a non-function "is_present" condition', () => {
        const r1 = new UserJourney.Road();
        expect(() => {
          r1.addWaypoints([
            { id: '', is_present: true },
          ]);
        }).to.throw(TypeError, /^Object waypoint is_present condition must be a function$/);
      });

      it('includes a non-function "is_passable" condition', () => {
        const r1 = new UserJourney.Road();
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
      const r1 = new UserJourney.Road();
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
      const r1 = new UserJourney.Road();
      r1.addWaypoints([
        { id: 'test0', is_present: testFunction },
      ]);
      const wp = r1.getPOIs().pop();
      expect(wp).to.have.property('id').and.equals('test0');
      expect(wp).to.have.property('show').and.equals(testFunction);
    });

    it('should throw an error when adding waypoint after a fork/merge/end', () => {
      const r1 = new UserJourney.Road();
      const r2 = new UserJourney.Road();
      r1.addWaypoints('point0');
      r1.fork([r2], () => r2);
      expect(() => {
        r1.addWaypoints('point1');
      }).to.throw(Error);

      const r3 = new UserJourney.Road();
      r3.end();
      expect(() => {
        r3.addWaypoints('p0');
      }).to.throw(Error);

      const r4 = new UserJourney.Road();
      const r5 = new UserJourney.Road();
      r4.mergeWith(r5);
      expect(() => {
        r4.addWaypoints('p0');
      }).to.throw(Error);
    });
  });

  describe('end()', () => {
    it('should throw an error when ending after a fork/merge/end', () => {
      const r1 = new UserJourney.Road();
      const r2 = new UserJourney.Road();
      r1.addWaypoints('point0');
      r1.fork([r2], () => r2);
      expect(() => {
        r1.end();
      }).to.throw(Error);

      const r3 = new UserJourney.Road();
      const r4 = new UserJourney.Road();
      r3.mergeWith(r4);
      expect(() => {
        r3.end();
      }).to.throw(Error);

      const r5 = new UserJourney.Road();
      r5.end();
      expect(() => {
        r5.end();
      }).to.throw(Error);
    });
  });

  describe('mergeWith()', () => {
    it('should throw an error when merging after a fork/merge/end', () => {
      const r1 = new UserJourney.Road();
      const r2 = new UserJourney.Road();
      r1.addWaypoints('point0');
      r1.fork([r2], () => r2);
      expect(() => {
        r1.mergeWith(r2);
      }).to.throw(Error);

      const r3 = new UserJourney.Road();
      const r4 = new UserJourney.Road();
      const r5 = new UserJourney.Road();
      r3.mergeWith(r4);
      expect(() => {
        r3.mergeWith(r5);
      }).to.throw(Error);

      const r6 = new UserJourney.Road();
      const r7 = new UserJourney.Road();
      r6.end();
      expect(() => {
        r6.mergeWith(r7);
      }).to.throw(Error);
    });

    it('should merge with the correct waypoint after skipping a conditional waypoint', () => {
      const map = new UserJourney.Map();
      const r1 = new UserJourney.Road();
      const r2 = new UserJourney.Road();
      const r3 = new UserJourney.Road();

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
      const r1 = new UserJourney.Road();
      const r2 = new UserJourney.Road();
      r1.addWaypoints('point0');
      r1.fork([r2], () => r2);
      expect(() => {
        r1.mergeWith(r2);
      }).to.throw(Error);

      const r3 = new UserJourney.Road();
      const r4 = new UserJourney.Road();
      const r5 = new UserJourney.Road();
      r3.mergeWith(r4);
      expect(() => {
        r3.fork([r5], () => r5);
      }).to.throw(Error);

      const r6 = new UserJourney.Road();
      const r7 = new UserJourney.Road();
      r6.end();
      expect(() => {
        r6.fork([r7], () => r7);
      }).to.throw(Error);
    });
  });

  describe('allWaypoints()', () => {
    it('should throw an error when no starting road has been defined', () => {
      const map = new UserJourney.Map();
      expect(() => {
        map.allWaypoints();
      }).to.throw(Error);
    });

    it.skip('should throw an error when an invalid waypoint is discovered', () => {
      const road = new UserJourney.Road();
      road._pois.push({
        id: 'my-waypoint',
        type: '$INVALID_TYPE$',
        show: () => (true),
        nextWaypoint: () => (true),
      });
      const map = new UserJourney.Map();
      map.startAt(road);
      expect(() => {
        map.allWaypoints();
      }).to.throw(Error);
    });

    it('should return all waypoints across all roads in a journey', () => {
      const roadA = new UserJourney.Road();
      const roadB = new UserJourney.Road();
      const roadC = new UserJourney.Road();

      roadA.addWaypoints(['a', 'b', 'c']);
      roadA.fork([roadB, roadC], () => (true));
      roadB.addWaypoints(['d', 'e', 'f']);
      roadC.addWaypoints(['g', 'h', 'i']);
      roadC.end();

      const map = new UserJourney.Map();
      map.startAt(roadA);

      const waypoints = map.allWaypoints();
      waypoints.sort();

      expect(waypoints).to.eql(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']);
    });

    it('should return all waypoints once in a looping journey', () => {
      const roadA = new UserJourney.Road();
      const roadB = new UserJourney.Road();
      const roadC = new UserJourney.Road();

      roadA.addWaypoints(['a', 'b', 'c']);
      roadA.fork([roadA, roadB], () => (true));
      roadB.addWaypoints(['d', 'e', 'f']);
      roadB.mergeWith(roadC);
      roadC.addWaypoints(['g', 'h', 'i']);
      roadC.end();

      const map = new UserJourney.Map();
      map.startAt(roadA);

      const waypoints = map.allWaypoints();
      waypoints.sort();

      expect(waypoints).to.eql(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']);
    });
  });

  describe('containsWaypoint()', () => {
    it('should find waypoints in a simple road', () => {
      const map = new UserJourney.Map();
      const road = new UserJourney.Road();
      road.addWaypoints('point0');
      road.end();
      map.startAt(road);
      expect(map.containsWaypoint('point0')).to.be.true; /* eslint-disable-line no-unused-expressions */
      expect(map.containsWaypoint('badpoint')).to.be.false; /* eslint-disable-line no-unused-expressions */
    });

    it('should find waypoints in a complex route', () => {
      const map = new UserJourney.Map();
      const road1 = new UserJourney.Road();
      const road2 = new UserJourney.Road();
      const road3 = new UserJourney.Road();
      const road4 = new UserJourney.Road();
      const road5 = new UserJourney.Road();

      road1.addWaypoints(['point0', 'point1']);
      road1.fork([road2, road3], roads => roads[0]);
      road2.addWaypoints(['point2', 'point3']);
      road3.addWaypoints(['point4', 'point5']);
      road4.addWaypoints(['point6', 'point7']);
      road5.addWaypoints(['point8', 'point9']);
      road2.mergeWith(road4);
      road3.mergeWith(road4);
      road4.mergeWith(road5);

      map.startAt(road1);

      /* eslint-disable no-unused-expressions */
      expect(map.containsWaypoint('point1')).to.be.true;
      expect(map.containsWaypoint('point3')).to.be.true;
      expect(map.containsWaypoint('point4')).to.be.true;
      expect(map.containsWaypoint('point7')).to.be.true;
      expect(map.containsWaypoint('point9')).to.be.true;
      expect(map.containsWaypoint('badpoint')).to.be.false;
      /* eslint-enable no-unused-expressions */
    });
  });

  describe('traverse()', () => {
    it('should throw an error when no starting road has been defined', () => {
      const map = new UserJourney.Map();
      expect(map.traverse).to.throw(Error);
    });

    it('should only find the first waypoint when traversing with no context', () => {
      const map = new UserJourney.Map();

      const road1 = new UserJourney.Road();
      road1.addWaypoints(['p0', 'p1', 'p2', 'p3']);

      map.startAt(road1);

      expect(map.traverse()).to.contain('p0');
      expect(map.traverse()).not.to.contain('p1');
    });

    it('should include the last waypoint even when last waypoint contains data', () => {
      const map = new UserJourney.Map();
      const r = new UserJourney.Road();

      r.addWaypoints(['p0', 'p1']);
      r.end();

      map.startAt(r);
      const t = map.traverse({
        p0: { data: true },
        p1: { data: true },
      });

      expect(t).to.contain('p1');
    });

    it('should return the "next" waypoint in a given context (1)', () => {
      const map = new UserJourney.Map();

      const road1 = new UserJourney.Road();
      road1.addWaypoints(['p0', 'p1', 'p2', 'p3', 'p4', 'p5']);

      map.startAt(road1);

      const context = {
        p0: { data: true },
        p1: { data: true },
        p2: { data: true },
      };

      expect(map.traverse(context)).to.contain('p0');
      expect(map.traverse(context)).to.contain('p1');
      expect(map.traverse(context)).to.contain('p2');
      expect(map.traverse(context)).to.contain('p3');
      expect(map.traverse(context)).not.to.contain('p4');
      expect(map.traverse(context)).not.to.contain('p5');
    });

    it('should return the "next" waypoint in a given context (2)', () => {
      const map = new UserJourney.Map();

      const road1 = new UserJourney.Road();
      road1.addWaypoints(['p0', 'p1', ['p2', c => c.p1.data === true], ['p3', c => c.p2.data === true], 'p4', 'p5']);

      map.startAt(road1);

      const context = {
        p0: { data: true },
        p1: { data: true },
        p2: { data: false },
        p3: { data: true },
      };

      expect(map.traverse(context)).to.contain('p0');
      expect(map.traverse(context)).to.contain('p1');
      expect(map.traverse(context)).to.contain('p2');
      expect(map.traverse(context)).not.to.contain('p3');
      expect(map.traverse(context)).to.contain('p4');
      expect(map.traverse(context)).not.to.contain('p5');
    });

    it('should correctly follow forks and merges based on context (1)', () => {
      const map = new UserJourney.Map();

      const road1 = new UserJourney.Road();
      road1.addWaypoints(['p0', 'p1', 'p2']);

      const road2 = new UserJourney.Road();
      road2.addWaypoints(['p3', 'p4', 'p5']);

      const road3 = new UserJourney.Road();
      /* eslint-disable-next-line require-jsdoc */
      const skip = () => (false);
      road3.addWaypoints([
        ['p6', skip],
        ['p7', skip],
        ['p8', skip],
      ]);

      const road4 = new UserJourney.Road();
      road4.addWaypoints(['p9', 'p10', 'p11']);

      map.startAt(road1);
      road1.fork([road2, road3], roads => roads[1]);
      road3.mergeWith(road4);

      const context = {
        p0: { data: true },
        p1: { data: true },
        p2: { data: true },
        p6: { data: true },
        p7: { data: true },
        p8: { data: true },
      };

      expect(map.traverse(context)).to.contain('p0');
      expect(map.traverse(context)).to.contain('p1');
      expect(map.traverse(context)).to.contain('p2');
      expect(map.traverse(context)).not.to.contain('p3');
      expect(map.traverse(context)).not.to.contain('p4');
      expect(map.traverse(context)).not.to.contain('p5');
      expect(map.traverse(context)).not.to.contain('p6');
      expect(map.traverse(context)).not.to.contain('p7');
      expect(map.traverse(context)).not.to.contain('p8');
      // the "next" waypoint
      expect(map.traverse(context)).to.contain('p9');
      expect(map.traverse(context)).not.to.contain('p10');
    });

    it('should correctly follow forks and merges based on context (2)', () => {
      const map = new UserJourney.Map();

      const road1 = new UserJourney.Road();
      road1.addWaypoints(['p0', 'p1', 'p2']);

      const road2 = new UserJourney.Road();
      road2.addWaypoints(['p3', 'p4', 'p5']);

      const road3 = new UserJourney.Road();
      road3.addWaypoints(['p6', 'p7', 'p8']);

      const road4 = new UserJourney.Road();
      road4.addWaypoints(['p9', 'p10', 'p11']);

      map.startAt(road1);
      road1.fork([road2, road3], roads => roads[1]);
      road3.mergeWith(road4);

      const context = {
        p0: { data: true },
        p1: { data: true },
        p2: { data: true },
        p6: { data: true },
        p7: { data: true },
        p8: { data: true },
      };

      expect(map.traverse(context)).to.contain('p0');
      expect(map.traverse(context)).to.contain('p1');
      expect(map.traverse(context)).to.contain('p2');
      expect(map.traverse(context)).not.to.contain('p3');
      expect(map.traverse(context)).not.to.contain('p4');
      expect(map.traverse(context)).not.to.contain('p5');
      expect(map.traverse(context)).to.contain('p6');
      expect(map.traverse(context)).to.contain('p7');
      expect(map.traverse(context)).to.contain('p8');
      // the "next" waypoint
      expect(map.traverse(context)).to.contain('p9');
      expect(map.traverse(context)).not.to.contain('p10');
    });

    it('should stop traversing at the last completed waypoint in a looping journey', () => {
      const roadA = new UserJourney.Road();
      const roadB = new UserJourney.Road();

      roadA.addWaypoints(['a', 'b', 'c']);
      roadA.fork([roadA, roadB], (roads, context) => (context.c.doLoop ? roads[0] : roads[1]));
      roadB.addWaypoints(['d', 'e', 'f']);
      roadB.end();

      const map = new UserJourney.Map();
      map.startAt(roadA);

      const context = {
        a: { data: true },
        b: { data: true },
        c: { doLoop: true },
        d: { data: true },
        e: { data: true },
        f: { data: true },
      };

      expect(map.traverse(context)).to.eql(['a', 'b', 'c']);

      const context2 = {
        a: { data: true },
        b: { data: true },
        c: { doLoop: false },
      };

      expect(map.traverse(context2)).to.eql(['a', 'b', 'c', 'd']);
    });

    it('should return the first waypoint that contains validation errors', () => {
      const map = new UserJourney.Map();

      const road1 = new UserJourney.Road();
      road1.addWaypoints(['p0', 'p1', 'p2', 'p3', 'p4', 'p5']);

      map.startAt(road1);

      const dataContext = {
        p0: { data: true },
        p1: { data: true },
        p2: { data: true },
      };
      const validationContext = {
        p1: { fieldName0: [] },
      };

      expect(map.traverse(dataContext, validationContext)).to.contain('p0');
      expect(map.traverse(dataContext, validationContext)).to.contain('p1');
      expect(map.traverse(dataContext, validationContext)).to.not.contain('p2');
      expect(map.traverse(dataContext, validationContext)).to.not.contain('p3');
      expect(map.traverse(dataContext, validationContext)).to.not.contain('p4');
      expect(map.traverse(dataContext, validationContext)).to.not.contain('p5');
    });

    it('should end with the fault waypoint if a waypoint conditional throws an Exception', () => {
      const map = new UserJourney.Map();

      const road1 = new UserJourney.Road();
      road1.addWaypoints([
        'p0',
        'p1',
        ['p2', () => {
          throw new Error('TEST_FAULT');
        }],
        'p3',
      ]);

      map.startAt(road1);

      const dataContext = {
        p0: { data: true },
        p1: { data: true },
        p2: { data: true },
        p3: { data: true },
      };

      // The waypoint fault id may change, but we use the literal here to catch
      // that change. The constant is present in `UserJourney.Road.WAYPOINT_FAULT_ID`
      expect(map.traverse(dataContext)).to.contain('journey-fault');
      expect(map.traverse(dataContext)).to.contain('p1');
      expect(map.traverse(dataContext)).to.not.contain('p3');
    });

    it('should end with the fault waypoint if a fork function throws an Exception', () => {
      const map = new UserJourney.Map();
      const road1 = new UserJourney.Road();
      const road2 = new UserJourney.Road();
      const road3 = new UserJourney.Road();

      road1.addWaypoints([
        'p0',
        'p1',
      ]).fork([road2, road3], () => {
        throw new Error('TEST_FAULT');
      });

      road2.addWaypoints(['p2', 'p3']);
      road3.addWaypoints(['p4', 'p5']);

      map.startAt(road1);

      const dataContext = {
        p0: { data: true },
        p1: { data: true },
        p2: { data: true },
        p3: { data: true },
        p4: { data: true },
        p5: { data: true },
      };

      // The waypoint fault id may change, but we use the literal here to catch
      // that change. The constant is present in `UserJourney.Road.WAYPOINT_FAULT_ID`
      expect(map.traverse(dataContext)).to.contain('journey-fault');
      expect(map.traverse(dataContext)).to.contain('p1');
      expect(map.traverse(dataContext)).to.not.contain('p2');
    });

    it('should include waypoints that occur after a waypoint where "is_passable" condition returns true', () => {
      const map = new UserJourney.Map();

      const road1 = new UserJourney.Road();
      road1.addWaypoints([
        'p0',
        {
          id: 'p1',
          is_passable: () => (true),
        },
        'p2',
      ]);

      map.startAt(road1);

      const dataContext = {
        p0: { data: true },
      };
      const validationContext = {
        p1: { fieldName0: [] },
      };

      expect(map.traverse(dataContext, validationContext)).to.contain('p0');
      expect(map.traverse(dataContext, validationContext)).to.contain('p1');
      expect(map.traverse(dataContext, validationContext)).to.contain('p2');
    });

    it('should not include waypoints that occur after a waypoint where "is_passable" condition returns false', () => {
      const map = new UserJourney.Map();

      const road1 = new UserJourney.Road();
      road1.addWaypoints([
        'p0',
        {
          id: 'p1',
          is_passable: () => (false),
        },
        'p2',
      ]);

      map.startAt(road1);

      const dataContext = {
        p0: { data: true },
        p1: { data: true },
        p2: { data: true },
      };

      expect(map.traverse(dataContext)).to.contain('p0');
      expect(map.traverse(dataContext)).to.contain('p1');
      expect(map.traverse(dataContext)).to.not.contain('p2');
    });

    it('should skip the first falsy conditional waypoint in the first road', () => {
      const map = new UserJourney.Map();

      const road1 = new UserJourney.Road();
      road1.addWaypoints([
        ['p0', () => (false)],
        'p1',
      ]);

      map.startAt(road1);

      const dataContext = {
        p1: { data: true },
      };

      expect(map.traverse(dataContext)).to.contain('p1');
      expect(map.traverse(dataContext)).to.not.contain('p0');
    });
  });

  describe('traverseAhead()', () => {
    it('should throw an error when no starting road has been defined', () => {
      const map = new UserJourney.Map();
      expect(map.traverseAhead).to.throw(Error);
    });

    it('should return all waypoints in a simple, unconditional journey when given no context', () => {
      const map = new UserJourney.Map();

      const road1 = new UserJourney.Road();
      road1.addWaypoints(['p0', 'p1', 'p2', 'p3']);

      map.startAt(road1);

      expect(map.traverseAhead()).to.eql(['p0', 'p1', 'p2', 'p3']);
    });

    it('should return all waypoints in a simple, unconditional journey when given partial context', () => {
      const map = new UserJourney.Map();

      const road1 = new UserJourney.Road();
      road1.addWaypoints(['p0', 'p1', 'p2', 'p3']);

      map.startAt(road1);

      const context = {
        p0: 'data',
        p1: 'data',
      };

      expect(map.traverseAhead(context)).to.eql(['p0', 'p1', 'p2', 'p3']);
    });

    it('should return correct waypoints in a forked journey', () => {
      const map = new UserJourney.Map();
      const road1 = new UserJourney.Road();
      const road2 = new UserJourney.Road();
      const road3 = new UserJourney.Road();

      road1.addWaypoints(['p0', 'p1', 'p2', 'p3']).fork([road2, road3], (choices, context) => (context.p3.arg1 ? choices[0] : choices[1]));

      road2.addWaypoints(['p4', 'p5']);
      road3.addWaypoints(['p6', 'p7']);

      map.startAt(road1);

      const context = {
        p3: {
          arg1: false,
        },
      };

      expect(map.traverseAhead(context)).to.eql(['p0', 'p1', 'p2', 'p3', 'p6', 'p7']);
    });

    it('should return all waypoints safely when encountering a looping journey', () => {
      const roadA = new UserJourney.Road();
      const roadB = new UserJourney.Road();

      roadA.addWaypoints(['a', 'b', 'c']);
      roadA.fork([roadA, roadB], roads => (roads[1]));
      roadB.addWaypoints(['d', 'e', 'f']);
      roadB.mergeWith(roadA);

      const map = new UserJourney.Map();
      map.startAt(roadA);

      expect(map.traverseAhead()).to.eql(['a', 'b', 'c', 'd', 'e', 'f']);
    });
  });
});
