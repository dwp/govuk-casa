import { expect } from 'chai';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import CasaTemplateLoader from '../../src/lib/CasaTemplateLoader.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('CasaTemplateLoder', () => {

  it('applies block modifications to the original source', () => {
    const loader = new CasaTemplateLoader([__dirname]);

    loader.modifyBlock('testBlock', () => 'NEW CONTENT');

    expect(loader.getSource('test-template.njk').src.replace(/\n/g, '').replace(/\s+/g, ' ')).to.contain('{% block testBlock %}NEW CONTENT Original Content{% endblock %}');
  });

});
