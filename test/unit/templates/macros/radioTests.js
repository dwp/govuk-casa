const npath = require('path');
const { expect } = require('chai');
const helpers = require('../helpers');

describe('radio macro', () => {
  const dirMacros = npath.resolve(__dirname);

  /**
   * Build a DOM object.
   *
   * @param {Object} params Parameters with which to render the template
   * @return {Object} DOM element (cheerio)
   */
  function buildDom(params) {
    const p = {
      data: null,
      name: 'TEST',
      label: null,
      value: null,
      options: null,
      ...params || {},
    };
    return helpers.renderTemplateFile(`${dirMacros}/radioTemplate.html`, p);
  }

  /* ----------------------------------------------------------- Basic markup */

  describe('Basic', () => {
    let $;

    before(() => {
      $ = buildDom({
        label: 'TEST_LABEL',
        name: 'basic',
        value: 'basic1',
      });
    });

    it('should contain a label element', () => {
      expect($('label').length).to.equal(1);
    });

    it('should contain an input element', () => {
      expect($('input').length).to.equal(1);
    });

    it("should have a label with 'govuk-radios__label' class", () => expect($('label').first().hasClass('govuk-radios__label')).to.be.true);

    it('should have an empty label', () => expect($('input').text()).to.be.empty);

    it("should have a 'for' label attribute that matches 'id' on input", () => {
      expect($('label').attr('for')).to.equal($('input').attr('id'));
    });

    it('should not be checked', () => expect($('input').prop('checked')).to.be.false);
  });

  /* ----------------------------------------------------------------- Labels */

  describe('Labels', () => {
    let $;

    before(() => {
      $ = buildDom({
        label: 'TEST_LABEL',
      });
    });

    it('should have a label', () => {
      expect($('label').text()).to.contain('TEST_LABEL');
    });
  });

  /* ------------------------------------------------ Option: inputAttributes */

  describe('Option: inputAttributes', () => {
    it("should add custom 'id' attribute", () => {
      const $ = buildDom({
        name: 'IA',
        value: 'IA_VAL',
        options: {
          inputAttributes: {
            id: 'CUSTOM',
          },
        },
      });
      expect($('input').attr('id')).to.equal('CUSTOM');
    });

    it("should ignore 'idSuffix' when custom 'id' attribute is defined", () => {
      const $ = buildDom({
        name: 'IA',
        value: 'IA_VAL',
        options: {
          idSuffix: '_SUF',
          inputAttributes: {
            id: 'CUSTOM',
          },
        },
      });
      expect($('input').attr('id')).to.equal('CUSTOM');
    });

    it("should add custom 'data-test' attribute", () => {
      const $ = buildDom({
        options: {
          inputAttributes: {
            'data-test': 'CUSTOM',
          },
        },
      });
      expect($('input').attr('data-test')).to.equal('CUSTOM');
    });
  });

  /* ------------------------------------------------------- Option: idSuffix */

  describe('Option: idSuffix', () => {
    it('should add custom suffix to the auto generated ID', () => {
      const $ = buildDom({
        name: 'IA',
        value: 'IA_VAL',
        options: {
          idSuffix: '_SUF',
        },
      });
      expect($('input').attr('id')).to.equal('f-radio-IA-IA_VAL_SUF');
    });
  });

  /* ---------------------------------------------------- Option: targetPanel */

  describe('Option: targetPanel', () => {
    it('should set target panel attribute on label', () => {
      const $ = buildDom({
        options: {
          targetPanel: 'TGT_PANEL',
        },
      });
      expect($('.govuk-radios__input').attr('data-target')).to.equal('TGT_PANEL');
    });
  });

  /* -------------------------------------------------------- Option: checked */

  describe('Option: checked', () => {
    it('should set the input as checked when true', () => {
      const $ = buildDom({
        name: 'OC',
        value: 'OC_VAL',
        options: {
          checked: true,
        },
      });
      return expect($('input').prop('checked')).to.be.true;
    });

    it('should set the input as unchecked when false', () => {
      const $ = buildDom({
        name: 'OC',
        value: 'OC_VAL',
        options: {
          checked: false,
        },
      });
      return expect($('input').prop('checked')).to.be.false;
    });

    it('should set the input as checked when option is false, but value matches data', () => {
      const $ = buildDom({
        data: 'OC_VAL',
        name: 'OC',
        value: 'OC_VAL',
        options: {
          checked: false,
        },
      });
      return expect($('input').prop('checked')).to.be.true;
    });
  });
});
