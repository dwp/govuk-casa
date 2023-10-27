import { expect } from 'chai';

import { load } from 'cheerio';
import nunjucks from '../../../src/lib/nunjucks.js';

const njks = nunjucks({
  views: [
    'views',
    'node_modules/govuk-frontend/dist/',
  ],
});

describe('Radios macro', () => {
  it('should render default component when called', () => {
    const output = njks.render('./casa/components/radios/template.njk', {
      params: {
        name: 'radioName',
        fieldset: {
          legend: {
            text: 'Radio Legend',
          },
        },
        items: [{
          value: 'yes',
          text: 'Yes',
        }, {
          value: 'no',
          text: 'No',
        }],
      },
      t: (item) => item,
    });
    const $ = load(output);
    const input = $('input');
    const legend = $('legend');

    expect(input.get(0).attribs.name).to.equal('radioName');
    expect(input.get(0).attribs.id).to.equal('f-radioName');
    expect(input.get(1).attribs.name).to.equal('radioName');
    expect(input.get(1).attribs.id).to.equal('f-radioName-2');
    expect(legend.get(0).children[0].data).to.include('Radio Legend');
  });

  it('should render the errors supplied', () => {
    const output = njks.render('./casa/components/radios/template.njk', {
      params: {
        name: 'radioName',
        fieldset: {
          legend: {
            text: 'Radio Legend',
          },
        },
        items: [{
          value: 'yes',
          text: 'Yes',
        }, {
          value: 'no',
          text: 'No',
        }],
        casaErrors: {
          radioName: 'Errors',
        },
      },
      t: (item) => item,
    });
    const $ = load(output);
    const div = $('div');
    const p = $('p');

    expect(div.get(0).attribs.class).to.equal('govuk-form-group govuk-form-group--error');
    expect(p.get(0).attribs.id).to.equal('f-radioName-error');
    expect(p.get(0).attribs.class).to.equal('govuk-error-message');
    expect(p.get(0).attribs['data-ga-question']).to.equal(undefined);
  });

  it('should render data analytics tags when flagged', () => {
    const output = njks.render('./casa/components/radios/template.njk', {
      params: {
        name: 'radioName',
        fieldset: {
          legend: {
            text: 'Radio Legend',
          },
        },
        items: [{
          value: 'yes',
          text: 'Yes',
        }, {
          value: 'no',
          text: 'No',
        }],
        casaWithAnalytics: true,
        casaErrors: {
          radioName: 'Errors',
        },
      },
      t: (item) => item,
    });
    const $ = load(output);
    const p = $('p');

    expect(p.get(0).attribs['data-ga-question']).to.equal('Radio Legend');
  });

  it('should strip html tags from the data-ga-question value', () => {
    const output = njks.render('./casa/components/radios/template.njk', {
      params: {
        name: 'radioName',
        fieldset: {
          legend: {
            html: '<span class="visually hidden">Radio Legend</span>',
          },
        },
        items: [{
          value: 'yes',
          text: 'Yes',
        }, {
          value: 'no',
          text: 'No',
        }],
        casaWithAnalytics: true,
        casaErrors: {
          radioName: 'Errors',
        },
      },
      t: (item) => item,
    });
    const $ = load(output);
    const p = $('p');

    expect(p.get(0).attribs['data-ga-question']).to.equal('Radio Legend');
  });
});
