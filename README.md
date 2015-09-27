[npm-stats]: https://nodei.co/npm/node-mongo-rbac.png?compact=true
[npm-url]: https://www.npmjs.org/package/node-mongo-rbac

# node-mongo-rbac
[![NPM version][npm-stats]][npm-url]

Simple role-based access control for node applications using Mongo.
Inspired by [OptimalBits' node_acl](https://github.com/OptimalBits/node_acl)

## Installation
```
npm install node-mongo-rbac --save
```

First, install the `UserPlugin` to your User model. For example:
```js
var mongoose = require('mongoose');
var rbac = require('node-mongo-rbac');
 
var UserSchema = mongoose.Schema({
  // ... Any additional fields
});
 
UserSchema.plugin(rbac.UserPlugin);
 
module.exports = mongoose.model('User', UserSchema);
```

## RBAC API

### rbac.middleware(numPaths)

Enforce permissions on a route resource.

```js
@param {Number} numPaths The number of paths in the resource to permission
```

```js
// routes.js
// ...
// Permission the URL '/api/users' for the 'get' action,
// meaning only Users with Roles containing the resource
// '/api/users' for action 'get' can use this route.
app.get('/api/users', rbac.middleware(2), getUsers);

// Permission all URLs of the form '/api/users/:id',
// such that a User must have a Role with a resource
// for action 'put' that exactly matches
// '/api/users/:id' or has a wildcard ('/api/users/*').
app.put('/api/users/:id', rbac.middleware(3), updateUser);

// Permission just the first part of the URL (numPaths = 1)
// so only Users whose roles are permissioned for
// 'delete' on resource '/api/' can use this route.
app.delete('/api/users/:id', rbac.middleware(1), deleteUser);

```

### rbac.addPermissions(roleName, permissions, function(err))

Add permissions to a particular role

```js
@param {String}   roleName    The name of the Role
@param {Object}   permissions An object describing the permissions
@param {Function} callback    Returns err if there was an error
```

### rbac.removePermissions(roleName, permissions, function(err))

Revoke permissions from a particular role

```js
@param {String}   roleName    The name of the Role
@param {Object}   permissions An object describing the permissions
@param {Function} callback    Returns err if there was an error
```

### rbac.createRole(newRole, function(err, role))

Create a new Role object if one does not exist

```js
@param  {String}   newRole  The name of the Role
@param  {Function} callback Returns err if err
```

### rbac.destroyRole(roleQuery, function(err))

```js
@param  {Object}   roleQuery Mongo query for role(s)
@param  {Function} callback  Returns err if err
```

### rbac.UserPlugin

The Mongoose plugin for the User model.

### rbac.Role

The Mongoose Role model used by rbac.

## UserPlugin API

These are the methods added to the User model when 
using `rbac.UserPlugin`.

### addRole(roleName, function(err))

Add a Role with a particular name to the User

```js
@param {String}   roleName The name of the role
@param {Function} callback Return err if err
```

### removeRole(roleName, function(err))

Remove Role with a particular name from the User

```js
@param {String}   roleName The name of the role
@param {Function} callback Return err if err
```

### hasRole(roleName, function(err))

Determine whether User has a Role

```js
@param {String}   roleName The name of the role
@param {Function} callback Return err if err
```


