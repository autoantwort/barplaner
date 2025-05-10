import { Role } from '../config/db.config.js';

const [StockAdminRole, created] = await Role.findCreateFind({
    where: {
        name: "StockAdmin",
    },
    defaults: {
        name: "StockAdmin",
        description: "You can change settings that belog to the stock",
    }
})

export { StockAdminRole };
