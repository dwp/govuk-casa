import { expect } from 'chai';

import { load } from 'cheerio';
import nunjucks from '../../../src/lib/nunjucks.js';

const njks = nunjucks({
  views: [
    'views',
    'node_modules/govuk-frontend/dist/',
  ],
});

describe('Dateinput macro', () => {
  it('should render default component when called', () => {
    const output = njks.render('./casa/components/date-input/template.njk', {
      params: {
        namePrefix: 'dateInputName',
        fieldset: {
          legend: {
            text: 'dateInput Legend',
          },
        },
      },
      t: (item) => item,
    });
    const $ = load(output);
    const input = $('input');
    const legend = $('legend');

    expect(input.get(0).attribs.name).to.equal('dateInputName[dd]');
    expect(input.get(0).attribs.id).to.equal('f-dateInputName[dd]');
    expect(input.get(1).attribs.name).to.equal('dateInputName[mm]');
    expect(input.get(1).attribs.id).to.equal('f-dateInputName[mm]');
    expect(legend.get(0).children[0].data).to.include('dateInput Legend');
  });

  it('should render the errors supplied', () => {
    const output = njks.render('./casa/components/date-input/template.njk', {
      params: {
        namePrefix: 'dateInputName',
        fieldset: {
          legend: {
            text: 'dateInput Legend',
          },
        },
        casaErrors: {
          dateInputName: 'Error',
        },
      },
      t: (item) => item,
    });
    const $ = load(output);
    const div = $('div');
    const p = $('p');

    expect(div.get(0).attribs.class).to.equal('govuk-form-group govuk-form-group--error');
    expect(p.get(0).attribs.id).to.equal('f-dateInputName-error');
    expect(p.get(0).attribs.class).to.equal('govuk-error-message');
    expect(p.get(0).attribs['data-ga-question']).to.equal(undefined);
  });

  it('should render data analytics tags when flagged', () => {
    const output = njks.render('./casa/components/date-input/template.njk', {
      params: {
        namePrefix: 'dateInputName',
        casaWithAnalytics: true,
        fieldset: {
          legend: {
            text: 'dateInput Legend',
          },
        },
        casaErrors: {
          dateInputName: 'Error',
        },
      },
      t: (item) => item,
    });
    const $ = load(output);
    const p = $('p');

    expect(p.get(0).attribs['data-ga-question']).to.equal('dateInput Legend');
  });

  it('should strip html tags from the data-ga-question value', () => {
    const output = njks.render('./casa/components/date-input/template.njk', {
      params: {
        namePrefix: 'dateInputName',
        casaWithAnalytics: true,
        fieldset: {
          legend: {
            html: '<span class="visually hidden">dateInput Legend</span>',
          },
        },
        casaErrors: {
          dateInputName: 'Error',
        },
      },
      t: (item) => item,
    });
    const $ = load(output);
    const p = $('p');

    expect(p.get(0).attribs['data-ga-question']).to.equal('dateInput Legend');
  });
});
