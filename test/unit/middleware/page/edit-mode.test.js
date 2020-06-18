const { expect } = require('chai');

const mwEditMode = require('../../../../middleware/page/edit-mode.js');

describe('Middleware: page/edit-mode', () => {
  describe('Initialisation', () => {
    it('should return a function', () => {
      expect(mwEditMode()).to.be.an.instanceof(Function);
    });
  });

  describe('Edit mode setting', () => {
    it('should be false when not in GET query', () => {
      const handler = mwEditMode(true);
      const stubReq = {
        method: 'GET',
        query: {},
      };
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('inEditMode').that.equals(false);
    });

    it('should be false when not in POST body', () => {
      const handler = mwEditMode(true);
      const stubReq = {
        method: 'POST',
        body: {},
      };
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('inEditMode').that.equals(false);
    });

    it('should be false when in GET query, but global setting is disabled', () => {
      const handler = mwEditMode(false);
      const stubReq = {
        method: 'GET',
        query: {
          edit: true,
        },
      };
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('inEditMode').that.equals(false);
    });

    it('should be false when in POST body, but global setting is disabled', () => {
      const handler = mwEditMode(false);
      const stubReq = {
        method: 'POST',
        body: {
          edit: true,
        },
      };
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('inEditMode').that.equals(false);
    });

    it('should be true when in GET query, and global setting is enabled', () => {
      const handler = mwEditMode(true);
      const stubReq = {
        method: 'GET',
        query: {
          edit: true,
        },
      };
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('inEditMode').that.equals(true);
    });

    it('should be true when in POST body, and global setting is enabled', () => {
      const handler = mwEditMode(true);
      const stubReq = {
        method: 'POST',
        body: {
          edit: true,
        },
      };
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('inEditMode').that.equals(true);
    });

    it('should remove the edit parameter from request query and body', () => {
      const handler = mwEditMode(true);
      const stubReq = {
        method: 'POST',
        body: {
          edit: true,
        },
        query: {
          edit: true,
        },
      };
      handler(stubReq, null, () => {});
      expect(stubReq.body).to.not.have.property('edit');
      expect(stubReq.query).to.not.have.property('edit');
    });
  });

  describe('Edit origin url', () => {
    it('should default to current page when not defined in GET query', () => {
      const handler = mwEditMode(true);
      const stubReq = {
        method: 'GET',
        query: {
          edit: true,
        },
        originalUrl: '/test-url',
      };
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('editOriginUrl').that.equals('/test-url');
    });

    it('should default to current page when not defined in POST body', () => {
      const handler = mwEditMode(true);
      const stubReq = {
        method: 'POST',
        body: {
          edit: true,
        },
        originalUrl: '/test-url',
      };
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('editOriginUrl').that.equals('/test-url');
    });

    it('should default to empty string when defined in GET query, but global setting disabled', () => {
      const handler = mwEditMode(false);
      const stubReq = {
        method: 'GET',
        query: {
          edit: true,
          editorigin: 'ignored',
        },
      };
      handler(stubReq, null, () => {});
      return expect(stubReq).to.have.property('editOriginUrl').that.is.empty;
    });

    it('should default to empty string when defined in POST body, but global setting disabled', () => {
      const handler = mwEditMode(false);
      const stubReq = {
        method: 'POST',
        body: {
          edit: true,
          editorigin: 'ignored',
        },
      };
      handler(stubReq, null, () => {});
      return expect(stubReq).to.have.property('editOriginUrl').that.is.empty;
    });

    it('should escape all non-valid characters when defined in GET query', () => {
      const handler = mwEditMode(true);
      const stubReq = {
        method: 'GET',
        query: {
          edit: true,
          editorigin: '.\uFE52\uFF0E!@£$%^&*()_+€=\\\u0100\xFF ////this/#is-a/valid/p4rt   ',
        },
      };
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('editOriginUrl').that.equals('/this/is-a/valid/p4rt');
    });

    it('should escape all non-valid characters when defined in POST body', () => {
      const handler = mwEditMode(true);
      const stubReq = {
        method: 'POST',
        body: {
          edit: true,
          editorigin: '.\uFE52\uFF0E!@£$%^&*()_+€=\\\u0100\xFF ////this/#is-a/valid/p4rt   ',
        },
      };
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('editOriginUrl').that.equals('/this/is-a/valid/p4rt');
    });

    it('should remove the editorigin parameter from request query and body', () => {
      const handler = mwEditMode(true);
      const stubReq = {
        method: 'POST',
        body: {
          editorigin: '',
        },
        query: {
          editorigin: '',
        },
      };
      handler(stubReq, null, () => {});
      expect(stubReq.body).to.not.have.property('editorigin');
      expect(stubReq.query).to.not.have.property('editorigin');
    });
  });

  describe('Edit search params', () => {
    it('should default to a blank string if not in edit mode', () => {
      const handler = mwEditMode(true);
      const stubReq = {
        method: 'GET',
        originalUrl: '/test-url',
      };
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('editSearchParams').that.equals('');
    });

    it('should contain edit flag and edit origin when in edit mode', () => {
      const handler = mwEditMode(true);
      const stubReq = {
        method: 'GET',
        query: { edit: true, editorigin: 'test-abc/cde' },
        originalUrl: '/test-url',
      };
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('editSearchParams').that.equals('&edit&editorigin=%2Ftest-abc%2Fcde');
    });

    it('should use an origin matching the original URL string if no edit origin is defined', () => {
      const handler = mwEditMode(true);
      const stubReq = {
        method: 'GET',
        query: { edit: true },
        originalUrl: '/test-url',
      };
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('editSearchParams').that.equals('&edit&editorigin=%2Ftest-url');
    });

    it('should match the given edit origin', () => {
      const handler = mwEditMode(true);
      const stubReq = {
        method: 'GET',
        query: {
          edit: true,
          editorigin: '/path/name/here',
        },
        originalUrl: '/TEST-URL',
      };
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('editSearchParams').that.equals(`&edit&editorigin=%2Fpath%2Fname%2Fhere`);
    });
  });
});
