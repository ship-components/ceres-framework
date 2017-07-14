module.exports = function() {
  return function(req, res, next){ // eslint-disable-line no-unused-vars
    var message = 'Unable to find resource';
    var status = 404;

    if (req.accepts('json') && !req.accepts('html')) {
      res.status(status).json({
        status: status,
        message: message
      }).end();
    } else {
      res.status(status).send(message).end();
    }
  };
};
