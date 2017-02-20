# Controllers
Controllers are saved in the `server/controllers` folder and defined typically in
the `config/default.js` controllers subsection.

## CLI
This commands create an empty controller for you if you have the CLI installed

```shell
ceres controller IndexController
```

After creating it you need to define it's endpoint in your configuration.

## Basic Example
```js
var Ceres = require('ceres-framework');

module.exports = new Ceres.Controller({
  /**
   * Model to create endpoint around
   *
   * @type    {String}
   */

  model: UserModel,

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
    'get /search' : 'search',

		// Apply middleware to a specific route
		'get /admin' : [this.adminOnlyCheck, 'adminsOnly'],
  },

	/**
	 * Pretend middleware for admins only
	 * @param  {Express.Request}  req
   * @param  {Express.Response} res
	 * @param  {Function}   	    next
	 */
	adminOnlyCheck: function(req, res, next) {
		if(req.session.admin) {
			next();
		} else {
			next(new Error('Forbidden'));
		}
	}

  /**
   * Custom handler defined above
   * @param  {Express.Request}  req
   * @param  {Express.Response} res
   */
  search: function(req, res){
		// This send is a convenience function and alias to res.send
    this.send({
			message: 'Found it'
		});
  },

	/**
   * Custom route for admins
   * @param  {Express.Request}  req
   * @param  {Express.Response} res
   */
	adminsOnly: function(req, res){
		// This is protected by admin middleware defined in the routes object
		this.send({
			message: 'Our admins are so nice'
		});
	},

  /**
   * Middleware to apply to all routes
   *
   * @type    {Array<Function>}
   */
  middleware: function(middleware) {
		// The middleware object is loaded from the './middleware' folder when the
		// application starts. It gets applied to all routes in this controller
    return [middleware.csrf];
  }
});
```

## Config
```js
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

```js
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

```js
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
  router.get(/(?!^\/(api|assets|public))(^.*$)/, authMiddleware, this.getApp.bind(this));

  return router;
},
```
