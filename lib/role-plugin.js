// Export a Mongoose plugin that adds to to a given schema
// (the Role schema) the necessary fields for rbac
module.exports = function(schema, options) {
  schema.add({
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
};
