import { Sequelize, sequelize } from '../../config/database.js';
import { User } from '../user.model.js';
import { StockChange } from './change.model.js';

const StockChangeLog = sequelize.define('stockChangeLog', {
    datetime: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
    },
    changedFields: {
        type: Sequelize.JSON,
        allowNull: false,
    },
    note: {
        type: Sequelize.STRING(1024),
        allowNull: true,
        defaultValue: null,
    },
});

StockChangeLog.belongsTo(StockChange);
StockChange.hasMany(StockChangeLog);

StockChangeLog.belongsTo(User);
User.hasMany(StockChangeLog);

export { StockChangeLog };
