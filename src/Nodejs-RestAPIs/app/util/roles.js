import { Role } from '../config/db.config.js';
import { BarAdminRoleName, CleaningAdminRoleName, FacebookAdminRoleName, NewsletterAdminRoleName, StockAdminRoleName, UserAdminRoleName } from './rolesNames.js';

const [StockAdminRole, created] = await Role.findCreateFind({
    where: {
        name: StockAdminRoleName,
    },
    defaults: {
        name: "StockAdmin",
        description: "You can change settings that belog to the stock",
    }
})

const [UserAdminRole, _1] = await Role.findCreateFind({
    where: {
        name: UserAdminRoleName,
    },
    defaults: {
        name: "UserAdmin",
        description: "You can add/remove user, change properties of user, change roles of a user.",
    }
})

const [BarAdminRole, _2] = await Role.findCreateFind({
    where: { name: BarAdminRoleName },
    defaults: {
        name: "BarAdmin",
        description: "You can add bars and change them",
    },
});

const [CleaningAdminRole, _3] = await Role.findCreateFind({
    where: { name: CleaningAdminRoleName },
    defaults: {
        name: "CleaningAdmin",
        description: "You can update the have_to_clean state of barduties",
    },
});

const [NewsletterAdminRole, _4] = await Role.findCreateFind({
    where: { name: NewsletterAdminRoleName },
    defaults: {
        name: "NewsletterAdmin",
        description: "You can change settings that have something to do with the newsletter.",
    }
})

const [FacebookAdminRole, _5] = await Role.findCreateFind({
    where: { name: FacebookAdminRoleName },
    defaults: {
        name: "FacebookAdmin",
        description: "You can change the the settings belongs to facebook",
    },
})

export { StockAdminRole, BarAdminRole, CleaningAdminRole, NewsletterAdminRole, FacebookAdminRole, UserAdminRole };
