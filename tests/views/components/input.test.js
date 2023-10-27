import { expect } from 'chai';

import { load } from 'cheerio';
import nunjucks from '../../../src/lib/nunjucks.js';

const njks = nunjucks({
  views: [
    'views',
    'node_modules/govuk-frontend/dist/',
  ],
});

describe('Input macro', () => {
  it('should render default component when called', () => {
    const output = njks.render('./casa/components/input/template.njk', {
      params: {
        name: 'inputName',
        value: { inputName: '' },
        casaWithAnalytics: true,
        label: {
          text: 'inputNameLabel',
        },
      },
    });
    const $ = load(output);
    const inputs = $('input');
    const label = $('label');
    expect(inputs.get(0).attribs.name).to.equal('inputName');
    expect(inputs.get(0).attribs.id).to.equal('f-inputName');
    expect(label.get(0).attribs.for).to.equal('f-inputName');
  });

  it('should render error message when supplied', () => {
    const output = njks.render('./casa/components/input/template.njk', {
      params: {
        name: 'inputName',
        value: { inputName: '' },
        label: {
          text: 'inputNameLabel',
        },
        casaErrors: {
          inputName: 'error',
        },
        casaWithAnalytics: true,
      },
      t: (item) => item,
    });
    const $ = load(output);
    const div = $('div');
    const p = $('p');
    const input = $('input');
    expect(div.get(0).attribs.class).to.equal('govuk-form-group govuk-form-group--error');
    expect(p.get(0).attribs.class).to.equal('govuk-error-message');
    expect(input.get(0).attribs.class).to.equal('govuk-input govuk-input--error');
    expect(input.get(0).attribs['aria-describedby']).to.equal('f-inputName-error');
  });

  it('should render error with analytics flagged', () => {
    const output = njks.render('./casa/components/input/template.njk', {
      params: {
        name: 'inputName',
        value: { inputName: '' },
        label: {
          text: 'inputNameLabel',
        },
        casaErrors: {
          inputName: 'error',
        },
        casaWithAnalytics: true,
      },
      t: (item) => item,
    });
    const $ = load(output);
    const p = $('p');
    expect(p.get(0).attribs['data-ga-question']).to.equal('inputNameLabel');
  });

  it('should strip html tags from the data-ga-question value', () => {
    const output = njks.render('./casa/components/input/template.njk', {
      params: {
        name: 'inputName',
        value: { inputName: '' },
        label: {
          html: '<span class="visually hidden">inputNameLabel</span>',
        },
        casaErrors: {
          inputName: 'error',
        },
        casaWithAnalytics: true,
      },
      t: (item) => item,
    });
    const $ = load(output);
    const p = $('p');

    expect(p.get(0).attribs['data-ga-question']).to.equal('inputNameLabel');
  });
});
