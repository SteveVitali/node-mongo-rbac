var async = require('async'),
  _ = require('underscore');

var Rbac = function(user, role) {
  this.User = user;
  this.Role = role;
};

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

Rbac.prototype.isAuthorized = function(userId, resource, action, callback) {
  var that = this;

  that.User
  .findOne({ _id: userId })
  .select('roles')
  .exec(function(err, user) {
    if (err) { return console.log(err); }

    if (user && user.roles && user.roles.length) {
      var roles = [];
      async.each(user.roles, function(roleId, next) {
        that.Role
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
        var authorized;
        _.each(roles, function(role) {
          if (role && role.resources) {
            var permissions = role.resources[resource];
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
          }
        });
        callback(null, authorized);
      });
    } else {
      callback(null, false);
    }
  });
};

Rbac.prototype.addPermissions = function(roleName, permissions, callback) {
  console.log('Adding permissions', permissions, 'to role', roleName);
  var that = this;
  this.Role
  .findOne({ role: roleName }, function(err, role) {
    if (err) { return callback(err); }
    var resources = that.getResourcesFromRole(role);
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
      role.resources = resources;
      // Tell Mongoose that "Mixed" field has been changed
      role.markModified('resources');
      role.save(function(err) {
        console.log('Successfully added permissions');
        next(err);
      });
    }, callback);
  });
};

Rbac.prototype.revokePermissions = function(roleName, permissions, callback) {
  console.log('Revoking permissions', permissions, 'from role', roleName);
  var that = this;
  this.Role
  .findOne({ role: roleName }, function(err, role) {
    if (err) { return callback(err); }
    var resources = that.getResourcesFromRole(role);
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

        role.resources = resources;
        // Tell Mongoose that 'Mixed' field has been changed
        role.markModified('resources');
        role.save(function(err) {
          console.log('Successfully revoked permissions');
          next(err);
        });
      } else {
        // Nothing needs to get removed
        async.nextTick(next);
      }
    }, callback);
  });
};

Rbac.prototype.createRole = function(newRole, callback) {
  var that = this;
  this.Role
  .findOne({ role: newRole.role })
  .exec(function(err, doc) {
    if (doc) {
      return callback('Role already exists');
    }
    that.Role.create(newRole, function(err, role) {
      if (err) { return callback(err); }
      callback(null, role);
    });
  });
};

Rbac.prototype.destroyRole = function(roleQuery, callback) {
  this.Role
  .find(roleQuery)
  .remove()
  .exec(function(err, result) {
    if (err) { return callback(err); }
    callback();
  });
};

Rbac.prototype.getResourcesFromRole = function(role) {
  return role && role.resources
    ? role.resources
    : {};
};

exports = module.exports = Rbac;
