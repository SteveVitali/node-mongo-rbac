var Role = require('./role');
var async = require('async');
var _ = require('underscore');

/**
 * Initialize Rbac instance
 * @param {Object} user The User Mongoose model
 */
var Rbac = function(user) {
  this.User = user;
};

/**
 * Rbac middleware function. Enforces permissions on a particular route
 * for a particular number of components in that route.
 * e.g. using rbac.middleware(2) on GET '/api/users/:id' would enforce
 * permissions for all users who have "get" permissions on '/api/users'
 * @param  {Number} numPaths The number of paths in the resource to permission
 */
Rbac.prototype.middleware = function(numPaths) {
  var rbac = this;

  return function(req, res, next) {
    var userId = req.user && req.user._id;
    if (!userId) {
      return res.send('');
    }
    // Remove query string from resource url
    var url = req.url.split('?')[0];
    var resource = numPaths
      ? url.split('/').slice(0, numPaths + 1).join('/')
      : url;

    var action = req.method.toLowerCase();

    console.log('User', userId, 'Requesting', resource, 'with action', action);
    rbac.isAuthorized(userId, resource, action, function(err, allowed) {
      if (err) { return res.send(''); }
      if (!allowed) {
        console.log('Request denied');
        return res.send('');
      } else {
        console.log('Request authorized');
        next();
      }
    });
  };
};

/**
 * Check if user with userId is authorized for action on resource.
 * @param  {ObjectId}   userId   The id of the requesting User
 * @param  {String}     resource The resource path (e.g. 'api/user/*')
 * @param  {String}     action   The action on the resource (e.g. 'put')
 * @param  {Function}   callback Returns err and isAuthorized
 */
Rbac.prototype.isAuthorized = function(userId, resource, action, callback) {
  this.User
  .findOne({ _id: userId })
  .select('roles')
  .exec(function(err, user) {
    if (err) { return callback(err, false); }
    if (!user) { return callback(null, false); }

    return user.isAuthorized(resource, action, callback);
  });
};

/**
 * Add permissions to a particular Role
 * @param {String}   roleName    The name of the Role
 * @param {[Object]} permissions An array of objects of the form
 *                               [{ <resource>: [<actions>] }]
 * @param {Function} callback    Returns err if there was an error
 */
Rbac.prototype.addPermissions = function(roleName, permissions, callback) {
  console.log('Adding permissions', permissions, 'to role', roleName);
  Role.findOne({ role: roleName }, function(err, role) {
    if (err || !role) { return callback(err); }

    return role.addPermissions(permissions, callback);
  });
};

/**
 * Revoke permission from a particular role
 * @param {String}   roleName    The name of the Role
 * @param {[Object]} permissions An array of objects of the form
 *                               [{ <resource>: [<actions>] }]
 * @param {Function} callback    Returns err if there was an error
 */
Rbac.prototype.revokePermissions = function(roleName, permissions, callback) {
  console.log('Revoking permissions', permissions, 'from role', roleName);
  Role.findOne({ role: roleName }, function(err, role) {
    if (err || !role) { return callback(err); }

    return role.revokePermissions(permissions, callback);
  });
};

/**
 * Create a new Role object if one does not exist
 * @param  {String}   newRole  The name of the Role
 * @param  {Function} callback Returns err if err
 */
Rbac.prototype.createRole = function(newRole, callback) {
  Role.findOne({ role: newRole.role })
  .exec(function(err, doc) {
    if (doc) {
      return callback('Role already exists');
    }
    Role.create(newRole, function(err, role) {
      if (err) { return callback(err); }
      callback(null, role);
    });
  });
};

/**
 * Destroys role(s) matching mongo query
 * @param  {Object}   roleQuery Mongo query for role(s)
 * @param  {Function} callback  Returns err if err
 */
Rbac.prototype.destroyRole = function(roleQuery, callback) {
  Role
  .find(roleQuery)
  .remove()
  .exec(callback);
};

Rbac.UserPlugin = require('./user-plugin');
Rbac.Role = Role;

exports = module.exports = Rbac;
