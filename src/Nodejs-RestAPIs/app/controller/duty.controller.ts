import db from "../config/db.config";
import * as Util from "../util/cleaning";

const Bar = db.Bar;
const User = db.User;
const BarDuty = db.BarDuty;
const sequelize = db.sequelize;
const Role = db.Role;
const UserRoles = db.UserRoles;

// Update a Bar
export const list = (req, res) => {
  Util.computeRatio()
    .then((users) => {
      res.send(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error -> " + err);
    });
};
