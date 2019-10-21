/** *****************************************************************************
 * Controller - Base Controller
 ***************************************************************************** */

const EventEmitter = require('events');

const Responses = require('./Responses');
const Router = require('./Router');

/**
 * Base instance of a controller to be extended
 * @param {Object} props
 */
function Controller(Ceres, props) {
  Object.assign(this, props);

  this.events = new EventEmitter();
  this.on = this.events.on;
  this.removeListener = this.events.removeListener;
  this.emit = this.events.emit;

  // Allow some user initialization
  if (typeof this.init === 'function') {
    this.init.call(this);
  }
}

/**
 * Helper function to create new controllers
 * @param     {Object}    props
 * @alias
 * @static
 * @return    {Controller}
 */
Controller.extend = function extend(props) {
  return new Controller(this, props);
};

/**
 * Export
 * @type {Function}
 */
module.exports = Controller;

/**
 * Prototype
 *
 * @type    {Object}
 */
Controller.prototype = {
  /**
   * Shortcut to model for CRUD controllers
   * @type {[type]}
   */
  model: null,

  /**
   * Responses
   *
   * @type    {Object}
   */
  responses: Object.assign({}, Responses),

  /**
   * Default Routes
   *
   * @type    {Object}
   */
  routes: {},

  /**
   * GET all
   *
   * @param    {Express.req}    req
   * @param    {Express.res}    res
   */
  getAll() {
    this.model
      .readAll()
      .then(this.send)
      .catch(this.fail);
  },

  /**
   * GET One
   *
   * @param    {Express.req}    req
   * @param    {Express.res}    res
   */
  getOne(req) {
    const id = parseInt(req.params.id, 10);

    // Ensure we have a valid id and don't accidently return everything
    if (Number.isNaN(id)) {
      this.notFound('Unknown or invalid id');
      return;
    }

    this.model
      .read(req.params.id)
      .then(this.send)
      .catch(this.fail);
  },

  /**
   * POST - Create a record
   *
   * @param    {Express.req}    req
   * @param    {Express.res}    res
   */
  postCreate(req) {
    this.model
      .create(req.body)
      .then(result => {
        this.controller.emit('created', req, req.body, result);
        return result;
      })
      .then(this.send)
      .catch(this.fail);
  },

  /**
   * PUT - Update a record
   *
   * @param    {Express.req}    req
   * @param    {Express.res}    res
   */
  putUpdate(req) {
    if (req.params.id) {
      // Update single
      this.model
        .update(req.body, req.params.id)
        .then(result => {
          this.controller.emit('updated', req, req.body, result);
          return result;
        })
        .then(this.send)
        .catch(this.fail);
    } else {
      // Update multiple
      this.model
        .updateAll(req.body)
        .then(result => {
          this.controller.emit('updated', req, req.body, result);
          return result;
        })
        .then(this.send)
        .catch(this.fail);
    }
  },

  /**
   * DELETE - Delete a record
   *
   * @param    {Express.req}    req
   * @param    {Express.res}    res
   */
  deleteOne(req) {
    this.model
      .del(req.params.id)
      .then(result => {
        this.controller.emit('deleted', req, req.params.id);
        return result;
      })
      .then(this.noContent)
      .catch(this.fail);
  },

  /**
   * Create a Express Router and overrde any defaults
   *
   * @return    {Express.router}
   */
  router: Router,
};
