const webpackDevMiddleware = require('webpack-dev-middleware');
const webpack = require('webpack');

module.exports = function(ceres) {
  const config = ceres.config.webpackConfig;
  config.output.path = '/';
  const compiler = webpack(config);
  return webpackDevMiddleware(compiler, {
    noInfo: false,
    quiet: false,
    publicPath: '/assets',
    stats: config.stats,
  });
};
