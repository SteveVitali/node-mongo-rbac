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

First, install the `UserPlugin` to your User model.

For example:
```js
var mongoose = require('mongoose');
var rbac = require('node-mongo-rbac');
 
var UserSchema = mongoose.Schema({
  // ... Any additional fields
});
 
UserSchema.plugin(rbac.UserPlugin);
 
module.exports = mongoose.model('User', UserSchema);
```
