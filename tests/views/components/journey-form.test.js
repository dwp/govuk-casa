import { expect } from 'chai';

import nunjucks from 'nunjucks';
import cheerio from 'cheerio';

nunjucks.configure(['views', 'node_modules/govuk-frontend/']);

describe('Journey form macro', () => {
  it('should render default component when called', () => {
    const output = nunjucks.render('./casa/components/journey-form/template.njk', {
      params: {
        formUrl: '/url-1',
        csrfToken: 'csrfTest',
      },
      caller: () => '',
      t: (item) => item,
    });
    const $ = cheerio.load(output);
    const form = $('form');
    const inputs = $('input');
    const buttons = $('button');
    expect(form.get(0).attribs.action).to.equal('/url-1');
    expect(form.get(0).attribs.autocomplete).to.equal('off');
    expect(inputs).to.have.length(1);
    expect(buttons).to.have.length(1);
  });
  it('should override autocomplete when supplied', () => {
    const output = nunjucks.render('./casa/components/journey-form/template.njk', {
      params: {
        formUrl: '/url-1',
        csrfToken: 'csrfTest',
        autoComplete: 'on',
      },
      caller: () => '',
      t: (item) => item,
    });
    const $ = cheerio.load(output);
    const form = $('form');
    const inputs = $('input');
    const buttons = $('button');
    expect(form.get(0).attribs.action).to.equal('/url-1');
    expect(form.get(0).attribs.autocomplete).to.equal('on');
    expect(inputs).to.have.length(1);
    expect(buttons).to.have.length(1);
  });
  it('should render no button component when called', () => {
    const output = nunjucks.render('./casa/components/journey-form/template.njk', {
      params: {
        formUrl: '/url-1',
        csrfToken: 'csrfTest',
        buttonBarHidden: true,
      },
      caller: () => '',
      t: (item) => item,
    });
    const $ = cheerio.load(output);
    const form = $('form');
    const inputs = $('input');
    const buttons = $('button');
    expect(form.get(0).attribs.action).to.equal('/url-1');
    expect(form.get(0).attribs.autocomplete).to.equal('off');
    expect(inputs).to.have.length(1);
    expect(buttons).to.have.length(0);
  });
});
