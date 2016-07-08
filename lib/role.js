var mongoose = require('mongoose');
var async = require('async');
var _ = require('underscore');

var RoleSchema = mongoose.Schema({
  // The name of the role
  role: {
    type: String,
    required: true
  },
  // A map of resources to permissions
  resources: {
  // The contents of 'resources' will be of the form
  // '/api/something/...': {
  //     type: String,
  //     enum: [
  //         '*',
  //         'get',
  //         'post',
  //         'put',
  //         'delete'
  //     ]
  // },
  // ...
  }
});

/**
 * Add permissions to the Role
 * @param {[Object]} permissions An array of objects of the form
 *                               [{ <resource>: [<actions>] }]
 * @param {Function} callback    Returns err if there was an error
 */
RoleSchema.methods.addPermissions = function(permissions, callback) {
  var Role = this;
  var resources = this.resources;
  async.each(permissions, function(permission, next) {
    // A permission is structured as
    // { '/path/to/resource' : ['get', put', etc.] }
    var resource = _.keys(permission)[0];
    var actions = permission[resource];
    if (resource in resources) {
      // Convert asterisk to what it denotes so the union functions properly
      if (actions.indexOf('*')) {
        actions = ['get', 'put', 'post', 'delete'];
      }
      resources[resource] = _.union(resources[resource], actions);
    } else {
      resources[resource] = actions;
    }
    Role.resources = resources;
    // Tell Mongoose that "Mixed" field has been changed
    Role.markModified('resources');
    Role.save(function(err) {
      console.log('Successfully added permissions');
      next(err);
    });
  }, callback);
};

/**
 * Revoke permissions from the Role
 * @param {[Object]} permissions An array of objects of the form
 *                               [{ <resource>: [<actions>] }]
 * @param {Function} callback    Returns err if there was an error
 */
RoleSchema.methods.revokePermissions = function(permissions, callback) {
  var Role = this;
  var resources = this.resources;
  async.each(permissions, function(permission, next) {
    var resource = _.keys(permission)[0];
    var actions = permission[resource];
    if (resource in resources) {
      // Convert asterisk to what it denotes so the union functions properly
      if (actions.indexOf('*')) {
        actions = ['get', 'put', 'post', 'delete', '*'];
      }
      _.each(actions, function(action) {
        // Remove the revoked actions from the permissions array
        resources[resource] = _.without(resources[resource], action);
      });

      Role.resources = resources;
      // Tell Mongoose that 'Mixed' field has been changed
      Role.markModified('resources');
      Role.save(function(err) {
        console.log('Successfully revoked permissions');
        next(err);
      });
    } else {
      // Nothing needs to get removed
      async.nextTick(next);
    }
  }, callback);
};

module.exports = mongoose.model('Role', RoleSchema);
