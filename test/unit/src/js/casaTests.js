const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');

const { JSDOM } = jsdom;
/**
 * Make a DOM element from the specified source HTML.
 *
 * @param {String} test Name of test source file
 * @return {JSDOM} A virtual DOM
 */
function makeDom(test) {
  const srcHtml = fs.readFileSync(path.resolve(__dirname, `../../testdata/browser-views/${test}`)).toString();
  const srcJs = fs.readFileSync(path.resolve(__dirname, '../../../../src/js/casa.js')).toString();

  const virtualConsole = new jsdom.VirtualConsole();
  virtualConsole.sendTo(console);

  return new JSDOM(`<!DOCTYPE html><html><body>${srcHtml}<script>var GOVUKFrontend = {initAll:()=>{}}; ${srcJs}; Object.defineProperty(document, "readyState", {get() { return "complete"; }}); document.onreadystatechange();</script></body></html>`, {
    url: 'http://test.test/',
    runScripts: 'dangerously',
    virtualConsole
  });
}

describe('src/js/casa.js', () => {
  describe('show/hide target panels from radio inputs', () => {
    it('should make the target visible on DOM load is the associated radio input is already checked', () => {
      const dom = makeDom('casa-showhide-test2.html');
      const target0 = dom.window.document.getElementById('target0');

      expect(target0.className).to.not.contain('js-hidden');
    });

    it('should remove "js-hidden" class from only the target panel when associated radio is chosen', () => {
      const dom = makeDom('casa-showhide-test1.html');
      const input0 = dom.window.document.querySelector('[data-target="target0"]');
      input0.click();

      const target0 = dom.window.document.getElementById('target0');
      const target1 = dom.window.document.getElementById('target1');

      expect(target0.className).to.not.contain('js-hidden');
      expect(target1.className).to.contain('js-hidden');
    });

    it('should hide visible targets associated with the sibling inputs of the clicked radio input', () => {
      // Set initial state - first target visible, second target hidden
      const dom = makeDom('casa-showhide-test1.html');
      const target0 = dom.window.document.getElementById('target0');
      const target1 = dom.window.document.getElementById('target1');
      const input0 = dom.window.document.querySelector('[data-target="target0"]');
      input0.click();
      expect(target0.className).to.not.contain('js-hidden');
      expect(target1.className).to.contain('js-hidden');

      const input1 = dom.window.document.querySelector('[data-target="target1"]');
      input1.click();

      expect(target0.className).to.contain('js-hidden');
      expect(target1.className).to.not.contain('js-hidden');
    });
  });
});
