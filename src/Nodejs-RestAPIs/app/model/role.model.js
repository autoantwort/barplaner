import { sequelize, Sequelize } from "../config/database";

const Role = sequelize.define('role', {
    name: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    description: {
        type: Sequelize.STRING(1024),
    }
});

export { Role }
