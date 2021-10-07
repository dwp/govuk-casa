import { FileSystemLoader } from 'nunjucks';

/**
 * @typedef {import('nunjucks').FileSystemLoaderOptions} FileSystemLoaderOptions
 */

/**
 * @callback BlockModifier
 * @param {string} templateName Path to the template being modified
 * @returns {string} The modified template source
 */

export default class CasaTemplateLoader extends FileSystemLoader {
  #blockModifiers;

  /**
   * Constructor.
   *
   * @param {string[]} searchPaths Template directories
   * @param {FileSystemLoaderOptions} opts Loader options
   */
  constructor(searchPaths, opts) {
    super(searchPaths, opts);

    this.#blockModifiers = [];
  }

  /**
   * Extract the source from the given template file.
   *
   * @param {string} name Source file path
   * @returns {string} Source contents of template
   */
  getSource(name) {
    const source = super.getSource(name);
    return source ? this.#applyBlockModifiers(name, source) : source;
  }

  /**
   * Add a modification function to the loader.
   *
   * @param {string} block Block name, e.g. `bodyStart`
   * @param {BlockModifier} modifier Modifier function
   * @returns {void}
   */
  modifyBlock(block, modifier) {
    // TODO: Limit to only known block so the user can't do general string replacements
    this.#blockModifiers.push({
      block,
      modifier,
    });
  }

  /**
   * Apply a block modifier to the given source content.
   *
   * @param {string} name Block name
   * @param {string} source Original source pulled from template file
   * @returns {string} The modified source
   */
  #applyBlockModifiers(name, source) {
    // TODO: This is open to abuse by plugin authors, e,g
    // `{% block bodyStart %}{% endblock %} <script src="evil.js"></script>`. Problem, or no?
    for (let i = 0, l = this.#blockModifiers.length; i < l; i++) {
      const { block, modifier } = this.#blockModifiers[i];
      if (source.src.indexOf(`block ${block}`) > -1) {
        /* eslint-disable-next-line no-param-reassign */
        source.src = source.src.replace(`block ${block} %}`, `block ${block} %}${modifier(name)}`);
      }
    }
    return source;
  }
}
