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
   * Authorize User for action on resource
   * @param  {ObjectId}   userId   The id of the requesting User
   * @param  {String}     resource The resource path (e.g. 'api/user/*')
   * @param  {String}     action   The action on the resource (e.g. 'put')
   * @param  {Function}   callback Returns err and isAuthorized
   */
  schema.methods.isAuthorized = function(resource, action, callback) {
    var that = this;
    var roles = [];
    async.each(user.roles || [], function(roleId, next) {
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
