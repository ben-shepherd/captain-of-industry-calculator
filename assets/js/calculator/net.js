/**
 * Compare required resources against what the user already produces
 * and return the surplus or deficit for each resource.
 *
 * @param {Record<string, number>} required
 *   Flat map of resource id → amount needed per minute
 *   (typically the `totals` returned by the resolver).
 *
 * @param {Record<string, number>} production
 *   Flat map of resource id → amount the user currently produces per minute.
 *   May include resources not present in `required` (they appear as pure surplus).
 *
 * @returns {Record<string, NetEntry>}
 *
 * @typedef {Object} NetEntry
 * @property {number} required   – Amount needed per minute (0 if not required)
 * @property {number} production – Amount user produces per minute (0 if not provided)
 * @property {number} net        – production − required (positive = surplus, negative = deficit)
 * @property {"surplus"|"deficit"|"balanced"} status
 */
export function calculateNet(required, production) {
  const ids = unionKeys(required, production);
  const result = {};

  for (const id of ids) {
    const req  = required[id]   ?? 0;
    const prod = production[id] ?? 0;
    const net  = prod - req;

    result[id] = {
      required:   req,
      production: prod,
      net,
      status: net > 0 ? "surplus" : net < 0 ? "deficit" : "balanced",
    };
  }

  return result;
}

/**
 * Collect the unique set of keys across both maps.
 *
 * @param {Record<string, number>} a
 * @param {Record<string, number>} b
 * @returns {string[]}
 */
function unionKeys(a, b) {
  const set = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...set];
}
