const { expect } = require('chai');
const sinon = require('sinon');

const JourneyContext = require('../../../lib/JourneyContext.js');

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
      }).to.throw(TypeError, 'page must be a string or PageMeta object. Got undefined');
    });

    it('should throw a TypeError when setDataForPage() is passed an incorrectly typed argument', () => {
      const c = new JourneyContext();
      expect(() => {
        return c.setDataForPage(undefined, {});
      }).to.throw(TypeError, 'page must be a string or PageMeta object. Got undefined');
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
});
