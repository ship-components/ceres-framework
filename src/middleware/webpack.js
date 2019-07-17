// eslint-disable-next-line import/no-extraneous-dependencies
const webpackDevMiddleware = require('webpack-dev-middleware');
// eslint-disable-next-line import/no-extraneous-dependencies
const webpack = require('webpack');

module.exports = ceres => {
  const { webpackConfig: config } = ceres.config;
  config.output.path = '/';
  const compiler = webpack(config);
  return webpackDevMiddleware(compiler, {
    noInfo: false,
    quiet: false,
    publicPath: '/assets',
    stats: config.stats,
  });
};
