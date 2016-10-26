# Controllers
Controllers are saved in the `server/controllers` folder and defined typically in
the `config/default.js` controllers subsection.

## CLI
This commands create an empty controller for you if you have the CLI installed

```
ceres controller IndexController
```

After creating it you need to define it's endpoint in your configuration.

## Basic Example
```
var Ceres = require('ceres-framework');

module.exports = new Ceres.Controller({
  /**
   * Model to create endpoint around
   *
   * @type    {String}
   */

  model: null,

  /**
   * Available endpoints
   *
   * @type    {Object}
   */
  routes: {

    // Default methods always available
    'get /': 'getAll',
    'get /:id' : 'getOne',
    'post /' : 'postCreate',
    'put /:id' : 'putUpdate',
    'del /:id' : 'deleteOne',

    // Custom methods
    'get /search' : 'search'
  },

  /**
   * Custom handler defined above
   * @param  {Express.Request}  req
   * @param  {Express.Response} res
   */
  search: function(req, res){
    res.send('oh yeah');
  }

  /**
   * Middleware to apply to the routes
   *
   * @type    {Array<Function>}
   */
  middleware: function(middlewares) {
    return [];
  }
});
```

## Config
```
  /**
   * A list of controllers and where to connect their routers. This is a high
   * overview of routing
   *
   * @type    {Object}
   */
  controllers: {
    // The key is the name of the file in the server/controllers folder and the
    // value is the location where the router will be mounted
    'IndexController': '/',

    // You can use subfolders and mount the endpoint however you'd like
    'api/UserController' : '/api/users',
  },
```

## Routing
There's two ways to define a router. You can use the `routes` config option or the
create your own express router and overwrite the `router` object.

Here's an example on how to use the default router.

```
routes: {
  // These five are always available
  'get /': 'getAll',
  'get /:id' : 'getOne',
  'post /' : 'postCreate',
  'put /:id' : 'putUpdate',
  'del /:id' : 'deleteOne',

  // This is a custom method
  'post /upload' : 'upload' // Upload is the name of a user function defined on the controller
},
```

Alternatively you can overwrite the router function and supply your own router.
This means the routes object is ignored unless you specifically reference it.

```
/**
 * Create an custom express Router
 *
 * @return    {Express.Router}
 */
router: function() {
  var router = require('express').Router();

  // Provide unprojected route so other apps can check if this app is up;
  router.all('/api/status', this.status);

  // Pass everything to the client except the api/ routes
  router.get(/(?!^\/(api|assets|public))(^.*$)/, cas, Ceres.Controller.wrapRoute(this.getApp, this, Ceres));

  return router;
},
```
