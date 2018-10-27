const npath = require('path');
const { expect } = require('chai');
const I18n = require('../../../lib/I18n.js');

const testLocalesDir = npath.resolve(__dirname, '../testdata/locales/');
const testCasaLocaleDir = npath.resolve(__dirname, '../testdata/locales-casa/');

describe('I18n', () => {
  describe('Initialise module', () => {
    it('should throw an Error when a language file contains invalid JSON data', () => {
      expect(() => {
        I18n([ testLocalesDir ], [ 'badjson' ]);
      }).to.throw(Error);
    });

    it('should throw an Error when no supported locales are specified', () => {
      expect(() => {
        I18n([ testLocalesDir ]);
      }).to.throw(Error);
    });

    it('should throw an Error when an empty array of locales is provided', () => {
      expect(() => {
        I18n([ testLocalesDir ], []);
      }).to.throw(Error);
    });

    it('should not complain if language folders do not exist', () => {
      expect(() => {
        I18n([ testLocalesDir ], [ 'missing-lang' ]);
      }).to.not.throw();
    });
  });

  describe('Translator()', () => {
    it('should throw a TypeError when given a bad language', () => {
      const instance = I18n([ testLocalesDir ], [ 'en' ]);

      expect(() => new instance.Translator(123)).to.throw(Error);
    });
  });

  describe('t()', () => {
    let instance;
    let en;
    let cy;

    before(() => {
      instance = I18n([ testCasaLocaleDir, testLocalesDir ], [ 'en', 'cy' ]);
      en = new instance.Translator('en');
      cy = new instance.Translator('cy');
    });

    after(() => {
      instance = null;
      en = null;
      cy = null;
    });

    it('should translate a string to english if a translation is available', () => {
      expect(en.t('test:phrase1')).to.equal('TR_PHASE1');
    });

    it('should translate a string to welsh if a translation is available', () => {
      expect(cy.t('test:phrase1')).to.equal('TR_PHASE1_CY');
    });

    it('should translate deep objects', () => {
      expect(en.t('test:nested.object.value')).to.equal('NOV_FOUND');
    });

    it('should return undefined if no translation string is provided', () => expect(en.t()).to.be.undefined);

    it('should leave a string untouched if no translation is available', () => {
      expect(en.t('test:nonExistentPhrase')).to.equal('test:nonExistentPhrase');
    });

    it('should override English CASA translations, if defined', () => {
      expect(en.t('common:serviceName')).to.equal('TEST_SERVICE_NAME');
      expect(en.t('common:back')).to.equal('Back');
    });

    it('should override Welsh CASA translations, if defined', () => {
      expect(cy.t('common:serviceName')).to.equal('BASE_SERVICE_NAME_CY');
      expect(cy.t('common:back')).to.equal('BACK_CY');
    });

    it('should inject substitions when passed as individual arguments', () => {
      expect(en.t('test:subphrase1', 'BADGER')).to.equal('SUBPHRASE1_BADGER');
      expect(en.t('test:subphrase2', 'BADGER', 'GERBIL')).to.equal('SUBPHRASE2_BADGER_GERBIL');
    });

    it('should inject substitutions when passed as an object', () => {
      expect(en.t('test:subphrase3', { var1: 'SKUNK' })).to.equal('SUBPHRASE3_SKUNK');
      expect(en.t('test:subphrase4', { var1: 'SKUNK', var2: 'RABBIT' })).to.equal('SUBPHRASE4_RABBIT_SKUNK');
    });

    // Substitution functions are a future feature
    it('should throw an error if trying to use substitution functions', () => {
      expect(() => {
        en.t('test:subphrase1', () => (true));
      }).to.throw(Error);
    });
  });

  describe('getLanguage()', () => {
    it('should return "en" if I set "en" at construction', () => {
      const instance = I18n([ testCasaLocaleDir, testLocalesDir ], [ 'en', 'cy' ]);
      const en = new instance.Translator('en');
      expect(en.getLanguage()).to.equal('en');
    });

    it('should return "cy" if I set "cy" at construction', () => {
      const instance = I18n([ testCasaLocaleDir, testLocalesDir ], [ 'en', 'cy' ]);
      const cy = new instance.Translator('cy');
      expect(cy.getLanguage()).to.equal('cy');
    });
  });
});
