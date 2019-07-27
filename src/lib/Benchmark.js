/**
 * @param {{verbose: boolean, name: string, log: (name: string, diff: number) => void}} [options]
 */
module.exports = function Benchmark(options) {
  options = Object.assign(
    {
      verbose: false,
    },
    options
  );

  /**
   * Benchmarch Result
   * @type {{start: number, end: number | null, difference: number | null }}
   */
  const times = {
    start: Date.now(),
    end: null,
    difference: null,
  };

  return {
    /**
     * Stop and return duration
     * @returns {number}
     */
    stop() {
      times.end = Date.now();
      times.difference = times.end - times.start;
      if (options.verbose && options.log && options.name) {
        options.log(options.name, times.difference);
      }
      return times.difference;
    },

    /**
     * Return the current duration
     * @returns {number}
     */
    val() {
      return times.difference;
    },
  };
};
