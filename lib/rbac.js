var async = require('async'),
    _     = require('underscore');

var Rbac = function(mongoConnection) {
    this.db = mongoConnection;
}

Rbac.prototype.middleware = function(numPaths, userId) {
    console.log('Number of path components', numPaths);
    console.log('User Id', userId);
    var rbac = this;
    
    return function(req, res, next) {
        if (!userId) {
            return res.send('');
        }
        else if (typeof userId == 'function') {
            userId = userId(req, res);
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
    
    that.db.collection('users')
    .findOne({ _id: userId }, function(err, user) {
        if (err) { return console.log(err); }
        console.log('Found user', user, '; now going to get its roles');
        
        if ('roles' in user && user['roles'].length) {
            var roles = [];
            async.eachSeries(user['roles'], function(role, next) {
                that.db.collection('roles')
                .findOne({ role: role }, function(err, roleDoc) {
                    if (err) { return console.log(err); }
                    roles.push(roleDoc);
                    next();
                });
            }, function(err) {
                console.log('Found role documents', roles);
                var authorized;
                _.each(roles, function(role) {
                    var roleResource = _.findWhere(role['resources'], { resource: resource });
                    console.log('Found resource inside role', roleResource);
                    if (roleResource) {
                        if (roleResource['permissions'].indexOf(action) != -1 ||
                            roleResource['permissions'].indexOf('*')    != -1) 
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

Rbac.prototype.checkForAllowedRoles = function(roles, resource, action, callback) {
    if (roles.length) {
        console.log('This is where we check if the roles', roles, 'are authorized to do', action, 'on the resource', resource);
        callback(true); // For now
    } else {
        callback(false);
    }
}

exports = module.exports = Rbac;
