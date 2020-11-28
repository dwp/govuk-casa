const { expect } = require('chai');

const { request, response } = require('../../helpers/express-mocks.js');

const mwEditMode = require('../../../../middleware/page/edit-mode.js');

describe('Middleware: page/edit-mode', () => {
  describe('Initialisation', () => {
    it('should return a function', () => {
      expect(mwEditMode()).to.be.an.instanceof(Function);
    });
  });

  describe('Edit mode setting', () => {
    it('should be false when not in GET query', () => {
      const handler = mwEditMode('/', true);
      const stubReq = request({
        method: 'GET',
        query: {},
      });
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('inEditMode').that.equals(false);
    });

    it('should be false when not in POST body', () => {
      const handler = mwEditMode('/', true);
      const stubReq = request({
        method: 'POST',
        body: {},
      });
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('inEditMode').that.equals(false);
    });

    it('should be false when in GET query, but global setting is disabled', () => {
      const handler = mwEditMode('/', false);
      const stubReq = request({
        method: 'GET',
        query: {
          edit: true,
        },
      });
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('inEditMode').that.equals(false);
    });

    it('should be false when in POST body, but global setting is disabled', () => {
      const handler = mwEditMode('/', false);
      const stubReq = request({
        method: 'POST',
        body: {
          edit: true,
        },
      });
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('inEditMode').that.equals(false);
    });

    it('should be true when in GET query, and global setting is enabled', () => {
      const handler = mwEditMode('/', true);
      const stubReq = request({
        method: 'GET',
        query: {
          edit: true,
        },
      });
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('inEditMode').that.equals(true);
    });

    it('should be true when in POST body, and global setting is enabled', () => {
      const handler = mwEditMode('/', true);
      const stubReq = request({
        method: 'POST',
        body: {
          edit: true,
        },
      });
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('inEditMode').that.equals(true);
    });

    it('should remove the edit parameter from request query and body', () => {
      const handler = mwEditMode('/', true);
      const stubReq = request({
        method: 'POST',
        body: {
          edit: true,
        },
        query: {
          edit: true,
        },
      });
      handler(stubReq, null, () => {});
      expect(stubReq.body).to.not.have.property('edit');
      expect(stubReq.query).to.not.have.property('edit');
    });
  });

  describe('Edit origin url', () => {
    it('should default to current page when not defined in GET query', () => {
      const handler = mwEditMode('/', true);
      const stubReq = request({
        method: 'GET',
        query: {
          edit: true,
        },
        url: '/test-url?param=123',
      });
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('editOriginUrl').that.equals('/test-url');
    });

    it('should default to current page when not defined in POST body', () => {
      const handler = mwEditMode('/', true);
      const stubReq = request({
        method: 'POST',
        body: {
          edit: true,
        },
        url: '/test-url',
      });
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('editOriginUrl').that.equals('/test-url');
    });

    it('should default to empty string when defined in GET query, but global setting disabled', () => {
      const handler = mwEditMode('/', false);
      const stubReq = request({
        method: 'GET',
        query: {
          edit: true,
          editorigin: 'ignored',
        },
      });
      handler(stubReq, null, () => {});
      return expect(stubReq).to.have.property('editOriginUrl').that.is.empty;
    });

    it('should default to empty string when defined in POST body, but global setting disabled', () => {
      const handler = mwEditMode('/', false);
      const stubReq = request({
        method: 'POST',
        body: {
          edit: true,
          editorigin: 'ignored',
        },
      });
      handler(stubReq, null, () => {});
      return expect(stubReq).to.have.property('editOriginUrl').that.is.empty;
    });

    it('should escape all non-valid characters when defined in GET query', () => {
      const handler = mwEditMode('/', true);
      const stubReq = request({
        method: 'GET',
        query: {
          edit: true,
          editorigin: '.\uFE52\uFF0E!@£$%^&*()_+€=\\\u0100\xFF ////this/#is-a/valid/p4rt   ',
        },
      });
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('editOriginUrl').that.equals('/.%EF%B9%92%EF%BC%8E!@%C2%A3$%^&*()_+%E2%82%AC=/%C4%80%C3%BF%20////this/');
    });

    it('should escape all non-valid characters when defined in POST body', () => {
      const handler = mwEditMode('/', true);
      const stubReq = request({
        method: 'POST',
        body: {
          edit: true,
          editorigin: '.\uFE52\uFF0E!@£$%^&*()_+€=\\\u0100\xFF ////this/#is-a/valid/p4rt   ',
        },
      });
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('editOriginUrl').that.equals('/.%EF%B9%92%EF%BC%8E!@%C2%A3$%^&*()_+%E2%82%AC=/%C4%80%C3%BF%20////this/');
    });

    it('should only return pathname when given a fqdn url in editorigin', () => {
      const handler = mwEditMode('/', true);
      const stubReq = request({
        method: 'POST',
        body: {
          edit: true,
          editorigin: 'https://test.test/only/this?param=123',
        },
      });
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('editOriginUrl').that.equals('/only/this?param=123');
    });

    it('should only return pathname from a fqdn url', () => {
      const handler = mwEditMode('/', true);
      const stubReq = request({
        method: 'POST',
        body: {
          edit: true,
        },
        url: 'https://test.test/only/this?param=123',
      });
      handler(stubReq, null, () => {});
      expect(stubReq).to.have.property('editOriginUrl').that.equals('/only/this');
    });

    it('should remove the editorigin parameter from request query and body', () => {
      const handler = mwEditMode('/', true);
      const stubReq = request({
        method: 'POST',
        body: {
          editorigin: '',
        },
        query: {
          editorigin: '',
        },
      });
      handler(stubReq, null, () => {});
      expect(stubReq.body).to.not.have.property('editorigin');
      expect(stubReq.query).to.not.have.property('editorigin');
    });
  });

  // describe('Edit search params', () => {
  //   it('should default to a blank string if not in edit mode', () => {
  //     const handler = mwEditMode('/', true);
  //     const stubReq = request({
  //       method: 'GET',
  //       url: '/test-url',
  //     });
  //     handler(stubReq, null, () => {});
  //     expect(stubReq).to.have.property('editSearchParams').that.equals('');
  //   });

  //   it('should contain edit flag and edit origin when in edit mode', () => {
  //     const handler = mwEditMode('/', true);
  //     const stubReq = request({
  //       method: 'GET',
  //       query: { edit: true, editorigin: 'test-abc/cde?param=123' },
  //       url: '/test-url',
  //     });
  //     handler(stubReq, null, () => {});
  //     expect(stubReq).to.have.property('editSearchParams').that.equals('&edit&editorigin=%2Ftest-abc%2Fcde');
  //   });

  //   it('should use an origin matching the original URL string if no edit origin is defined', () => {
  //     const handler = mwEditMode('/', true);
  //     const stubReq = request({
  //       method: 'GET',
  //       query: { edit: true },
  //       url: '/test-url',
  //     });
  //     handler(stubReq, null, () => {});
  //     expect(stubReq).to.have.property('editSearchParams').that.equals('&edit&editorigin=%2Ftest-url');
  //   });

  //   it('should match the given edit origin', () => {
  //     const handler = mwEditMode('/', true);
  //     const stubReq = request({
  //       method: 'GET',
  //       query: {
  //         edit: true,
  //         editorigin: '/path/name/here',
  //       },
  //       url: '/TEST-URL',
  //     });
  //     handler(stubReq, null, () => {});
  //     expect(stubReq).to.have.property('editSearchParams').that.equals(`&edit&editorigin=%2Fpath%2Fname%2Fhere`);
  //   });
  // });
});
