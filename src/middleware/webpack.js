var webpackDevMiddleware = require('webpack-dev-middleware');
var webpack = require('webpack');


module.exports = function(ceres) {
  var config = ceres.config.webpackConfig;
  config.output.path = '/';
  var compiler = webpack(config);
  return webpackDevMiddleware(compiler, {
    noInfo: false,
    quiet: false,
    publicPath: '/assets/js',
    stats: ceres.config.webpackConfig.stats,
  });
};
