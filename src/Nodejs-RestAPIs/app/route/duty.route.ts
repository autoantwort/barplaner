import * as Duty from "../controller/duty.controller.js";

export default function (app) {
  app.get("/api/duty", Duty.list);
}