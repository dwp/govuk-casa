import { expect } from 'chai';

import { load } from 'cheerio';
import nunjucks from '../../../src/lib/nunjucks.js';

const njks = nunjucks({
  views: [
    'views',
    'node_modules/govuk-frontend/',
  ],
});

describe('Text area macro', () => {
  it('should render default component when called', () => {
    const output = njks.render('./casa/components/textarea/template.njk', {
      params: {
        name: 'textareaName',
        label: {
          text: 'textarea Label',
        },
      },
      t: (item) => item,
    });
    const $ = load(output);
    const textarea = $('textarea');
    const label = $('label');

    expect(textarea.get(0).attribs.name).to.equal('textareaName');
    expect(textarea.get(0).attribs.id).to.equal('f-textareaName');
    expect(label.get(0).children[0].data).to.include('textarea Label');
  });

  it('should render the errors supplied', () => {
    const output = njks.render('./casa/components/textarea/template.njk', {
      params: {
        name: 'textareaName',
        label: {
          text: 'textarea Label',
        },
        casaErrors: {
          textareaName: 'Errors',
        },
      },
      t: (item) => item,
    });
    const $ = load(output);
    const div = $('div');
    const p = $('p');

    expect(div.get(0).attribs.class).to.equal('govuk-form-group govuk-form-group--error');
    expect(p.get(0).attribs.id).to.equal('f-textareaName-error');
    expect(p.get(0).attribs.class).to.equal('govuk-error-message');
    expect(p.get(0).attribs['data-ga-question']).to.equal(undefined);
  });

  it('should render data analytics tags when flagged', () => {
    const output = njks.render('./casa/components/textarea/template.njk', {
      params: {
        name: 'textareaName',
        label: {
          text: 'textarea Label',
        },
        casaWithAnalytics: true,
        casaErrors: {
          textareaName: 'Errors',
        },
      },
      t: (item) => item,
    });
    const $ = load(output);
    const p = $('p');

    expect(p.get(0).attribs['data-ga-question']).to.equal('textarea Label');
  });

  it('should strip html tags from the data-ga-question value', () => {
    const output = njks.render('./casa/components/textarea/template.njk', {
      params: {
        name: 'textareaName',
        label: {
          html: '<span class="visually hidden">textarea Label</span>',
        },
        casaWithAnalytics: true,
        casaErrors: {
          textareaName: 'Errors',
        },
      },
      t: (item) => item,
    });
    const $ = load(output);
    const p = $('p');

    expect(p.get(0).attribs['data-ga-question']).to.equal('textarea Label');
  });

});
