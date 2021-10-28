import * as Bar from "../controller/bar.controller.js";

export default function (app) {
  // Create a new Bar
  app.post("/api/bar", Bar.create);

  // Retrieve all Bars
  app.get("/api/bars", Bar.findAll);

  // Retrieve all Bars with Barduties
  app.get("/api/bars/duties", Bar.getAllBarsWithBarduties);
  // update cleaning
  app.put("/api/bar/:barID/duty/:userID/cleaning", Bar.updateCleaning);
  // update cleaning
  app.put("/api/bar/:barID/duty/:userID", Bar.updateDuty);

  // update duty
  app.post("/api/bar/:barID/duty", Bar.distributeCleaningDuty);

  // Retrieve a single bar by Id
  app.get("/api/bar/:barID", Bar.findById);

  // Update a bar with Id
  app.put("/api/bar/:barID", Bar.update);

  // Delete a Bar with Id
  app.delete("/api/bar/:barID", Bar.deleteBar);
}
