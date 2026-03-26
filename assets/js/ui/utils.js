/**
 * Return a debounced version of `fn` that delays invocation
 * until `ms` milliseconds have elapsed since the last call.
 *
 * @param {Function} fn
 * @param {number} ms
 * @returns {Function}
 */
export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
