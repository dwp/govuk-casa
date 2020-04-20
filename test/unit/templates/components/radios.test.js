const npath = require('path');
const { expect } = require('chai');
const helpers = require('../helpers');

const dirMacros = npath.resolve(__dirname);

describe('casaGovukRadios macro', () => {
  /**
   * Build a DOM object.
   *
   * @param {Object} params Parameters with which to render the template
   * @return {Object} DOM element (cheerio)
   */
  function buildDom(params = {}) {
    const p = Object.assign({
      name: null,
      value: null,
      casaErrors: null,
    }, params || {});
    return helpers.renderTemplateFile(`${dirMacros}/radios.njk`, {
      params: p,
    });
  }

  /* ----------------------------------------------------------- Basic markup */

  describe('Basic', () => {
    let $;

    before(() => {
      $ = buildDom({
        name: 'TEST',
        casaValue: 'option1',
        items: [{
          value: 'option0',
        }, {
          value: 'option1',
        }, {
          value: 'option2',
        }],
      });
    });

    it('should have ids prefixed with f-', () => {
      $('input').get().forEach((input) => {
        expect($(input).attr('id')).to.match(/^f-TEST/);
      });
    });

    it('should omit counter suffix from first item id, but not others', () => {
      const inputs = $('input').get();
      expect($(inputs[0]).attr('id')).to.match(/^f-TEST$/);
      expect($(inputs[1]).attr('id')).to.match(/^f-TEST-2$/);
      expect($(inputs[2]).attr('id')).to.match(/^f-TEST-3$/);
    });

    it('should have a correct name attribute on each item', () => {
      $('input').get().forEach((input) => {
        expect($(input).attr('name')).to.equal('TEST');
      });
    });

    it('should have a correct value in each attribute', () => {
      const inputs = $('input').get();
      expect($(inputs[0]).attr('value')).to.equal('option0');
      expect($(inputs[1]).attr('value')).to.equal('option1');
      expect($(inputs[2]).attr('value')).to.equal('option2');
    });

    it('should mark the chosen value with selected', () => {
      const inputs = $('input').get();
      /* eslint-disable-next-line no-unused-expressions */
      expect($(inputs[0]).attr('checked')).to.be.undefined;
      expect($(inputs[1]).attr('checked')).to.equal('checked');
      /* eslint-disable-next-line no-unused-expressions */
      expect($(inputs[2]).attr('checked')).to.be.undefined;
    });
  });

  /* ----------------------------------------------------------------- Errors */

  describe('Errors', () => {
    let $;

    before(() => {
      $ = buildDom({
        name: 'errtest',
        casaValue: ['option1', 'option2'],
        casaErrors: {
          errtest: [{
            inline: 'Test Error Message ${var}',
            variables: { var: 'TEST_VAR' },
          }],
        },
        items: [{
          value: 'option0',
        }, {
          value: 'option1',
        }, {
          value: 'option2',
        }],
      });
    });

    it('should have a error message with correct id', () => expect($('.govuk-error-message').attr('id')).to.equal('f-errtest-error'));

    it('should have correct error mesage', () => expect($('.govuk-error-message').text().trim()).to.equal('Error: Test Error Message TEST_VAR'));

    it('should have a data-valdiation attribute on the wrapper', () => expect($('.govuk-radios').attr('data-validation')).to.equal('{"fn":"errtest"}'));
  });

  /* ----------------------------------------------------- Google Tag Manager */

  describe('Google Tag Manager', () => {
    let $;

    before(() => {
      $ = buildDom({
        fieldset: {
          legend: {
            text: 'TEST LEGEND'
          },
        },
        name: 'tmtest',
        casaValue: ['option1'],
        items: [{
          value: 'option0',
          text: 'Option Zero',
          attributes: {
            'data-test': '123',
          }
        }, {
          value: 'option1',
          html: '<b>Option One</b>',
        }, {
          value: 'option2',
          text: 'Option Two',
          attributes: {
            'data-ga-question': 'custom question',
            'data-ga-answer': 'custom answer',
          }
        }],
      });
    });

    it('should include custom item "attributes"', () => expect($($('input').get()[0]).attr('data-test')).to.equal('123'));

    it('should include "data-ga-question" matching legend text', () => expect($($('input').get()[0]).attr('data-ga-question')).to.equal('TEST LEGEND'));

    it('should include "data-ga-answer" matching item text', () => expect($($('input').get()[0]).attr('data-ga-answer')).to.equal('Option Zero'));

    it('should include "data-ga-answer" matching item html', () => expect($($('input').get()[1]).attr('data-ga-answer')).to.equal('<b>Option One</b>'));

    it('should include custom "data-ga-*" attributes', () => {
      expect($($('input').get()[2]).attr('data-ga-question')).to.equal('custom question');
      expect($($('input').get()[2]).attr('data-ga-answer')).to.equal('custom answer');
    });

    it('should include "data-ga-question" matching legend html', () => {
      $ = buildDom({
        fieldset: {
          legend: {
            html: '<b>TEST LEGEND</b>'
          },
        },
        name: 'tmtest',
        casaValue: ['option1'],
        items: [{
          value: 'option0',
          text: 'Option Zero',
          attributes: {
            'data-test': '123',
          }
        }],
      });

      expect($($('input').get()[0]).attr('data-ga-question')).to.equal('<b>TEST LEGEND</b>');
    });
  });
});
