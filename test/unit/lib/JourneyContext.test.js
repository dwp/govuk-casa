const { expect } = require('chai');
const sinon = require('sinon');

const JourneyContext = require('../../../lib/JourneyContext.js');
const { DEFAULT_CONTEXT_ID } = require('../../../lib/enums.js');

describe('JourneyContext', () => {
  describe('constructor()', () => {
    it('should contain an empty data object in initialisation', () => {
      const data = new JourneyContext();
      expect(data.getData()).to.be.an('object');
      expect(data.getData()).to.be.empty; /* eslint-disable-line no-unused-expressions */
    });

    it('should contain an empty validation object in initialisation', () => {
      const data = new JourneyContext({});
      expect(data.getValidationErrors()).to.be.an('object').and.be.empty; /* eslint-disable-line no-unused-expressions */
    });
  });

  describe('set/getData*()', () => {
    it('should return undefined if I request data for a non-existent page', () => {
      const data1 = new JourneyContext();
      return expect(data1.getDataForPage('unknownpage')).to.be.undefined;
    });

    it('should retrieve data exactly how I pass into its constructor', () => {
      const dataset = {
        pageA: {
          attr1: 'value',
        },
      };
      const data = new JourneyContext(dataset);
      expect(JSON.stringify(data.getData())).to.equal(JSON.stringify(dataset));
    });

    it('should retrieve data exactly how I pass into its setData() method', () => {
      const dataset = {
        pageA: {
          attr1: 'value',
        },
      };
      const data = new JourneyContext();
      data.setData(dataset);
      expect(JSON.stringify(data.getData())).to.equal(JSON.stringify(dataset));
    });

    it('should retrieve data for a specific page that I pass into it', () => {
      const dataset2 = {
        pageA: {
          attr1: 'value',
        },
      };
      const data2 = new JourneyContext(dataset2);
      expect(JSON.stringify(data2.getDataForPage('pageA'))).to.equal(JSON.stringify(dataset2.pageA));
    });

    it('should retrieve data correctly for a page when that data is swapped out', () => {
      const dataset = {
        pageA: {
          attr1: 'value',
        },
      };
      const swapset = {
        attr2: 'newvalue',
      };
      const data3 = new JourneyContext();
      data3.setDataForPage('pageA', dataset.pageA);
      expect(JSON.stringify(data3.getDataForPage('pageA'))).to.equal(JSON.stringify(dataset.pageA));
      data3.setDataForPage('pageA', swapset);
      expect(JSON.stringify(data3.getDataForPage('pageA'))).to.equal(JSON.stringify(swapset));
    });

    it('should transform data when passed a PageMeta `fieldWriter()` function', () => {
      const c = new JourneyContext();
      const pageMeta = {
        id: 'my-page',
        view: 'view',
        fieldWriter: sinon.stub().callsFake(({ formData }) => ({ transformed: `${formData.field0}_x` })),
      };
      c.setDataForPage(pageMeta, { field0: 'value0' });
      expect(pageMeta.fieldWriter).to.have.been.calledWithExactly({
        waypointId: 'my-page',
        formData: { field0: 'value0' },
        contextData: {},
      });
      expect(c.data).to.deep.equal({ transformed: 'value0_x' });
    });

    it('should transform data when passed a PageMeta `fieldReader()` function, and not mutate data', () => {
      const c = new JourneyContext({ firstName: 'Joe', lastName: 'Bloggs' });
      const pageMeta = {
        id: 'my-page',
        view: 'view',
        fieldReader: ({ contextData }) => {
          contextData.mutated = true;
          return { full_name: `${contextData.firstName} ${contextData.lastName}` };
        },
      };
      const spy = sinon.spy(pageMeta, 'fieldReader');
      const formData = c.getDataForPage(pageMeta);
      expect(spy).to.have.been.calledWithExactly({
        waypointId: 'my-page',
        contextData: { firstName: 'Joe', lastName: 'Bloggs', mutated: true }, // mutated our stub
      });
      expect(formData).to.deep.equal({ full_name: 'Joe Bloggs' });
      expect(c.data).to.deep.equal({ firstName: 'Joe', lastName: 'Bloggs' }); // no mutation
    });

    it('should throw a TypeError when getDataForPage() is passed an incorrectly typed argument', () => {
      const c = new JourneyContext();
      expect(() => {
        return c.getDataForPage(undefined);
      }).to.throw(TypeError, 'Page must be a string or PageMeta object. Got undefined');
    });

    it('should throw a TypeError when setDataForPage() is passed an incorrectly typed argument', () => {
      const c = new JourneyContext();
      expect(() => {
        return c.setDataForPage(undefined, {});
      }).to.throw(TypeError, 'Page must be a string or PageMeta object. Got undefined');
    });
  });

  describe('set/getValidationErrors*()', () => {
    it('should return an empty object for a non-existent page', () => {
      const data1 = new JourneyContext();
      return expect(data1.getValidationErrorsForPage('unknownpage')).to.be.an('Object').and.be.empty;
    });

    it('should return an empty object for a non-existent page', () => {
      const data1 = new JourneyContext();
      return expect(data1.getValidationErrorsForPage('unknownpage')).to.be.an('Object').and.be.empty;
    });

    it('should store throw a SyntaxError if validations are not in correct format', () => {
      const data1 = new JourneyContext();
      expect(() => {
        data1.setValidationErrorsForPage('p0', []);
      }).to.throw(SyntaxError);

      expect(() => {
        data1.setValidationErrorsForPage('p0', {});
      }).to.not.throw();

      expect(() => {
        data1.setValidationErrorsForPage('p0', {
          fieldName: {},
        });
      }).to.throw(SyntaxError);
    });

    it('should clear validation errors', () => {
      const data1 = new JourneyContext({}, {
        p0: { f0: [] },
        p1: { f0: [] },
      });
      data1.clearValidationErrorsForPage('p0');
      expect(data1.getValidationErrors()).to.eql({
        p0: null,
        p1: { f0: [] },
      });
    });

    it('should remove validation state', () => {
      const data1 = new JourneyContext({}, {
        p0: { f0: [] },
        p1: { f0: [] },
      });
      data1.removeValidationStateForPage('p0');
      expect(data1.getValidationErrors()).to.eql({
        p1: { f0: [] },
      });
    });
  });

  describe('get/set navigation language', () => {
    it('should not have a language by default', () => {
      const data1 = new JourneyContext();
      expect(data1.nav).to.be.an('object').to.not.have.property('language');
    });

    it('should set language from constructor', () => {
      const data1 = new JourneyContext(null, null, { language: 'cy' });
      expect(data1.nav).to.have.property('language').that.equals('cy');
    });

    it('should set language from setNavigationLanguage()', () => {
      const data1 = new JourneyContext();
      data1.setNavigationLanguage('fr');
      expect(data1.nav).to.have.property('language').that.equals('fr');
    });
  });

  describe('fromContext()', () => {
    it('should throw if provided with an invalid source context', () => {
      expect(() => {
        JourneyContext.fromContext();
      }).to.throw(TypeError, 'Source context must be a JourneyContext');
    });

    it('should generate a new JourneyContext, with a different ID', () => {
      const source = new JourneyContext();
      const newInstance = JourneyContext.fromContext(source);

      expect(newInstance).to.be.an.instanceof(JourneyContext);
      expect(newInstance.identity.id).not.be.empty.and.not.to.equal(source.identity.id);
    });
  });

  describe('initContextStore()', () => {
    it('should create a new context store with one default context', () => {
      const session = {};
      JourneyContext.initContextStore(session);

      expect(session).to.have.property('journeyContextList').that.is.an('object');
      expect(Object.keys(session.journeyContextList)).to.have.length(1);

      const contexts = JourneyContext.getContexts(session);
      expect(contexts[0].isDefault()).to.be.true;
    });
  });

  describe('validateContextId', () => {
    it('should return the default context ID if it is provided', () => {
      expect(JourneyContext.validateContextId(DEFAULT_CONTEXT_ID)).to.equal(DEFAULT_CONTEXT_ID);
    });

    it('should throw if the provided ID is not a strind', () => {
      expect(() => {
        JourneyContext.validateContextId(123);
      }).to.throw(TypeError, 'Context ID must be a string');
    });

    it('should throw if the provided ID is not a valid UUID', () => {
      expect(() => {
        JourneyContext.validateContextId('abcdefgh-e89b-12d3-a456-426614174000');
      }).to.throw(SyntaxError, 'Context ID is not in the correct uuid format');
    });
  });

  describe('getContextById()', () => {
    it('should return undefined if no context is found', () => {
      expect(JourneyContext.getContextById({}, 'unreal')).to.be.undefined;
    });

    it('should return a JourneyContext if found matching ID', () => {
      const session = {};
      JourneyContext.initContextStore(session);
      JourneyContext.putContext(session, JourneyContext.fromObject({
        identity: { id: 'test' }
      }));

      expect(JourneyContext.getContextById(session, 'test')).to.be.an.instanceof(JourneyContext)
    });
  });

  describe('getContextByName()', () => {
    it('should return undefined if no context is found', () => {
      expect(JourneyContext.getContextByName({ journeyContextList: {} }, 'name')).to.be.undefined;
    });

    it('should return a JourneyContext if found matching name', () => {
      const context = JourneyContext.getContextByName({
        journeyContextList: { 'some-context': { identity: { name: 'test-name' } } }
      }, 'test-name');

      expect(context).to.be.an.instanceof(JourneyContext);
      expect(context.identity.name).to.equal('test-name');
    });
  });

  describe('getContextsByTag()', () => {
    it('should return an empty array if no context is found', () => {
      expect(JourneyContext.getContextsByTag({ journeyContextList: {} }, 'tag')).to.be.an('array').and.be.empty;
    });

    it('should return an array of JourneyContexts if found matching tag', () => {
      const contexts = JourneyContext.getContextsByTag({
        journeyContextList: { 'some-context': { identity: { tags: [ 'test-tag' ] } } }
      }, 'test-tag');

      expect(contexts).to.be.an('array');
      expect(contexts).to.have.length(1);
      expect(contexts[0]).to.be.an.instanceof(JourneyContext);
      expect(contexts[0].identity.tags).to.include('test-tag');
    });
  });

  describe('getContexts()', () => {
    it('should return an empty array if no contexts are stored', () => {
      expect(JourneyContext.getContexts({ journeyContextList: {} })).to.be.an('array').and.be.empty;
    });

    it('should return an array of all stored contexts', () => {
      const contexts = JourneyContext.getContexts({
        journeyContextList: {
          first: { identity: { id: 'first' } },
          second: { identity: { id: 'second' } },
        },
      });

      expect(contexts).to.be.an('array').with.length(2);
      expect(contexts[0].identity.id).to.equal('first');
      expect(contexts[1].identity.id).to.equal('second');
    });
  });

  describe('removeContext()', () => {
    it('should leave the store unchanged if the context is not in the session store', () => {
      const missingContextObject = { identity: { id: 'test-not-present' } };
      const session = {
        journeyContextList: {
          test: { identity: { id: 'test' } },
        }
      };
      const context = JourneyContext.fromObject(missingContextObject);
      JourneyContext.removeContext(session, context);
      expect(session.journeyContextList).to.deep.equal({
        test: { identity: { id: 'test' } },
      });
    });

    it('should remove the context from the session store if presents', () => {
      const contextObject = { identity: { id: 'test' } };
      const session = {
        journeyContextList: {
          [contextObject.identity.id]: contextObject,
          another: { identity: { id: 'another' } },
        }
      };
      const context = JourneyContext.fromObject(contextObject);
      JourneyContext.removeContext(session, context);
      expect(session.journeyContextList).to.deep.equal({
        another: { identity: { id: 'another' } },
      });
    });
  });

  describe('removeContextById()', () => {
    it('should leave the store unchanged if the context is not in the session store', () => {
      const session = {
        journeyContextList: {
          test: { identity: { id: 'test' } },
        }
      };
      JourneyContext.removeContextById(session, 'test-not-present');
      expect(session.journeyContextList).to.deep.equal({
        test: { identity: { id: 'test' } },
      });
    });

    it('should remove the context from the session store if present', () => {
      const session = {
        journeyContextList: {
          test: { identity: { id: 'test' } },
          another: { identity: { id: 'another' } },
        }
      };
      JourneyContext.removeContextById(session, 'test');
      expect(session.journeyContextList).to.deep.equal({
        another: { identity: { id: 'another' } },
      });
    });
  });

  describe('removeContextByName()', () => {
    it('should leave the store unchanged if the context is not in the session store', () => {
      const session = {
        journeyContextList: {
          test: { identity: { name: 'test' } },
        }
      };
      JourneyContext.removeContextByName(session, 'test-not-present');
      expect(session.journeyContextList).to.deep.equal({
        test: { identity: { name: 'test' } },
      });
    });

    it('should remove the context from the session store if presents', () => {
      const session = {
        journeyContextList: {
          test: { identity: { id: 'test', name: 'test-name' } },
          another: { identity: { id: 'another', name: 'another' } },
        }
      };
      JourneyContext.removeContextByName(session, 'test-name');
      expect(session.journeyContextList).to.deep.equal({
        another: { identity: { id: 'another', name: 'another' } },
      });
    });
  });

  describe('removeContextsByTag()', () => {
    it('should leave the store unchanged if the contexts is not in the session store', () => {
      const session = {
        journeyContextList: {
          test: { identity: { id: 'test', tags: [ 'test-tag' ] } },
        }
      };
      JourneyContext.removeContextsByTag(session, 'test-not-present');
      expect(session.journeyContextList).to.deep.equal({
        test: { identity: { id: 'test', tags: [ 'test-tag' ] } } ,
      });
    });

    it('should remove the contexts from the session store if present', () => {
      const session = {
        journeyContextList: {
          test: { identity: { id: 'test', tags: [ 'test-tag' ] } },
          another: { identity: { id: 'another', tags: [ 'another' ] } },
        }
      };
      JourneyContext.removeContextsByTag(session, 'test-tag');
      expect(session.journeyContextList).to.deep.equal({
        another: { identity: { id: 'another', tags: [ 'another' ] } },
      });
    });
  });

  describe('removeContexts()', () => {
    it('should remove all contexts from the session store', () => {
      const session = {
        journeyContextList: {
          test: { identity: { id: 'test', tags: [ 'test-tag' ] } },
          another: { identity: { id: 'another', tags: [ 'another' ] } },
        }
      };
      JourneyContext.removeContexts(session);
      expect(session.journeyContextList).to.deep.equal({});
    });
  });

  describe('putContext()', () => {
    it('should throw if provided session is not an object', () => {
      expect(() => JourneyContext.putContext()).to.throw(TypeError, 'Session must be an object');
    });

    it('should throw if context if not a JourneyContext', () => {
      const session = {};
      JourneyContext.initContextStore(session);
      expect(() => JourneyContext.putContext(session, null)).to.throw(TypeError, 'Context must be a valid JourneyContext');
    });

    it('should throw if context does not have an id', () => {
      const session = {};
      JourneyContext.initContextStore(session);
      expect(() => JourneyContext.putContext(session, new JourneyContext())).to.throw(TypeError, 'Context must have an ID before storing in session');
    });

    it('should initialise session if not already initialised', () => {
      const initSpy = sinon.spy(JourneyContext, 'initContextStore');
      const session = {};
      const context = new JourneyContext();
      context.identity.id = '123e4567-e89b-12d3-a456-426614174000';
      JourneyContext.putContext(session, context);
      expect(initSpy).to.be.calledOnceWithExactly(session);
      initSpy.restore();
    });
  });
});
