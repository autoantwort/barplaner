import * as Setting from "../controller/setting.controller";

module.exports = function (app) {
  // Retrieve all settings
  app.get("/api/settings", Setting.getAll);

  // Retrieve a setting by name
  app.get("/api/setting/:name", Setting.getOne);

  // Update a setting by name
  app.put("/api/setting/:name", Setting.updateOne);
};
