var winston = require('winston');

module.exports = function logger(config, name) {
  var name = name || config.name;

  /**
   * Transports
   *
   * @type    {Object}
   */
  var transports = [
    // Should probably be kept for 30 days
    new(require('winston-daily-rotate-file'))({
      name: 'production',
      filename: config.folders.logs + '/production.log',
      label: name,
      tailable: true
    })
  ];

  // Output to console on dev
  if (config.env !== 'production' || config.verbose) {
    transports.push(new(winston.transports.Console)({
      level: 'silly',
      colorize: true,
      label: name,
      prettyPrint: true,
      depth: 4
    }));
  }

  return new(winston.Logger)({
    transports: transports
  })
};
