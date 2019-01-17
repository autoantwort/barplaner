module.exports = (sequelize, Sequelize) => {
    const Role = sequelize.define('role', {
        name: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        description: {
            type: Sequelize.STRING(1024),
        }
    });
    return Role;
};