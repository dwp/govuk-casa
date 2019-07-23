/**
 * Simple wrapper around all the page definitions.
 */

const privates = new WeakMap();

/**
 * PageDirectory class.
 */
class PageDirectory {
  /**
   * Constructor
   *
   * @param  {object} pages Page meta data object (indexed by the page id)
   * @throws {Error} If page id is invalid url component, or meta not an object
   */
  constructor(pages = {}) {
    // Set `id` property for each page so we don't need to keep a separate list
    // of object keys
    const seededPages = Object.create(null);
    Object.keys(pages).forEach((pid) => {
      seededPages[pid] = Object.assign(pages[pid], {
        id: pid,
      });
    })

    privates.set(this, {
      pages: seededPages,
    });

    // Validate:
    // - Check if page IDs are appropriate for use as part of URLs
    // - Check that required attributes are present
    Object.keys(pages).forEach((pid) => {
      if (!pid.match(/^[0-9a-z-/]+$/)) {
        throw new Error(`Page ID '${pid}' must contain only 0-9, a-z, -, /`);
      } else if (typeof pages[pid] !== 'object') {
        throw new Error('Page metadata must be an object');
      } else if (typeof pages[pid].view === 'undefined') {
        throw new Error(`Page metadata view is missing for '${pid}'`);
      }
    });
  }

  /**
   * Get all page IDs in the directory.
   *
   * @return {array} Page IDs
   */
  getAllPageIds() {
    const priv = privates.get(this);
    return Object.keys(priv.pages);
  }

  /**
   * Get page metadata for specific page
   *
   * @param  {string} pageId Page ID
   * @return {object} Page metadata
   */
  getPageMeta(pageId) {
    const priv = privates.get(this);
    return priv.pages[pageId];
  }

  /**
   * Get all pages.
   *
   * @return {object} All pages indexed by waypoint ID
   */
  getPages() {
    const priv = privates.get(this);
    return priv.pages;
  }
}

module.exports = PageDirectory;
