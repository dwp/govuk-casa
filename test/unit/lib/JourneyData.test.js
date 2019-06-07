const { expect } = require('chai');
const JourneyData = require('../../../lib/JourneyData.js');

describe('JourneyData', () => {
  describe('constructor()', () => {
    it('should contain an empty data object in initialisation', () => {
      const data = new JourneyData();
      expect(data.getData()).to.be.an('object');
      expect(data.getData()).to.be.empty; /* eslint-disable-line no-unused-expressions */
    });

    it('should contain an empty validation object in initialisation', () => {
      const data = new JourneyData({});
      expect(data.getValidationErrors()).to.be.an('object').and.be.empty; /* eslint-disable-line no-unused-expressions */
    });
  });

  describe('set/getData*()', () => {
    it('should return undefined if I request data for a non-existent page', () => {
      const data1 = new JourneyData();
      return expect(data1.getDataForPage('unknownpage')).to.be.undefined;
    });

    it('should retrieve data exactly how I pass into its constructor', () => {
      const dataset = {
        pageA: {
          attr1: 'value',
        },
      };
      const data = new JourneyData(dataset);
      expect(JSON.stringify(data.getData())).to.equal(JSON.stringify(dataset));
    });

    it('should retrieve data exactly how I pass into its setData() method', () => {
      const dataset = {
        pageA: {
          attr1: 'value',
        },
      };
      const data = new JourneyData();
      data.setData(dataset);
      expect(JSON.stringify(data.getData())).to.equal(JSON.stringify(dataset));
    });

    it('should retrieve data for a specific page that I pass into it', () => {
      const dataset2 = {
        pageA: {
          attr1: 'value',
        },
      };
      const data2 = new JourneyData(dataset2);
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
      const data3 = new JourneyData();
      data3.setDataForPage('pageA', dataset.pageA);
      expect(JSON.stringify(data3.getDataForPage('pageA'))).to.equal(JSON.stringify(dataset.pageA));
      data3.setDataForPage('pageA', swapset);
      expect(JSON.stringify(data3.getDataForPage('pageA'))).to.equal(JSON.stringify(swapset));
    });
  });

  describe('set/getValidationErrors*()', () => {
    it('should return an empty object for a non-existent page', () => {
      const data1 = new JourneyData();
      return expect(data1.getValidationErrorsForPage('unknownpage')).to.be.an('Object').and.be.empty;
    });

    it('should return an empty object for a non-existent page', () => {
      const data1 = new JourneyData();
      return expect(data1.getValidationErrorsForPage('unknownpage')).to.be.an('Object').and.be.empty;
    });

    it('should store throw a SyntaxError if validations are not in correct format', () => {
      const data1 = new JourneyData();
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
      const data1 = new JourneyData({}, {
        p0: { f0: [] },
        p1: { f0: [] },
      });
      data1.clearValidationErrorsForPage('p0');
      expect(data1.getValidationErrors()).to.eql({
        p1: { f0: [] },
      });
    });
  });
});
