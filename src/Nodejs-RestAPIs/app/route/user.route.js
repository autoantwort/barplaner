import { create, findAll, findById, update, delete as delete_, addRole, removeRole, getRoles, findAllRoles, userRolesTable } from '../controller/user.controller.js';
export default function(app) {

    // Create a new user
    app.post('/api/user', create);

    // Retrieve all users
    app.get('/api/users', findAll);

    // Retrieve a single user by Id
    app.get('/api/user/:userID', findById);

    // Update a user with Id
    app.put('/api/user/:userID', update);

    // Delete a user with Id
    app.delete('/api/user/:userID', delete_);

    // Add a role to a user
    app.post('/api/user/:userID/role', addRole);

    // remove a role from a user
    app.delete('/api/user/:userID/:role', removeRole);

    // get roles from a user
    app.get('/api/user/:userID/roles', getRoles);
    // get all roles 
    app.get('/api/users/roles', findAllRoles);
    // get all roles as table
    app.get('/api/users/roleTable', userRolesTable);
};