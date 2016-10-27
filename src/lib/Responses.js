/*******************************************************************************
 * Responses
 *
 * @author       Isaac Suttell <isaac_suttell@playstation.sony.com>
 * @file         Default rest responses
 ******************************************************************************/

/**
 * HTTP Status Codes
 *
 * @type    {Object}
 */
var STATUS = {
  OK: 200,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  ERROR: 500
};

var Responses = {
  /**
   * OK Response
   */
  send: function(data) {
    this.res.status(STATUS.OK).json(data).end();
  },

  /**
   * Nothing to send pack but we succeed
   */
  noContent: function() {
    this.res.status(STATUS.NO_CONTENT).end();
  },

  /**
   * Can't find it
   */
  notFound: function() {
    this.res.status(STATUS.NOT_FOUND).json({
      message: 'Unable to find resource'
    }).end();
  },

  /**
   * User doesn't have access
   */
  forbidden: function() {
    this.res.status(STATUS.FORBIDDEN).json({
      message: 'Access forbidden'
    }).end();
  },

  /**
   * Client sent a request that we can't process
   */
  badRequest: function(context) {
    this.res.status(STATUS.BAD_REQUEST).json({
      message: 'Bad Request',
      context: context
    }).end();
  },

  /**
   * There was an error!!!
   *
   * @param     {Mixed}    err
   */
  fail: function(err) {
    var response = {
      message: 'Interal Server Error'
    };

    if (this.config.env !== 'production' && err instanceof Error) {
      response.context = err.stack.split('\n');
    } else if (this.config.env !== 'production') {
      response.context = err.toString();
    }

    this.res.status(STATUS.ERROR).json(response).end();
    throw err;
  }

};

module.exports = Responses;
