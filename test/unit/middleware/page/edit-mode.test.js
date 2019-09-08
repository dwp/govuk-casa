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
        originalUrl: '/TEST-URL',
      };
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('editOriginUrl').that.equals('/TEST-URL');
    });

    it('should default to current page when not defined in POST body', () => {
      const handler = mwEditMode(true);
      const stubReq = {
        method: 'POST',
        body: {
          edit: true,
        },
        originalUrl: '/TEST-URL',
      };
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('editOriginUrl').that.equals('/TEST-URL');
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
      expect(stubReq).to.have.property('editOriginUrl').that.equals('/%EF%B9%92%EF%BC%8E!@%C2%A3$%^&*()_+%E2%82%AC=/%C4%80%C3%BF%20/this/');
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
      expect(stubReq).to.have.property('editOriginUrl').that.equals('/%EF%B9%92%EF%BC%8E!@%C2%A3$%^&*()_+%E2%82%AC=/%C4%80%C3%BF%20/this/');
    });

    it('should only include the pathname when editorigin includes domain in POST body', () => {
      const handler = mwEditMode(true);

      let stubReq = {
        method: 'POST',
        body: {
          edit: true,
          editorigin: 'http://somewhere.test/path/name/here?p=1#x',
        },
      };
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('editOriginUrl').that.equals('/path/name/here');

      stubReq = {
        method: 'POST',
        body: {
          edit: true,
          editorigin: 'http://somewhere.test//path/name/here?p=1#x',
        },
      };
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('editOriginUrl').that.equals('/path/name/here');

      stubReq = {
        method: 'POST',
        body: {
          edit: true,
          editorigin: 'http://somewhere.test/\uFEFF/path/name/here?p=1#x',
        },
      };
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('editOriginUrl').that.equals('/%EF%BB%BF/path/name/here');

      stubReq = {
        method: 'POST',
        body: {
          edit: true,
          editorigin: 'http://somewhere.test/\u2215/path/name/here?p=1#x',
        },
      };
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('editOriginUrl').that.equals('/%E2%88%95/path/name/here');
    });

    it('should only include the pathname when editorigin includes domain in GET body', () => {
      const handler = mwEditMode(true);

      let stubReq = {
        method: 'GET',
        query: {
          edit: true,
          editorigin: 'http://somewhere.test/path/name/here?p=1#x',
        },
      };
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('editOriginUrl').that.equals('/path/name/here');

      stubReq = {
        method: 'GET',
        query: {
          edit: true,
          editorigin: 'http://somewhere.test//path/name/here?p=1#x',
        },
      };
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('editOriginUrl').that.equals('/path/name/here');
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
});
