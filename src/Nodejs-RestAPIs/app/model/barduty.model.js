module.exports = (sequelize, Sequelize, Bar, User) => {
    const Barduty = sequelize.define('barduty', {
        barID: {
            type: Sequelize.INTEGER,
            references: {
                // reference to the Bar model
                model: Bar,
                key: 'id',
            },
            primaryKey: true,
        },
        userID: {
            type: Sequelize.INTEGER,
            references: {
                // reference to the User model
                model: User,
                key: 'id',
            },
            primaryKey: true,
        },
        state: {
            type: Sequelize.ENUM,
            values: ['absent', 'no_info', 'present'],
            defaultValue: 'no_info',
        },
        job: {
            type: Sequelize.STRING,
            defaultValue: '',
        },
        from: {
            type: Sequelize.STRING,
            defaultValue: '',
        },
        to: {
            type: Sequelize.STRING,
            defaultValue: '',
        },
        have_to_clean: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        },
    });

    User.hasMany(Barduty, {
        foreignKey: 'userID',
        constraints: false,
    });
    Barduty.belongsTo(User, {
        foreignKey: 'userID',
        constraints: false,
    });
    return Barduty;
};