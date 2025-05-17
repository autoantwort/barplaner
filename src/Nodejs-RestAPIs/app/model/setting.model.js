import { Sequelize, sequelize } from "../config/database";
import { Role } from "./role.model";


const Setting = sequelize.define('setting', {
    name: {
        type: Sequelize.STRING,
        primaryKey: true,
    },
    permission: {
        type: Sequelize.STRING,
        references: {
            // reference to the User model
            model: Role,
            key: 'name',
        },
        allowNull: true,
        defaultValue: null,
    },
    description: {
        type: Sequelize.STRING(512),
        defaultValue: '',
    },
    value: {
        type: Sequelize.STRING(256),
        defaultValue: '',
    },
});

Role.hasMany(Setting, {
    foreignKey: 'permission',
    constraints: false,
});
Setting.belongsTo(Role, {
    foreignKey: 'permission',
    constraints: false,
});

export { Setting };
