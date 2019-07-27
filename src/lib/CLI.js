const program = require('commander');

module.exports = function cli(version, options) {
  program.version(version);

  options.forEach(args => {
    program.option(...args);
  });

  return program;
};
