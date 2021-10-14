import * as User from "../controller/user.controller";

module.exports = function (app) {
  // Create a new user
  app.post("/api/user", User.create);

  // Retrieve all users
  app.get("/api/users", User.findAll);

  // Retrieve a single user by Id
  app.get("/api/user/:userID", User.findById);

  // Update a user with Id
  app.put("/api/user/:userID", User.update);

  // Delete a user with Id
  app.delete("/api/user/:userID", User.deleteUser);

  // Add a role to a user
  app.post("/api/user/:userID/role", User.addRole);

  // remove a role from a user
  app.delete("/api/user/:userID/:role", User.removeRole);

  // get roles from a user
  app.get("/api/user/:userID/roles", User.getRoles);
  // get all roles
  app.get("/api/users/roles", User.findAllRoles);
  // get all roles as table
  app.get("/api/users/roleTable", User.userRolesTable);
};
