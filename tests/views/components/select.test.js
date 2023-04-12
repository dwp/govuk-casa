import { expect } from 'chai';

import cheerio from 'cheerio';
import nunjucks from '../../../src/lib/nunjucks.js';

const njks = nunjucks({
  views: [
    'views',
    'node_modules/govuk-frontend/',
  ],
});

describe('Select macro', () => {
  it('should render default component when called', () => {
    const output = njks.render('./casa/components/select/template.njk', {
      params: {
        name: 'selectName',
        label: {
          text: 'Select Label',
        },
        items: [
          {
            value: 'twoReeds',
            text: 'Two Reeds',
          }, {
            value: 'twistedFlax',
            text: 'Twisted Flax',
          }, {
            value: 'water',
            text: 'Water',
          }, {
            value: 'eyeOfHorus',
            text: 'Eye of Horus',
          },
        ],
      },
      t: (item) => item,
    });
    const $ = cheerio.load(output);
    const label = $('label');
    const select = $('select');
    const options = select.children();

    expect(label[0].children[0].data).to.include('Select Label');
    expect(select[0].attribs.id).to.equal('f-selectName')
    expect(select[0].attribs.name).to.equal('selectName')
    expect(options[0].attribs.value).to.equal('twoReeds')
    expect(options[0].children[0].data).to.equal('Two Reeds')
    expect(options[1].attribs.value).to.equal('twistedFlax')
    expect(options[1].children[0].data).to.equal('Twisted Flax')
    expect(options[2].attribs.value).to.equal('water')
    expect(options[2].children[0].data).to.equal('Water')
    expect(options[3].attribs.value).to.equal('eyeOfHorus')
    expect(options[3].children[0].data).to.equal('Eye of Horus')
  });

  it('should render the errors supplied', () => {
    const output = njks.render('./casa/components/select/template.njk', {
      params: {
        name: 'selectName',
        label: {
          text: 'Select Label',
        },
        items: [
          {
            value: 'twoReeds',
            text: 'Two Reeds',
          }, {
            value: 'twistedFlax',
            text: 'Twisted Flax',
          }, {
            value: 'water',
            text: 'Water',
          }, {
            value: 'eyeOfHorus',
            text: 'Eye of Horus',
          },
        ],
        casaErrors: {
          selectName: 'Errors',
        },
      },
      t: (item) => item,
    });
    const $ = cheerio.load(output);
    const div = $('div');
    const p = $('p');

    expect(div.get(0).attribs.class).to.equal('govuk-form-group govuk-form-group--error');
    expect(p.get(0).attribs.id).to.equal('f-selectName-error');
    expect(p.get(0).attribs.class).to.equal('govuk-error-message');
    expect(p.get(0).attribs['data-ga-question']).to.equal(undefined);
  });

  it('should render data analytics tags when flagged', () => {
    const output = njks.render('./casa/components/select/template.njk', {
      params: {
        name: 'selectName',
        label: {
          text: 'Select Label',
        },
        items: [
          {
            value: 'twoReeds',
            text: 'Two Reeds',
          }, {
            value: 'twistedFlax',
            text: 'Twisted Flax',
          }, {
            value: 'water',
            text: 'Water',
          }, {
            value: 'eyeOfHorus',
            text: 'Eye of Horus',
          },
        ],
        casaWithAnalytics: true,
        casaErrors: {
          selectName: 'Errors',
        },
      },
      t: (item) => item,
    });
    const $ = cheerio.load(output);
    const p = $('p');

    expect(p.get(0).attribs['data-ga-question']).to.equal('Select Label');
  });

  it('should strip html tags from the data-ga-question value', () => {
    const output = njks.render('./casa/components/select/template.njk', {
      params: {
        name: 'selectName',
        label: {
          html: '<span class="visually hidden">Select Label</span>',
        },
        items: [
          {
            value: 'twoReeds',
            text: 'Two Reeds',
          }, {
            value: 'twistedFlax',
            text: 'Twisted Flax',
          }, {
            value: 'water',
            text: 'Water',
          }, {
            value: 'eyeOfHorus',
            text: 'Eye of Horus',
          },
        ],
        casaWithAnalytics: true,
        casaErrors: {
          selectName: 'Errors',
        },
      },
      t: (item) => item,
    });
    const $ = cheerio.load(output);
    const p = $('p');

    expect(p.get(0).attribs['data-ga-question']).to.equal('Select Label');
  });
});
