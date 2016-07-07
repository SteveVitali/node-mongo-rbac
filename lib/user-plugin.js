var Role = require('./role');
var async = require('async');
var _ = require('underscore');
var mongoose = require('mongoose');

// Export a Mongoose plugin that extends a given schema
// (the User schema) with rbac field(s)/methods
module.exports = function(schema, options) {
  schema.add({
    roles: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Role'
    }]
  });

  /**
   * Add role with particular name to the User
   * @param {String}   roleName The name of the role
   * @param {Function} callback Return err if err
   */
  schema.methods.addRole = function(roleName, callback) {
    var that = this;
    Role.findOne({ role: roleName }, function(err, role) {
      if (err) { return callback(err); }
      that.roles = that.roles || [];
      var shouldAddRole = that.roles.some(function(roleId) {
        return roleId.equals(role._id);
      });
      if (shouldAddRole) {
        that.roles.push(role._id);
        return that.save(callback);
      }
      callback(null);
    });
  };

  /**
   * Remove role with particular name from the User
   * @param {String}   roleName The name of the role
   * @param {Function} callback Return err if err
   */
  schema.methods.removeRole = function(roleName, callback) {
    var that = this;
    Role.findOne({ role: roleName }, function(err, role) {
      if (err) { return callback(err); }
      that.roles = _.reject(that.roles || [], function(roleId) {
        return roleId.equals(role._id);
      });
      that.save(callback);
    });
  };

  /**
   * Determine whether User has a role with a particular name
   * @param {String}   roleName The name of the role
   * @param {Function} callback Return err if err
   */
  schema.methods.hasRole = function(roleName, callback) {
    var that = this;
    Role.findOne({ role: roleName }, function(err, role) {
      if (err) { return callback(err); }
      return !!_.find((that.roles || []), function(roleId) {
        return roleId.equals(role._id);
      });
    });
  };

  /**
   * Determine whether user is authorized for action on resource
   * @param  {String}     resource The resource path (e.g. 'api/user/*')
   * @param  {String}     action   The action on the resource (e.g. 'put')
   * @param  {Function}   callback Returns err and isAuthorized
   */
  schema.methods.isAuthorized = function(resource, action, callback) {
    var that = this;
    var roles = [];
    async.each(this.roles || [], function(roleId, next) {
      Role
      .findOne({ _id: roleId })
      .select('resources')
      .exec(function(err, role) {
        if (err) { return console.log(err); }
        if (role) {
          roles.push(role);
        }
        next();
      });
    }, function() {
      var authorized = false;
      _.each(roles, function(role) {
        if (!(role && role.resources)) { return; }

        var permissions = role.resources[resource];
        // If the resource does not exist explicltly, check
        // if there is a wildcard resource ('*') that matches
        if (!permissions) {
          var split = resource.split('/');

          var replaceLastPathWithAsterisk =
              split.slice(0, split.length - 1).join('/') + '/*';

          permissions = role.resources[replaceLastPathWithAsterisk];
        }
        console.log(
          'Found resource', resource,
          'inside role with permissions', permissions
        );
        if (permissions && permissions.length) {
          if (permissions.indexOf(action) != -1 ||
              permissions.indexOf('*') != -1) {
            authorized = true;
          }
        }
      });
      callback(null, authorized);
    });
  };
};
