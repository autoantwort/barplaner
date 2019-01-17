module.exports = (sequelize, Sequelize, User, Role) => {
    User.belongsToMany(Role, { through: 'UserRoles' });
    Role.belongsToMany(User, { through: 'UserRoles' });
    return sequelize.model('UserRoles');
};