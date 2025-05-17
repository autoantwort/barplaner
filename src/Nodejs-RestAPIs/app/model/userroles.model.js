import { sequelize } from "../config/database";
import { Role } from "./role.model";
import { User } from "./user.model";


User.belongsToMany(Role, { through: 'UserRoles' });
Role.belongsToMany(User, { through: 'UserRoles' });
const UserRoles = sequelize.model('UserRoles');

export { UserRoles };
