var async = require('async'),
    _     = require('underscore');

var Rbac = function(user, role) {
    this.User = user;
    this.Role = role;
}

Rbac.prototype.middleware = function(numPaths) {
    var rbac = this;
    
    return function(req, res, next) {
        var userId = req.user._id;
        if (!userId) {
            return res.send('');
        }
        // Remove query string from resource url
        var url = req.url.split('?')[0];
        var resource = numPaths ? url.split('/').slice(0, numPaths+1).join('/') : url;
        var action  = req.method.toLowerCase();
        
        console.log('User', userId, 'Requesting', resource, 'with action', action);
        rbac.isAuthorized(userId, resource, action, function(err, allowed) {
            if (err) { return res.send('') }
            if (!allowed) {
                console.log('Request denied');
                return res.send('');
            } else {
                console.log('Request authorized');
                next();
            }
        });
    }
}

Rbac.prototype.isAuthorized = function(userId, resource, action, callback) {
    var that = this;
    
    that.User
    .findOne({ _id: userId })
    .select('roles')
    .exec( function(err, user) {
        if (err) { return console.log(err); }
        console.log('Found user', user, '; now going to get its roles');
        
        if ('roles' in user && user['roles'].length) {
            var roles = [];
            async.eachSeries(user['roles'], function(role, next) {
                that.Role
                .findOne({ role: role })
                .select('resources')
                .exec( function(err, roleDoc) {
                    if (err) { return console.log(err); }
                    if (roleDoc) {
                        roles.push(roleDoc);
                    }
                    next();
                });
            }, function() {
                console.log('Found', roles.length, 'role documents');
                var authorized;
                _.each(roles, function(role) {
                    var permissions = role['resources'][resource];
                    if (!permissions) {
                        var split = resource.split('/');
                        var replaceLastPathWithAsterisk = split.slice(0, split.length-1).join('/')+'/*';
                        permissions = role['resources'][replaceLastPathWithAsterisk];
                    }
                    console.log('Found resource', resource, 'inside role with permissions', permissions);
                    if (permissions && permissions.length) {
                        if (permissions.indexOf(action) != -1 ||
                            permissions.indexOf('*')    != -1) 
                        {
                            authorized = true;
                        }
                    }
                });
                callback(null, authorized);
            });
        } else {
            console.log('Request denied; user has no roles');
            callback('User has no roles');
        }
    });
}

exports = module.exports = Rbac;
