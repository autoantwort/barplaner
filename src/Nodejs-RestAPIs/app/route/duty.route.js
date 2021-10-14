import * as Duty from "../controller/duty.controller";

export default function (app) {
  app.get("/api/duty", Duty.list);
}
