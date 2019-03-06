/* eslint sonarjs/cognitive-complexity: 0 */
/**
 * Common setup of a CASA page.
 */

(function casaJs() {
  /**
   * Polyfill for attaching event listeners to elements.
   *
   * @param {HTMLElement} obj Element to which event is attached
   * @param {string} ev Event name
   * @param {Function} func Listener
   * @returns {void}
   */
  function attachEventPolyfill(obj, ev, func) {
    if (obj.addEventListener) {
      obj.addEventListener(ev, func, false);
    } else if (obj.attachEvent) {
      obj.attachEvent('on' + ev, func);
    } else {
      throw new Error('This browser does not support modern event listeners');
    }
  }

  // Remove the trailing "#" after a redirect
  if ('pushState' in window.history && window.location.hash === '') {
    window.history.replaceState(
      '',
      document.title,
      window.location.pathname + window.location.search
    );
  }

  // Focus on error summary, if present. This will allow screen readers to
  // immediately focus on the errors in the form.
  var errorSummary = document.getElementById('error-summary-title');
  if (errorSummary) {
    errorSummary.focus();
  }

  // Workaround unwanted bfcache (back-forward cache) behaviour in Safari (until
  // we can investigate more into issue #2)
  // Problem:
  // - Pressing back button after submitted a completed form presents a
  //   pre-modified version of the form showing stale data.
  // Fix:
  // - When a page is retrieved from the bfcache, force a page reload to show the
  //   updated form data
  attachEventPolyfill(window, 'pageshow', function hPageShow(ev) {
    if (ev.persisted) {
      window.location.reload();
    }
  });

  // Initialise all js-controlled GOVUK Frontend UI components
  GOVUKFrontend.initAll();

  /* ------------------------------------------------ Show/Hide functionality */

  /**
   * Attach show/hide functionalty.
   *
   * @param {HTMLElement} node Element to init
   * @returns {void}
   */
  function casaV1InitShowHide(node) {
    var fieldName = node.getAttribute('name');
    var initNodes = document.querySelectorAll('[name="' + fieldName + '"]:not([data-target-init-done])');
    var nodeGroup = document.querySelectorAll('[name="' + fieldName + '"]');

    /**
     * Show target.
     * @param {HTMLElement} targetEl Target
     * @returns {void}
     */
    function showTarget(targetEl) {
      /* eslint-disable-next-line no-param-reassign */
      targetEl.className = targetEl.className.replace(/ *js-hidden/, '');
    }

    /**
     * Hide target.
     * @param {HTMLElement} targetEl Target
     * @returns {void}
     */
    function hideTarget(targetEl) {
      /* eslint-disable-next-line no-param-reassign */
      targetEl.className = targetEl.className.replace(/ *js-hidden/, '') + ' js-hidden';
    }

    /**
     * Click node.
     * @returns {void}
     */
    function clickNode() {
      for (var i = 0, l = nodeGroup.length; i < l; i += 1) {
        if (nodeGroup[i].getAttribute('data-target')) {
          var targetEl = document.getElementById(nodeGroup[i].getAttribute('data-target'));
          if (nodeGroup[i].checked) {
            showTarget(targetEl);
          } else {
            hideTarget(targetEl);
          }
        }
      }
    }

    for (var i = 0, l = initNodes.length; i < l; i += 1) {
      attachEventPolyfill(initNodes[i], 'click', clickNode);
      initNodes[i].setAttribute('data-target-init-done', true);
    }

    // Initialise state based on pre-populated inputs
    clickNode();
  }

  document.onreadystatechange = function hReayStateChange() {
    var nodeList;
    var i;
    var l;
    if (document.readyState === 'complete') {
      nodeList = document.querySelectorAll('[data-target]');
      for (i = 0, l = nodeList.length; i < l; i += 1) {
        casaV1InitShowHide(nodeList[i]);
      }
    }
  };
}());
