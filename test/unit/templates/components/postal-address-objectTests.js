const npath = require('path');
const { expect } = require('chai');
const helpers = require('../helpers');

const dirMacros = npath.resolve(__dirname);

describe('casaPostalAddressObject macro', () => {
  /**
   * Build a DOM object.
   *
   * @param {Object} params Parameters with which to render the template
   * @return {Object} DOM element (cheerio)
   */
  function buildDom(params = {}) {
    const p = Object.assign({
      namePrefix: null,
      casaValue: null,
      casaErrors: null,
    }, params || {});
    return helpers.renderTemplateFile(`${dirMacros}/postal-address-object.njk`, {
      params: p,
    });
  }

  /* ----------------------------------------------------------- Basic markup */

  describe('Basic', () => {
    let $;

    before(() => {
      $ = buildDom({
        name: 'TEST',
        value: {
          address1: 'addr1',
          address2: 'addr2',
          address3: 'addr3',
          address4: 'addr4',
          postcode: 'postcode',
        },
      });
    });

    it('should generate inputs for each address component', () => {
      expect($('input').length).to.equal(5);
    });

    it('should have input ids prefixed with f-', () => {
      $('input').each((i, el) => {
        expect($(el).attr('id')).to.match(/^f-TEST/);
      });
    });

    it('should have input names and ids suffixed with address components', () => {
      for (let i = 1; i < 5; i++) {
        expect($('input').eq(i - 1).attr('name')).to.equal(`TEST[address${i}]`);
        expect($('input').eq(i - 1).attr('id')).to.equal(`f-TEST[address${i}]`);
      }
      expect($('input').eq(4).attr('name')).to.equal('TEST[postcode]');
      expect($('input').eq(4).attr('id')).to.equal('f-TEST[postcode]');
    });

    it('should have a correct value attribute', () => {
      expect($('input[name="TEST[address1]"]').attr('value')).to.equal('addr1');
      expect($('input[name="TEST[address2]"]').attr('value')).to.equal('addr2');
      expect($('input[name="TEST[address3]"]').attr('value')).to.equal('addr3');
      expect($('input[name="TEST[address4]"]').attr('value')).to.equal('addr4');
      expect($('input[name="TEST[postcode]"]').attr('value')).to.equal('postcode');
    });

    it('should allow custom attributes per item', () => {
      const $custom = buildDom({
        name: 'TEST',
        casaErrors: {
          'TEST[address1]': [{
            inline: 'err-message',
          }],
        },
        value: {
          address1: 'addr1',
          address2: 'addr2',
          address3: 'addr3',
          address4: 'addr4',
          postcode: 'postcode',
        },
        address1: {
          id: 'id-not-overrideable',
          name: 'name-not-overrideable',
          value: 'value-not-overrideable',
          label: {
            html: 'label-override',
          },
          attributes: {
            testattr: '123',
          },
        },
        address2: {
          id: 'id2-not-overrideable',
          name: 'name2-not-overrideable',
          value: 'value2-not-overrideable',
          label: {
            html: 'label2-override',
          },
          attributes: {
            testattr: '456',
          },
        },
        address3: {
          id: 'id3-not-overrideable',
          name: 'name3-not-overrideable',
          value: 'value3-not-overrideable',
          label: {
            html: 'label3-override',
          },
          classes: 'class3-override',
          attributes: {
            testattr: '789',
          },
        },
        address4: {
          id: 'id4-not-overrideable',
          name: 'name4-not-overrideable',
          value: 'value4-not-overrideable',
          label: {
            html: 'label4-override',
          },
          classes: 'class4-override',
          attributes: {
            testattr: '012',
          },
        },
        postcode: {
          id: 'id5-not-overrideable',
          name: 'name5-not-overrideable',
          value: 'value5-not-overrideable',
          label: {
            html: 'label5-override',
          },
          classes: 'class5-override',
          attributes: {
            testattr: '345',
          },
        },
      });

      expect($custom('input').eq(0).attr('id')).to.equal('f-TEST[address1]');
      expect($custom('input').eq(0).attr('name')).to.equal('TEST[address1]');
      expect($custom('input').eq(0).val()).to.equal('addr1');
      expect($custom('label[for="f-TEST[address1]"]').text().trim()).to.equal('label-override');
      expect($custom('input').eq(0).attr('testattr')).to.equal('123');
      /* eslint-disable-next-line no-unused-expressions */
      expect($custom('input').eq(0).attr('data-validation')).not.to.be.empty;

      expect($custom('input').eq(1).attr('id')).to.equal('f-TEST[address2]');
      expect($custom('input').eq(1).attr('name')).to.equal('TEST[address2]');
      expect($custom('input').eq(1).val()).to.equal('addr2');
      expect($custom('label[for="f-TEST[address2]"]').text().trim()).to.equal('label2-override');
      expect($custom('input').eq(1).attr('testattr')).to.equal('456');

      expect($custom('input').eq(2).attr('id')).to.equal('f-TEST[address3]');
      expect($custom('input').eq(2).attr('name')).to.equal('TEST[address3]');
      expect($custom('input').eq(2).val()).to.equal('addr3');
      expect($custom('label[for="f-TEST[address3]"]').text().trim()).to.equal('label3-override');
      expect($custom('input').eq(2).attr('testattr')).to.equal('789');
      expect($custom('input').eq(2).attr('class')).to.match(/class3-override/);

      expect($custom('input').eq(3).attr('id')).to.equal('f-TEST[address4]');
      expect($custom('input').eq(3).attr('name')).to.equal('TEST[address4]');
      expect($custom('input').eq(3).val()).to.equal('addr4');
      expect($custom('label[for="f-TEST[address4]"]').text().trim()).to.equal('label4-override');
      expect($custom('input').eq(3).attr('testattr')).to.equal('012');
      expect($custom('input').eq(3).attr('class')).to.match(/class4-override/);

      expect($custom('input').eq(4).attr('id')).to.equal('f-TEST[postcode]');
      expect($custom('input').eq(4).attr('name')).to.equal('TEST[postcode]');
      expect($custom('input').eq(4).val()).to.equal('postcode');
      expect($custom('label[for="f-TEST[postcode]"]').text().trim()).to.equal('label5-override');
      expect($custom('input').eq(4).attr('testattr')).to.equal('345');
      expect($custom('input').eq(4).attr('class')).to.match(/class5-override/);
    });
  });

  /* ----------------------------------------------------------------- Errors */

  describe('Errors', () => {
    let $;

    before(() => {
      $ = buildDom({
        name: 'errtest',
        casaErrors: {
          'errtest[address1]': [{
            inline: 'Test Error Message addr1',
          }],
          'errtest[address2]': [{
            inline: 'Test Error Message addr2',
          }],
          'errtest[address3]': [{
            inline: 'Test Error Message addr3',
          }],
          'errtest[address4]': [{
            inline: 'Test Error Message addr4',
          }],
          'errtest[postcode]': [{
            inline: 'Test Error Message postcode',
          }],
        },
      });
    });

    it('should have a error message with correct id', () => {
      expect($('#f-errtest\\[address1\\]-error').length).to.equal(1);
      expect($('#f-errtest\\[address2\\]-error').length).to.equal(1);
      expect($('#f-errtest\\[address3\\]-error').length).to.equal(1);
      expect($('#f-errtest\\[address4\\]-error').length).to.equal(1);
      expect($('#f-errtest\\[postcode\\]-error').length).to.equal(1);
    });

    it('should have correct error mesage', () => {
      for (let i = 1; i < 5; i++) {
        expect($(`#f-errtest\\[address${i}\\]-error`).text().trim()).to.equal(`Error: Test Error Message addr${i}`);
      }
      expect($('#f-errtest\\[postcode\\]-error').text().trim()).to.equal('Error: Test Error Message postcode');
    });

    it('should have a data-validation attribute', () => {
      for (let i = 1; i < 5; i++) {
        expect($(`#f-errtest\\[address${i}\\]`).attr('data-validation')).to.equal(`{"fn":"errtest[address${i}]"}`);
      }
      expect($('#f-errtest\\[postcode\\]').attr('data-validation')).to.equal('{"fn":"errtest[postcode]"}');
    });
  });
});
