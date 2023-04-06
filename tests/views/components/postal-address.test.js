import { expect } from 'chai';

import cheerio from 'cheerio';
import nunjucks from '../../../src/lib/nunjucks.js';

const njks = nunjucks({
  views: [
    'views',
    'node_modules/govuk-frontend/',
  ],
});

describe('Postal address macro', () => {
  it('should render default component when called', () => {
    const output = njks.render('./casa/components/postal-address-object/template.njk', {
      params: {
        name: 'address',
        fieldset: {
          legend: {
            text: 'Address Legend',
          },
        },
      },
      t: (item) => item,
    });
    const $ = cheerio.load(output);
    const input = $('input');
    const legend = $('legend');

    expect(input.get(0).attribs.name).to.equal('address[address1]');
    expect(input.get(0).attribs.id).to.equal('f-address[address1]');
    expect(input.get(1).attribs.name).to.equal('address[address2]');
    expect(input.get(1).attribs.id).to.equal('f-address[address2]');
    expect(input.get(2).attribs.name).to.equal('address[address3]');
    expect(input.get(2).attribs.id).to.equal('f-address[address3]');
    expect(input.get(3).attribs.name).to.equal('address[address4]');
    expect(input.get(3).attribs.id).to.equal('f-address[address4]');
    expect(input.get(4).attribs.name).to.equal('address[postcode]');
    expect(input.get(4).attribs.id).to.equal('f-address[postcode]');
    expect(legend.get(0).children[0].data).to.include('Address Legend');
  });

  it('should render the errors supplied', () => {
    const output = njks.render('./casa/components/postal-address-object/template.njk', {
      params: {
        name: 'address',
        casaErrors: {
          'address[address1]': 'Errors',
          'address[address2]': 'Errors',
          'address[address3]': 'Errors',
          'address[address4]': 'Errors',
          'address[postcode]': 'Errors',
        },
        fieldset: {
          legend: {
            text: 'Address Legend',
          },
        },
      },
      t: (item) => item,
    });
    const $ = cheerio.load(output);
    const div = $('div');
    const p = $('p');

    expect(div.get(0).attribs.class).to.equal('govuk-form-group govuk-form-group--error');
    expect(p.get(0).attribs.id).to.equal('f-address[address1]-error');
    expect(p.get(0).attribs.class).to.equal('govuk-error-message');
    expect(p.get(0).attribs['data-ga-question']).to.equal(undefined);

    expect(p.get(1).attribs.id).to.equal('f-address[address2]-error');
    expect(p.get(1).attribs.class).to.equal('govuk-error-message');
    expect(p.get(1).attribs['data-ga-question']).to.equal(undefined);

    expect(p.get(2).attribs.id).to.equal('f-address[address3]-error');
    expect(p.get(2).attribs.class).to.equal('govuk-error-message');
    expect(p.get(2).attribs['data-ga-question']).to.equal(undefined);

    expect(p.get(3).attribs.id).to.equal('f-address[address4]-error');
    expect(p.get(3).attribs.class).to.equal('govuk-error-message');
    expect(p.get(3).attribs['data-ga-question']).to.equal(undefined);

    expect(p.get(4).attribs.id).to.equal('f-address[postcode]-error');
    expect(p.get(4).attribs.class).to.equal('govuk-error-message');
    expect(p.get(4).attribs['data-ga-question']).to.equal(undefined);
  });

  it('should render data analytics tags when flagged', () => {
    const output = njks.render('./casa/components/postal-address-object/template.njk', {
      params: {
        name: 'address',
        casaErrors: {
          'address[address1]': 'Errors',
          'address[address2]': 'Errors',
          'address[address3]': 'Errors',
          'address[address4]': 'Errors',
          'address[postcode]': 'Errors',
        },
        casaWithAnalytics: true,
        fieldset: {
          legend: {
            text: 'Address Legend',
          },
        },
      },
      t: (item) => item,
    });
    const $ = cheerio.load(output);
    const p = $('p');

    expect(p.get(0).attribs['data-ga-question']).to.equal('macros:postalAddressObject.address1');
    expect(p.get(1).attribs['data-ga-question']).to.equal('macros:postalAddressObject.address2');
    expect(p.get(2).attribs['data-ga-question']).to.equal('macros:postalAddressObject.address3');
    expect(p.get(3).attribs['data-ga-question']).to.equal('macros:postalAddressObject.address4');
    expect(p.get(4).attribs['data-ga-question']).to.equal('macros:postalAddressObject.postcode');
  });

});
