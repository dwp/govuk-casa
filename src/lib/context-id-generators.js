import { randomUUID } from "node:crypto";

/**
 * @typedef {import('../casa.js').ContextIdGenerator} ContextIdGenerator
 */

/**
 * Creates an instance of a UUID generator.
 *
 * @returns {ContextIdGenerator} Generator function
 */
const uuid = () => () => randomUUID();

/**
 * Returns a generator that returns the next incremental integer in a sequence.
 *
 * This generator does not take into account the removal of any contexts from
 * session that were previously assigned a sequential ID. This means that IDs
 * will be re-used when they are freed up.
 *
 * @returns {ContextIdGenerator} Generator function
 */
const sequentialInteger =
  () =>
  ({ reservedIds }) => {
    const contextIds = Array.from(reservedIds).sort();

    if (!contextIds.length) {
      return "1";
    }

    // Find the first numeric ID that we can increment
    let lastInSequence;
    do {
      lastInSequence = Number.parseInt(contextIds.pop(), 10);
    } while (contextIds.length && Number.isNaN(lastInSequence));

    return String(!Number.isNaN(lastInSequence) ? lastInSequence + 1 : 1);
  };

const shortGuid =
  ({ length = 5, prefix = "", pool = "abcdefhkmnprtwxy346789" } = {}) =>
  ({ reservedIds }) => {
    // Ambiguous characters excluded
    const poolSize = pool.length;

    const maxAttempts = 10;
    let attempts = maxAttempts;
    let id;

    do {
      id = Array(length)
        .fill(0)
        .map(() => pool.charAt(Math.floor(Math.random() * poolSize)))
        .join("");
      attempts--;
    } while (attempts > 0 && reservedIds.includes(id));

    if (attempts === 0) {
      throw new Error(
        `Failed to generate GUID after ${maxAttempts} iterations`,
      );
    }

    return `${prefix}${id}`;
  };

/**
 * @namespace ContextIdGenerators
 */
export { uuid, sequentialInteger, shortGuid };
