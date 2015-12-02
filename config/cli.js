module.exports = {
  run: [
    ['-r, --rc <path>', 'Location of the config file'],
    ['-e, --env <string>', 'Which environment are we running in?'],
    ['-i, --instances <number>', 'Total number of children to spawn in the cluster. Defaults to core count.', parseInt],
    ['-p, --port <number>', 'Which port to listen to', parseInt],
    ['-d, --debug', 'Enable debug logging'],
    ['-v, --verbose', 'Enable verbose output to console'],
    ['-w, --webpack', 'Enable webpack middleware for development']
  ],
  init: [
    ['-r, --rc <path>', 'Location of the config file'],
    ['-l, --length <number>', 'How long should the secret be?', parseInt]
  ]
}
