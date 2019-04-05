const { expect } = require('chai');
const httpMocks = require('node-mocks-http');
const { EventEmitter } = require('events');
const PageDirectory = require('../../../../lib/PageDirectory');
const JourneyData = require('../../../../lib/JourneyData');
const UserJourney = require('../../../../lib/UserJourney');
const Validation = require('../../../../lib/Validation');

const createHandler = require('../../../../app/routes/pages/post');

const sf = Validation.SimpleField;

describe('Routes: pages POST', () => {
  describe('Initialisation', () => {
    it('should throw an error if the page definitions are the wrong type', () => {
      expect(() => {
        createHandler('/', [], new UserJourney.Map(), false);
      }).to.throw(TypeError, 'Was expecting PageDirectory');
    });

    it('should throw an error if the userjourney map is the wrong type', () => {
      expect(() => {
        createHandler('/', new PageDirectory(), 'string', false);
      }).to.throw(TypeError, /^journey must be a UserJourney.Map or an array of UserJourney.Map instances$/);
    });

    it('should return the handler function on successful initialisation', () => {
      const h = createHandler('/', new PageDirectory(), new UserJourney.Map(), false);
      expect(h).to.be.a('function');
    });
  });

  describe('Edit mode setting', () => {
    let map;
    let directory;
    let handler;
    let req;
    let res;

    beforeEach(() => {
      directory = new PageDirectory();

      const road0 = new UserJourney.Road();
      road0.addWaypoints(['page0', 'page1', 'page2']);

      map = new UserJourney.Map();
      map.startAt(road0);

      handler = createHandler('/', directory, map, false);

      req = httpMocks.createRequest({
        url: '/page0',
        body: {},
        session: {
          id: 'sessionId',
          save: (cb) => {
            cb();
          },
        },
        journeyData: new JourneyData(),
      });

      res = httpMocks.createResponse({
        eventEmitter: EventEmitter,
      });
    });

    it('should redirect to the last page injourney after a successful validation following failed validation', (done) => {
      handler = createHandler('/', directory, map, true);

      Object.assign(req, {
        url: '/page1',
        body: {
          edit: true,
          dummyContent: true,
        },
        journeyData: new JourneyData(
          {
            page0: { data: true },
            page1: { data: true },
            page2: { data: true },
          },
          {
            page1: {
              fieldName0: [],
            },
          },
        ),
      });

      res.on('end', () => {
        try {
          expect(res._getRedirectUrl()).to.equal('/page2#');
          done();
        } catch (e) {
          done(e);
        }
      });

      handler(req, res);
    });
  });

  describe('Gathering', () => {
    it('should populate the req.journeyData object with all captured data', (done) => {
      const directory = new PageDirectory({
        page0: {
          view: 'page0',
        },
      });

      const road0 = new UserJourney.Road();
      road0.addWaypoints(['page0']);

      const map = new UserJourney.Map();
      map.startAt(road0);

      const handler = createHandler('/', directory, map, false);

      const req = httpMocks.createRequest({
        url: '/page0',
        body: {
          name: 'Joe',
        },
        session: {
          id: 'sessionId',
          save: (cb) => {
            cb();
          },
        },
        journeyData: new JourneyData(),
      });

      const res = httpMocks.createResponse({
        eventEmitter: EventEmitter,
      });
      res.on('end', () => {
        try {
          expect(req.journeyData.getDataForPage('page0')).to.eql({
            name: 'Joe',
          });
          done();
        } catch (e) {
          done(e);
        }
      });

      handler(req, res);
    });

    it('should execute pregather hook', (done) => {
      const directory = new PageDirectory({
        page0: {
          view: 'page0',
          hooks: {
            pregather: (req, res, cb) => {
              req.HOOK_CALLED = true;
              cb();
            },
          },
        },
      });

      const road0 = new UserJourney.Road();
      road0.addWaypoints(['page0']);

      const map = new UserJourney.Map();
      map.startAt(road0);

      const handler = createHandler('/', directory, map, false);

      const req = httpMocks.createRequest({
        url: '/page0',
        body: {
          name: 'Joe',
        },
        session: {
          id: 'sessionId',
          save: (cb) => {
            cb();
          },
        },
        journeyData: new JourneyData(),
      });

      const res = httpMocks.createResponse({
        eventEmitter: EventEmitter,
      });
      res.on('end', () => {
        try {
          expect(req).to.have.property('HOOK_CALLED', true);
          done();
        } catch (e) {
          done(e);
        }
      });

      handler(req, res);
    });

    it('should modify data after passing through defined modifiers', (done) => {
      const directory = new PageDirectory({
        page0: {
          view: 'page0',
          fieldGatherModifiers: {
            name: v => (v.fieldValue === 'Joe' ? 'Jim' : v.fieldValue),
          },
          hooks: {
            pregather: (req, res, cb) => {
              if (req.body.name === 'Joe') {
                req.PREGATHER_HOOK_CALLED = true;
              }
              cb();
            },
            prevalidate: (req, res, cb) => {
              if (req.body.name === 'Jim') {
                req.PREVALIDATE_HOOK_CALLED = true;
              }
              cb();
            },
          },
        },
      });

      const road0 = new UserJourney.Road();
      road0.addWaypoints(['page0']);

      const map = new UserJourney.Map();
      map.startAt(road0);

      const handler = createHandler('/', directory, map, false);

      const req = httpMocks.createRequest({
        url: '/page0',
        body: {
          name: 'Joe',
        },
        session: {
          id: 'sessionId',
          save: (cb) => {
            cb();
          },
        },
        journeyData: new JourneyData(),
      });

      const res = httpMocks.createResponse({
        eventEmitter: EventEmitter,
      });
      res.on('end', () => {
        try {
          expect(req).to.have.property('PREGATHER_HOOK_CALLED', true);
          expect(req).to.have.property('PREVALIDATE_HOOK_CALLED', true);
          done();
        } catch (e) {
          done(e);
        }
      });

      handler(req, res);
    });
  });

  describe('Validating', () => {
    let map;
    let directory;
    let handler;
    let reqMock;
    let resMock;

    beforeEach(() => {
      directory = new PageDirectory({
        page2: {
          view: 'page2',
          fieldValidators: {
            x: sf([
              v => (v === 1 ? Promise.resolve() : Promise.reject(new Error('VALIDATION FAIL'))),
            ]),
          },
        },
        page3: {
          view: 'page3-view.html',
          fieldValidators: {
            y: sf([
              v => (v === 1 ? Promise.resolve() : Promise.reject(new Error('VALIDATION FAIL'))),
            ]),
          },
        },
        page4: {
          view: 'page4',
          hooks: {
            prevalidate: (req, res, cb) => {
              req.PREVALIDATE_HOOK_CALLED = true;
              cb();
            },
            postvalidate: (req, res, cb) => {
              req.POSTVALIDATE_HOOK_CALLED = true;
              cb();
            },
          },
        },
        page5: {
          view: 'page5',
          fieldValidators: {
            z: sf([
              v => (v === 1 ? Promise.resolve() : Promise.reject(new Error('VALIDATION FAIL'))),
            ]),
          },
          hooks: {
            prerender: () => {
              throw new Error('TEST RENDER ERROR');
            },
          },
        },
        page6: {
          view: 'page6',
          fieldGatherModifiers: {
            x: v => (v.fieldValue === 1 ? 100 : v.fieldValue),
          },
          fieldValidators: {
            x: sf([
              v => (v === 100 ? Promise.resolve() : Promise.reject(new Error('VALIDATION FAIL'))),
            ]),
          },
          hooks: {
            prerender: () => {
              throw new Error('TEST RENDER ERROR');
            },
          },
        },
        page7: {
          view: 'page7',
          fieldGatherModifiers: {
            x: v => (v.fieldValue === 1 ? 100 : v.fieldValue),
          },
          fieldValidators: {
            x: sf([
              v => (v === 100 ? Promise.resolve() : Promise.reject(new Error('VALIDATION FAIL'))),
            ]),
          },
          hooks: {
            prerender: () => {
              throw new Error('TEST RENDER ERROR');
            },
          },
        },
        page8: {
          view: 'page8-view.html',
          fieldValidators: {
            x: sf([
              (v) => {
                const err = new Error();
                err.focusSuffix = ['-suffix1', '-suffix2'];
                return v === 1 ? Promise.resolve() : Promise.reject(err)
              },
            ]),
          },
        },
      });

      const road0 = new UserJourney.Road();
      road0.addWaypoints(['page0', 'page1', 'page2', 'page3', 'page4', 'page5', 'page6', 'page7', 'page8']);

      map = new UserJourney.Map();
      map.startAt(road0);

      handler = createHandler('/', directory, map, false);

      reqMock = httpMocks.createRequest({
        body: {},
        session: {
          id: 'sessionId',
          save: (cb) => {
            cb();
          },
        },
        journeyData: new JourneyData({
          page0: { data: true },
          page1: { data: true },
        }),
      });
      reqMock.i18nTranslator = {
        t: s => s,
      };

      resMock = httpMocks.createResponse({
        eventEmitter: EventEmitter,
      });
    });

    it('should keep page data and store validation errors for the current page waypoint when data is invalid', (done) => {
      Object.assign(reqMock, {
        url: '/page2',
        body: {
          x: 'this should trigger validation rejection',
        },
      });

      resMock.on('end', () => {
        try {
          expect(reqMock.journeyData.getDataForPage('page2')).to.not.eql({});
          expect(reqMock.session.journeyData.page2).to.not.eql({});
          expect(reqMock.journeyData.getValidationErrorsForPage('page2'))
            .to.have.property('x')
            .that.is.an('Array');
          done();
        } catch (e) {
          done(e);
        }
      });

      handler(reqMock, resMock);
    });

    it('should include errors in the rendered view when data is invalid', (done) => {
      Object.assign(reqMock, {
        url: '/page3',
        body: {
          x: 'this should trigger validation rejection',
        },
      });

      resMock.on('end', () => {
        try {
          const viewData = resMock._getRenderData();
          expect(viewData).to.have.property('formErrors');
          expect(JSON.stringify(viewData.formErrors)).to.contain.string('VALIDATION FAIL');
          done();
        } catch (e) {
          done(e);
        }
      });

      handler(reqMock, resMock);
    });

    it('should generate errors that include a fieldHref attribute', (done) => {
      Object.assign(reqMock, {
        url: '/page3',
        body: {
          y: 'this should trigger validation rejection',
        },
      });

      resMock.on('end', () => {
        try {
          const viewData = resMock._getRenderData();
          expect(viewData).to.have.property('formErrors').and.have.property('y').and.is.an('array');
          expect(viewData.formErrors.y[0]).to.have.property('fieldHref').that.equals('#f-y');
          done();
        } catch (e) {
          done(e);
        }
      });

      handler(reqMock, resMock);
    });

    it('should set fieldHref that includes the first of any specified focusSuffix', (done) => {
      Object.assign(reqMock, {
        url: '/page8',
        body: {
          x: 'this should trigger validation rejection',
        },
      });

      resMock.on('end', () => {
        try {
          const viewData = resMock._getRenderData();
          expect(viewData).to.have.property('formErrors').and.have.property('x').and.is.an('array');
          expect(viewData.formErrors.x[0]).to.have.property('fieldHref').that.equals('#f-x-suffix1');
          done();
        } catch (e) {
          done(e);
        }
      });

      handler(reqMock, resMock);
    });

    it('should call pre/post validate hooks when defined', (done) => {
      Object.assign(reqMock, {
        url: '/page4',
        body: {
          x: 1,
        },
      });

      resMock.on('end', () => {
        try {
          expect(reqMock).to.have.property('PREVALIDATE_HOOK_CALLED', true);
          expect(reqMock).to.have.property('POSTVALIDATE_HOOK_CALLED', true);
          done();
        } catch (e) {
          done(e);
        }
      });

      handler(reqMock, resMock);
    });

    it('should redirect to the next waypoint when given valid data', (done) => {
      Object.assign(reqMock, {
        url: '/page2',
        body: {
          x: 1,
        },
      });

      resMock.on('end', () => {
        try {
          expect(resMock._getRedirectUrl()).to.equal('/page3#');
          done();
        } catch (e) {
          done(e);
        }
      });

      handler(reqMock, resMock);
    });

    it('should change the data and then validate, then redirect to the next waypoint when given valid data and defined data gatherers', (done) => {
      Object.assign(reqMock, {
        url: '/page6',
        body: {
          x: 1,
        },
      });

      reqMock.journeyData = new JourneyData({
        page0: { data: true },
        page1: { data: true },
        page2: { data: true },
        page3: { data: true },
        page4: { data: true },
        page5: { data: true },
      });

      resMock.on('end', () => {
        try {
          expect(resMock._getRedirectUrl()).to.equal('/page7#');
          done();
        } catch (e) {
          done(e);
        }
      });

      handler(reqMock, resMock);
    });

    it('should respond with 500 status when rendering exceptions occur', (done) => {
      Object.assign(reqMock, {
        url: '/page5',
        body: {
          z: 'trigger valdiation failure',
        },
      });

      resMock.on('end', () => {
        try {
          expect(resMock._getStatusCode()).to.equal(500);
          done();
        } catch (e) {
          done(e);
        }
      });

      handler(reqMock, resMock);
    });
  });

  describe('Redirecting', () => {
    let map;
    let directory;
    let handler;
    let reqMock;
    let resMock;

    beforeEach(() => {
      directory = new PageDirectory({
        page0: {
          view: 'page0',
          hooks: {
            preredirect: (req, res, cb) => {
              req.PREREDIRECT_HOOK_CALLED = true;
              cb();
            },
          },
        },
        page1: { view: 'page1' },
        page2: { view: 'page2' },
        page3: { view: 'page3' },
        page4: { view: 'page4' },
      });

      const road0 = new UserJourney.Road();
      const road1 = new UserJourney.Road();
      const road2 = new UserJourney.Road();
      road0
        .addWaypoints(['page0', 'page1', 'page2'])
        .fork([road1, road2], (roads, context) => (context.page2.x === 1 ? roads[1] : roads[0]));
      road1.addWaypoints(['page3a', 'page4a', 'review']).end();
      road2.addWaypoints(['page3b', 'page4b']).end();

      map = new UserJourney.Map();
      map.startAt(road0);

      handler = createHandler('/', directory, map, true);

      reqMock = httpMocks.createRequest({
        body: {},
        session: {
          id: 'sessionId',
          save: (cb) => {
            cb();
          },
        },
        journeyData: new JourneyData({
          page0: { data: true },
          page1: { data: true },
          page2: { data: true, x: 0 },
          page3a: { data: true },
          page4a: { data: true },
          page3b: { data: true },
          page4b: { data: true },
        }),
      });

      resMock = httpMocks.createResponse({
        eventEmitter: EventEmitter,
      });
    });

    it('should execute the preredirect hook', (done) => {
      Object.assign(reqMock, {
        url: '/page0',
      });

      resMock.on('end', () => {
        try {
          expect(reqMock).to.have.property('PREREDIRECT_HOOK_CALLED', true);
          done();
        } catch (e) {
          done(e);
        }
      });

      handler(reqMock, resMock);
    });

    it('should redirect to the next waypoint in the same road', (done) => {
      Object.assign(reqMock, {
        url: '/page0',
        body: {
          dummyData: 1,
        },
      });

      resMock.on('end', () => {
        try {
          expect(resMock._getRedirectUrl()).to.equal('/page1#');
          done();
        } catch (e) {
          done(e);
        }
      });

      handler(reqMock, resMock);
    });

    it('should redirect to the next waypoint in a forked road', (done) => {
      Object.assign(reqMock, {
        url: '/page2',
        body: {
          x: 1,
        },
      });

      resMock.on('end', () => {
        try {
          expect(resMock._getRedirectUrl()).to.equal('/page3b#');
          done();
        } catch (e) {
          done(e);
        }
      });

      handler(reqMock, resMock);
    });

    it('should redirect to the same URL if the waypoint is not defined in the journey', (done) => {
      Object.assign(reqMock, {
        url: '/waypoint-not-in-the-journey',
        originalUrl: '/waypoint-not-in-the-journey',
        body: {
          dummyData: 'data',
        },
      });

      resMock.on('end', () => {
        try {
          expect(resMock._getRedirectUrl()).to.equal('/waypoint-not-in-the-journey#');
          done();
        } catch (e) {
          done(e);
        }
      });

      handler(reqMock, resMock);
    });

    it('should redirect to the review page if in edit mode and the user journey has not been altered', (done) => {
      Object.assign(reqMock, {
        url: '/page1',
        originalUrl: '/page1',
        inEditMode: true,
        editOriginUrl: 'review',
        body: {
          dummyData: 'data',
        },
      });

      resMock.on('end', () => {
        try {
          expect(resMock._getRedirectUrl()).to.equal('/review#');
          done();
        } catch (e) {
          done(e);
        }
      });

      handler(reqMock, resMock);
    });

    it('should redirect to the last unchanged waypoint if in edit mode and the user journey has been altered', (done) => {
      Object.assign(reqMock, {
        url: '/page2',
        inEditMode: true,
        editOriginUrl: 'review',
        body: {
          x: 1,
        },
      });

      resMock.on('end', () => {
        try {
          expect(resMock._getRedirectUrl()).to.equal('/page3b#');
          done();
        } catch (e) {
          done(e);
        }
      });

      handler(reqMock, resMock);
    });
  });

  it('should resMockpond with 500 status if session fails to save', (done) => {
    const directory = new PageDirectory();

    const road0 = new UserJourney.Road();
    road0.addWaypoints(['page0']);
    const map = new UserJourney.Map();
    map.startAt(road0);

    const handler = createHandler('/', directory, map, true);

    const reqMock = httpMocks.createRequest({
      url: '/page0',
      body: {},
      session: {
        id: 'sessionId',
        save: (cb) => {
          cb(new Error('TEST ERROR'));
        },
      },
      journeyData: new JourneyData(),
    });

    const resMock = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });
    resMock.on('end', () => {
      try {
        expect(resMock._getStatusCode()).to.equal(500);
        done();
      } catch (e) {
        done(e);
      }
    });

    handler(reqMock, resMock);
  });
});
