const proxyquire = require('proxyquire');
const chai = require('chai');
chai.use(require('sinon-chai'));
const sinon = require('sinon');

const { app, router } = require('../../helpers/express-mocks.js');

const UserJourney = require('../../../../lib/UserJourney.js');
const loadDefinitionsConstructor = require('../../../../lib/bootstrap/load-definitions.js');

const { expect } = chai;

describe('lib/bootstrap/load-definitions.js', () => {
  it('should be a function', () => {
    expect(loadDefinitionsConstructor).to.be.an.instanceof(Function);
  });

  it('should return a function', () => {
    expect(loadDefinitionsConstructor()).to.be.an.instanceof(Function);
  });

  describe('returned function', () => {
    let stubApp;
    let stubRouter;
    let stubMwErrors;
    let stubMwPage;
    let stubMwSessionTimeout;
    let loadDefinitionsConstructorProxy;
    let loadDefinitions;
    let validUserJourneyMap;

    beforeEach(() => {
      stubApp = app();
      stubRouter = router();
      stubMwErrors = sinon.stub();
      stubMwPage = sinon.stub();
      stubMwSessionTimeout = sinon.stub();

      loadDefinitionsConstructorProxy = proxyquire('../../../../lib/bootstrap/load-definitions.js', {
        '../../middleware/errors/index.js': stubMwErrors,
        '../../middleware/page/index.js': stubMwPage,
        '../../middleware/session/timeout.js': stubMwSessionTimeout,
      });

      loadDefinitions = loadDefinitionsConstructorProxy(stubApp, stubRouter, {
        allowPageEdit: true,
        mountUrl: '/',
        sessions: { ttl: 3600 },
      });

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

    it('should mount the journey middleware in correct order', () => {
      const loadDefinitionsTest = loadDefinitionsConstructorProxy(stubApp, stubRouter, {
        allowPageEdit: true,
        mountUrl: '/test-mount/',
        sessions: { ttl: 100 },
      });
      loadDefinitionsTest({}, validUserJourneyMap);

      expect(stubMwSessionTimeout).to.have.been.calledOnceWithExactly(100);
      expect(stubMwPage).to.have.been.calledOnce;
      expect(stubMwPage).to.have.been.calledAfter(stubMwSessionTimeout);
      expect(stubMwErrors).to.have.been.calledOnceWithExactly(stubApp);
      expect(stubMwErrors).to.have.been.calledAfter(stubMwPage);
    });
  });
});
