const fs = require('fs');
const path = require('path');
// eslint-disable-next-line import/no-extraneous-dependencies
const sharedsession = require('express-socket.io-session');

/**
 * Checks to see if sockets are configured and then sets up socket.io
 * @param  {import('../Ceres')}        ceres
 * @param  {import('express').Express} app
 * @param  {import('http').Server}     server
 * @return {import('socket.io').Server}
 */
module.exports = function sockets(ceres, app, server) {
  const clientSocketEntryPath = path.resolve(ceres.config.folders.sockets, './index.js');

  try {
    // Can we access the file?
    fs.accessSync(clientSocketEntryPath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      ceres.log.internal.silly('Websockets configuration not found at %s', clientSocketEntryPath);
      return undefined;
    }
    throw err;
  }

  // Setup socket.io
  // eslint-disable-next-line import/no-extraneous-dependencies
  const io = require('socket.io')(server);

  // Get socket router
  const handler = require(clientSocketEntryPath);

  // Connect it to client connection event
  io.on('connection', handler.bind(ceres, io, ceres.Database));

  // Share express sessions
  io.use(sharedsession(app.get('sharedSession')));

  ceres.log.internal.silly('Websockets configured');

  return io;
};
