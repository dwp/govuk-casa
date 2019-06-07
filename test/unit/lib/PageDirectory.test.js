const { expect } = require('chai');
const PageDirectory = require('../../../lib/PageDirectory.js');

describe('PageDirectory', () => {
  it('should allow for no parameter in the constructor', () => expect((new PageDirectory()).getAllPageIds()).to.be.empty);

  it('should allow empty objects in the constructor', () => expect((new PageDirectory({})).getAllPageIds()).to.be.empty);

  it('should throw an exception if page meta is not an object', () => {
    expect(() => new PageDirectory({
      'page-1': {},
      'page-2': 'not an object',
    })).to.throw(Error);
  });

  it('should throw an Error if any page IDs are not valid URLs', () => {
    expect(() => new PageDirectory({
      '$invalid-url-component$': {},
    })).to.throw(Error);
  });

  it('should throw an Error if view attribute is missing', () => {
    expect(() => new PageDirectory({
      'page-1': {},
    })).to.throw(Error, /Page metadata view is missing for/);
  });

  it('should retrieve metadata from all pages', () => {
    const testmeta = {
      view: 'value',
    };
    const meta = {
      'page-1': testmeta,
      'page-2': testmeta,
      'page-3': testmeta,
      'page-4': testmeta,
    };
    const pd = new PageDirectory(meta);
    expect(pd.getAllPageIds().length).to.equal(4);
  });

  it('should retrieve metadata for a specific page', () => {
    const page1meta = {
      view: 'xyz',
    };
    const testmeta = {
      view: 'value',
    };
    const meta = {
      'page-1': page1meta,
      'page-2': testmeta,
      'page-3': testmeta,
      'page-4': testmeta,
    };
    const pd = new PageDirectory(meta);
    expect(JSON.stringify(pd.getPageMeta('page-1'))).to.equal(JSON.stringify(page1meta));
  });
});
