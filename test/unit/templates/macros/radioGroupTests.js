const helpers = require('../helpers');
const npath = require('path');
const { expect } = require('chai');

describe('radioGroup macro', () => {
  const dirMacros = npath.resolve(__dirname);

  /**
   * Build a DOM object.
   *
   * @param {Object} params Parameters with which to render the template
   * @return {Object} DOM element (cheerio)
   */
  function buildDom(params) {
    const p = Object.assign({
      data: null,
      name: 'TEST',
      label: null,
      options: null,
      errors: null,
      content: 'TEST_CONTENT'
    }, params || {});
    return helpers.renderTemplateFile(`${dirMacros}/radioGroupTemplate.html`, p);
  }

  /* ----------------------------------------------------------- Basic markup */

  describe('Basic', () => {
    let $;

    before(() => {
      $ = buildDom({
        content: 'TEST_BASIC_CONTENT'
      });
    });

    it('should have an empty label', () => expect($('span[class*="form-label"]').text()).to.be.empty);

    it("should have 'govuk-form-group' class on root element", () => expect($('div').first().hasClass('govuk-form-group')).to.be.true);

    it('should not have any errors', () => {
      expect($('div').first().hasClass('error')).to.be.false; /* eslint-disable-line no-unused-expressions */
      expect($('span.error-message').length).to.equal(0);
    });

    it("should not have an 'inline' class on fieldset", () => {
      expect($('fieldset').length).to.equal(1);
      return expect($('fieldset').first().hasClass('inline')).to.be.false;
    });

    it('should have a bold label', () => {
      expect($('fieldset legend span.govuk-label--m').length).to.equal(1);
    });

    it('should not have any hints', () => {
      expect($('.govuk-hint').length).to.equal(0);
    });

    it('should contain content', () => {
      expect($.html()).to.contain('TEST_BASIC_CONTENT');
    });
  });

  /* ----------------------------------------------------------------- Labels */

  describe('Labels', () => {
    let $;

    before(() => {
      $ = buildDom({
        label: 'TEST_LABEL'
      });
    });

    it('should have a label', () => {
      expect($('span[class*="govuk-label"]').text()).to.equal('TEST_LABEL');
    });
  });

  /* ----------------------------------------------------------------- Errors */

  describe('Errors', () => {
    let $;

    it("should have a 'govuk-form-group--error' class on the group", () => {
      $ = buildDom({
        name: 'TEST_ERR',
        errors: {
          TEST_ERR: [ {} ]
        }
      });
      return expect($('div').first().hasClass('govuk-form-group--error')).to.be.true;
    });

    it('should have an error anchor for the group', () => {
      $ = buildDom({
        name: 'TEST_ERR',
        errors: {
          TEST_ERR: [ {} ]
        }
      });
      expect($('#f-TEST_ERR-error').length).to.equal(1);
    });

    it('should show only the first error messages for each field', () => {
      $ = buildDom({
        name: 'TEST_ERR',
        errors: {
          TEST_ERR: [ {
            inline: 'inline_error_message_1',
            validator: 'dummy_error_validator_1'
          }, {
            inline: 'inline_error_message_2',
            validator: 'dummy_error_validator_2'
          } ]
        }
      });
      expect($('span.govuk-error-message').length).to.equal(1);
      expect($('span.govuk-error-message').eq(0).text()).to.match(/inline_error_message_1/);
    });

    it('should attach data-validation error info to the input', () => {
      $ = buildDom({
        name: 'TEST_ERR',
        errors: {
          TEST_ERR: [ {
            inline: 'inline_error_message_1',
            validator: 'dummy_error_validator_1'
          } ]
        }
      });

      const j = JSON.parse($('.govuk-error-message').attr('data-validation'));
      expect(j.fn).to.equal('TEST_ERR');
      expect(j.va).to.equal('dummy_error_validator_1');
    });
  });

  /* --------------------------------------------------------- Option: inline */

  describe('Option: inline', () => {
    it("should add 'inline' class to fieldset", () => {
      const $ = buildDom({
        options: {
          inline: true
        }
      });
      return expect($('.govuk-radios--inline').length).to.equal(1);
    });
  });

  /* --------------------------------------------------------- Option: unbolden */

  describe('Option: unbolden', () => {
    it("should replace 'form-label-bold' class with 'form-label'", () => {
      const $ = buildDom({
        options: {
          unbolden: true
        }
      });
      expect($('fieldset legend span.govuk-label--m').length).to.equal(0);
      expect($('fieldset legend span.govuk-label').length).to.equal(1);
    });
  });

  /* ---------------------------------------------------- Option: hiddenLabel */

  describe('Option: hiddenLabel', () => {
    it("should add 'visually-hidden' class to label container", () => {
      const $ = buildDom({
        options: {
          hiddenLabel: true
        }
      });
      return expect($('fieldset legend span.govuk-label').hasClass('govuk-visually-hidden')).to.be.true;
    });
  });

  /* ------------------------------------------------- Option: hint, hintHtml */

  describe('Option: hint, hintHtml', () => {
    it("should add a 'govuk-hint' object, with escaped content", () => {
      const $ = buildDom({
        options: {
          hint: '<b>TEST_HINT</b>'
        }
      });
      expect($('span.govuk-hint').length).to.equal(1);
      expect($('span.govuk-hint').html()).to.contain('&lt;b&gt;TEST_HINT&lt;/b&gt;');
    });

    it("should add a non-empty 'govuk-hint' object, with unescaped content", () => {
      const $ = buildDom({
        options: {
          hintHtml: '<b>TEST_HINT_HTML</b>'
        }
      });
      expect($('span.govuk-hint').length).to.equal(1);
      expect($('span.govuk-hint').html()).to.contain('<b>TEST_HINT_HTML</b>');
    });
  });

  /* ----------------------------------------------------- Option: prefixHtml */

  describe('Option: prefixHtml', () => {
    it('should inject unescaped content into markup', () => {
      const $ = buildDom({
        options: {
          prefixHtml: '<b>TEST_PREFIX</b>'
        }
      });
      expect($.html()).to.contain('<b>TEST_PREFIX</b>');
    });
  });

  /* ----------------------------------------------------- Option: labelledBy */

  describe('Option: labelledBy', () => {
    let $;

    before(() => {
      $ = buildDom({
        options: {
          labelledBy: 'TEST_ARIA_ID'
        }
      });
    });

    it('should not have a label', () => {
      expect($('span[class*="form-label"]').length).to.equal(0);
    });

    it("should add an 'aria-labelledby' attribute to fieldset", () => {
      expect($('fieldset[aria-labelledby]').length).to.equal(1);
    });

    it('should still show hints if set', () => {
      $ = buildDom({
        options: {
          labelledBy: 'TEST_ARIA_ID',
          hint: 'TEST_HINT',
          hintHtml: 'TEST_HINT_HTML'
        }
      });
      expect($('span.govuk-hint').length).to.equal(2);
    });
  });

  /* ------------------------------------------------ Option: groupAttributes */

  describe('Option: groupAttributes', () => {
    it("should add custom 'id' attribute", () => {
      const $ = buildDom({
        name: 'GA',
        options: {
          groupAttributes: {
            id: 'CUSTOM'
          }
        }
      });
      expect($('.govuk-form-group').attr('id')).to.equal('CUSTOM');
    });

    it("should add custom 'data-test' attribute", () => {
      const $ = buildDom({
        options: {
          groupAttributes: {
            'data-test': 'CUSTOM'
          }
        }
      });
      expect($('.govuk-form-group').attr('data-test')).to.equal('CUSTOM');
    });
  });
});
