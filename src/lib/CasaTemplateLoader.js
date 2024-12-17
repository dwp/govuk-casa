import { FileSystemLoader } from "nunjucks";

/**
 * @typedef {import("nunjucks").FileSystemLoaderOptions} FileSystemLoaderOptions
 * @access private
 */

/**
 * @typedef {import("nunjucks").LoaderSource} LoaderSource
 * @access private
 */

const VALID_BLOCKS = [
  "beforeContent",
  "bodyEnd",
  "bodyStart",
  "casaPageTitle",
  "content",
  "footer",
  "head",
  "header",
  "headIcons",
  "journey_form",
  "main",
  "pageTitle",
  "skipLink",
];

/**
 * @callback BlockModifier
 * @param {string} templateName Path to the template being modified
 * @returns {string} The modified template source
 */

/**
 * @augments FileSystemLoader
 * @access private
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
   * @returns {LoaderSource} Source contents of template
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
   * @throws {Error} If provided with an unrecognised block
   */
  modifyBlock(block, modifier) {
    // Limit to only known block so the user can't do general string replacements
    if (!VALID_BLOCKS.includes(block)) {
      throw new Error(
        `Block "${String(block)}" is not a recognised template block.`,
      );
    }

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
    for (let i = 0, l = this.#blockModifiers.length; i < l; i++) {
      // ESLint disabled as `i` is an integer
      /* eslint-disable-next-line security/detect-object-injection */
      const { block, modifier } = this.#blockModifiers[i];
      if (source.src.indexOf(`block ${block}`) > -1) {
        source.src = source.src.replace(
          `block ${block} %}`,
          `block ${block} %}${modifier(name)}`,
        );
      }
    }
    return source;
  }
}
