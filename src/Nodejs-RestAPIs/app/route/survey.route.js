import * as Survey from "../controller/survey.controller";
module.exports = function (app) {
  // Create a new Survey
  app.post("/api/survey", Survey.create);
  // Retrieve all Surveys
  app.get("/api/surveys", Survey.getAll);
};
