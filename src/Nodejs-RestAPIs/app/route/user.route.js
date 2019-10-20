module.exports = function(app) {

    const user = require('../controller/user.controller.js');

    // Create a new user
    app.post('/api/user', user.create);

    // Retrieve all users
    app.get('/api/users', user.findAll);

    // Retrieve a single user by Id
    app.get('/api/user/:userID', user.findById);

    // Update a user with Id
    app.put('/api/user/:userID', user.update);

    // Delete a user with Id
    app.delete('/api/user/:userID', user.delete);


    // Add a role to a user
    app.post('/api/user/:userID/role', user.addRole);

    // remove a role from a user
    app.delete('/api/user/:userID/:role', user.removeRole);

    // get roles from a user
    app.get('/api/user/:userID/roles', user.getRoles);
    // get all roles 
    app.get('/api/users/roles', user.findAllRoles);
    // get all roles as table
    app.get('/api/users/roleTable', user.userRolesTable);
};