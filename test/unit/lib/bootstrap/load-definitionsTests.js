const chai = require('chai');
chai.use(require('sinon-chai'));
const sinon = require('sinon');

const UserJourney = require('../../../../lib/UserJourney.js');
const loadDefinitionsConstructor = require('../../../../lib/bootstrap/load-definitions.js');

const { expect } = chai;

const NOOP = () => {}; /* eslint-disable-line require-jsdoc */

describe('lib/bootstrap/load-definitions', () => {
  it('should be a function', () => {
    expect(loadDefinitionsConstructor).to.be.an.instanceof(Function);
  });

  it('should return a function', () => {
    expect(loadDefinitionsConstructor()).to.be.an.instanceof(Function);
  });

  describe('returned function', () => {
    const stucbCasa = {
      mountJourneyExpressMiddleware: null,
    };
    const stubCsrfMiddleware = NOOP;
    let loadDefinitions;
    let validUserJourneyMap;

    beforeEach(() => {
      stucbCasa.mountJourneyExpressMiddleware = sinon.stub();
      loadDefinitions = loadDefinitionsConstructor(stucbCasa, stubCsrfMiddleware);

      validUserJourneyMap = new UserJourney.Map();
      const start = new UserJourney.Road();
      validUserJourneyMap.startAt(start);
    });

    it('should throw a TypeError when pages is an invalid type', () => {
      const exceptionMsg = /^pages must be an object$/;

      expect(() => {
        loadDefinitions(null);
      }).to.throw(TypeError, exceptionMsg);

      expect(() => {
        loadDefinitions([]);
      }).to.throw(TypeError, exceptionMsg);

      expect(() => {
        loadDefinitions(Number());
      }).to.throw(TypeError, exceptionMsg);
    });

    it('should throw a TypeError when journey is an invalid type', () => {
      const exceptionMsg = /^journey must be a UserJourney.Map or an array of UserJourney.Map instances$/;

      expect(() => {
        loadDefinitions({}, null);
      }).to.throw(TypeError, exceptionMsg);

      expect(() => {
        loadDefinitions({}, {});
      }).to.throw(TypeError, exceptionMsg);

      expect(() => {
        loadDefinitions({}, Number());
      }).to.throw(TypeError, exceptionMsg);

      expect(() => {
        loadDefinitions({}, [null]);
      }).to.throw(TypeError, exceptionMsg);
    });

    it('should throw an Error when the only Map has a guid', () => {
      expect(() => {
        loadDefinitions({}, [
          new UserJourney.Map('should-be-null'),
        ]);
      }).to.throw(Error, /^When using a single journey, the guid must be null$/);
    });

    it('should not throw an exception when given valid arguments', () => {
      expect(() => {
        loadDefinitions({}, validUserJourneyMap);
      }).to.not.throw();
    });

    describe('mulitple journeys', () => {
      it('should throw an Error if any journeys do not specify a guid', () => {
        const journeys = [
          new UserJourney.Map('guid1'),
          new UserJourney.Map(),
        ];
        expect(() => {
          loadDefinitions({}, journeys);
        }).to.throw(Error, /^All journeys must specify a unique guid$/);
      });

      it('should throw an Error if duplicate journey guids are used', () => {
        const journeys = [
          new UserJourney.Map('guid1'),
          new UserJourney.Map('guid2'),
          new UserJourney.Map('guid1'),
          new UserJourney.Map('guid1'),
        ];
        expect(() => {
          loadDefinitions({}, journeys);
        }).to.throw(Error, /^Duplicate journey guids found: guid1$/);
      });
    });

    it('should mount the journey middleware', () => {
      loadDefinitions({}, validUserJourneyMap);
      return expect(stucbCasa.mountJourneyExpressMiddleware).to.have.been.calledOnce;
    });
  });
});
