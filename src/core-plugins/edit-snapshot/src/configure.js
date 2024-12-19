import logger from "../../../lib/logger.js";
import preSteerHook from "./pre-steer-hook.js";
import postSteerHook from "./post-steer-hook.js";

/**
 * @typedef {import("../../../casa.js").ConfigurationOptions} ConfigurationOptions
 * @access private
 */

const log = logger("lib:internal-plugin:edit-snapshot");

/**
 * @param {ConfigurationOptions} config Configuration object
 * @returns {void}
 */
export default function (config) {
  log.info("Configuring 'edit-snapshot' plugin");

  config.hooks ??= [];
  config.hooks.push(
    {
      hook: "journey.presteer",
      middleware: preSteerHook,
    },
    {
      hook: "journey.poststeer",
      middleware: postSteerHook,
    },
  );
}
