var mongoose = require('mongoose');

var RoleSchema = mongoo.Schema({
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

module.exports = mongoose.model('Role', RoleSchema);
