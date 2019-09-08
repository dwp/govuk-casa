const npath = require('path');
const { expect } = require('chai');
const helpers = require('../helpers');

const dirMacros = npath.resolve(__dirname);

describe('casaGovukDateInput macro', () => {
  /**
   * Build a DOM object.
   *
   * @param {Object} params Parameters with which to render the template
   * @return {Object} DOM element (cheerio)
   */
  function buildDom(params = {}) {
    const p = {
      namePrefix: null,
      casaValue: null,
      casaErrors: null,
      ...params || {},
    };
    return helpers.renderTemplateFile(`${dirMacros}/date-input.njk`, {
      params: p,
    });
  }

  /* ----------------------------------------------------------- Basic markup */

  describe('Basic', () => {
    let $;

    before(() => {
      $ = buildDom({
        namePrefix: 'TEST',
        casaValue: {
          dd: '01',
          mm: '02',
          yyyy: '2000',
        },
      });
    });

    it('should generate 3 inputs', () => {
      expect($('input').length).to.equal(3);
    });

    it('should have input ids prefixed with f- by default', () => {
      $('input').each((i, el) => {
        expect($(el).attr('id')).to.match(/^f-TEST/);
      });
    });

    it('should have input names and ids suffixed with dd, mm, yyyy by default', () => {
      expect($('input').eq(0).attr('name')).to.equal('TEST[dd]');
      expect($('input').eq(0).attr('id')).to.equal('f-TEST[dd]');
      expect($('input').eq(1).attr('name')).to.equal('TEST[mm]');
      expect($('input').eq(1).attr('id')).to.equal('f-TEST[mm]');
      expect($('input').eq(2).attr('name')).to.equal('TEST[yyyy]');
      expect($('input').eq(2).attr('id')).to.equal('f-TEST[yyyy]');
    });

    it('should have a correct value attribute', () => {
      expect($('input[name="TEST[dd]"]').attr('value')).to.equal('01');
      expect($('input[name="TEST[mm]"]').attr('value')).to.equal('02');
      expect($('input[name="TEST[yyyy]"]').attr('value')).to.equal('2000');
    });

    it('should allow custom attributes per item', () => {
      const $custom = buildDom({
        namePrefix: 'TEST',
        casaValue: {
          dd: '01',
          mm: '02',
          yyyy: '2000',
        },
        items: [{
          id: 'id-not-overrideable',
          name: 'name-not-overrideable',
          value: 'value-not-overrideable',
          label: 'label-override',
          class: 'class-override',
        }, {
          id: 'id-not-overrideable',
          name: 'name-not-overrideable',
          value: 'value-not-overrideable',
          label: 'label-override',
          class: 'class-override',
        }, {
          id: 'id-not-overrideable',
          name: 'name-not-overrideable',
          value: 'value-not-overrideable',
          label: 'label-override',
          class: 'class-override',
        }],
      });

      expect($custom('input').eq(0).attr('id')).to.equal('f-TEST[dd]');
      expect($custom('input').eq(0).attr('name')).to.equal('TEST[dd]');
      expect($custom('input').eq(0).val()).to.equal('01');
      expect($custom('label[for="f-TEST[dd]"]').text().trim()).to.equal('label-override');
      expect($custom('input').eq(0).attr('class')).to.not.match(/class-override/);

      expect($custom('input').eq(1).attr('id')).to.equal('f-TEST[mm]');
      expect($custom('input').eq(1).attr('name')).to.equal('TEST[mm]');
      expect($custom('input').eq(1).val()).to.equal('02');
      expect($custom('label[for="f-TEST[mm]"]').text().trim()).to.equal('label-override');
      expect($custom('input').eq(1).attr('class')).to.not.match(/class-override/);

      expect($custom('input').eq(2).attr('id')).to.equal('f-TEST[yyyy]');
      expect($custom('input').eq(2).attr('name')).to.equal('TEST[yyyy]');
      expect($custom('input').eq(2).val()).to.equal('2000');
      expect($custom('label[for="f-TEST[yyyy]"]').text().trim()).to.equal('label-override');
      expect($custom('input').eq(2).attr('class')).to.not.match(/class-override/);
    });
  });

  /* ----------------------------------------------------------------- Errors */

  describe('Errors', () => {
    let $;

    before(() => {
      $ = buildDom({
        namePrefix: 'errtest',
        casaErrors: {
          errtest: [{
            inline: 'Test Error Message',
          }],
        },
      });
    });

    it('should have a error message with correct id', () => {
      expect($('.govuk-error-message').attr('id')).to.equal('f-errtest-error');
    });

    it('should have correct error mesage', () => {
      expect($('.govuk-error-message').text().trim()).to.equal('Error: Test Error Message');
    });

    it('should have a data-validation attribute', () => {
      expect($('#f-errtest').attr('data-validation')).to.equal('{"fn":"errtest"}');
    });
  });
});
