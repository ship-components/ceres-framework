module.exports = function Benchmark(options) {
  options = Object.assign({
    verbose: false
  }, options);

  var times = {
    start: Date.now(),
    end: null,
    difference: null
  };

  return {
    stop: function() {
      times.end = Date.now();
      times.difference = times.end - times.start;
      if (options.verbose && options.log && options.name) {
        options.log(options.name, times.difference);
      }
      return times.difference;
    },
    val: function() {
      return times.difference;
    }
  };
};
