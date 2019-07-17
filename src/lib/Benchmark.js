module.exports = function Benchmark(options) {
  options = Object.assign(
    {
      verbose: false,
    },
    options
  );

  const times = {
    start: Date.now(),
    end: null,
    difference: null,
  };

  return {
    stop() {
      times.end = Date.now();
      times.difference = times.end - times.start;
      if (options.verbose && options.log && options.name) {
        options.log(options.name, times.difference);
      }
      return times.difference;
    },
    val() {
      return times.difference;
    },
  };
};
