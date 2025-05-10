const REASON = Object.freeze({
    BOUGHT: 'bought',
    CORRECTED_CONSUMPTION_DURING_BAR: 'correctedConsumptionDuringBar',
    CONSUMED_DURING_BAR: 'consumedDuringBar',
    RENTAL_CONSUMPTION: 'rentalConsumption',
    CORRECTED_RENTAL_CONSUMPTION: 'correctedRentalConsumption',
    INTERNAL_FREE_CONSUMPTION: 'internalFreeConsumption',
    INTERNAL_PAYED_CONSUMPTION: 'internalPayedConsumption',
    RECEIVED_DONATION: 'receivedDonation',
    GIVE_AWAY: 'giveAway',
    DISCARDED: 'discarded',
    SOLD: 'sold',
    OTHER: 'other',
    INVENTORY: 'inventory',
});

const reasons = [
    {
        name: REASON.BOUGHT,
        germanName: 'Eingekauft',
        sign: '+',
        description: "Wenn wir etwas bei der Metro, Rewe, etc kaufen. Aber auch, wenn wir einer Vermietung etwas abkaufen (In Notiz erwähnen)",
        id: 1,
    },
    {
        name: REASON.CORRECTED_CONSUMPTION_DURING_BAR,
        germanName: 'Korrektur Verbrauch Bar',
        sign: '+',
        description: "Was wir nach einer Bar wieder zurück ins Lager räumen",
        id: 2,
    },
    {
        name: REASON.CONSUMED_DURING_BAR,
        germanName: 'Verbraucht während Bar',
        sign: '-',
        description: "Was wir während einer Bar verbrauchen. Nicht sowas wie Baressen (Interner freier Verbrauch), Sommerfest (Weggegeben / Spende)",
        id: 3,
    },
    {
        name: REASON.RENTAL_CONSUMPTION,
        germanName: 'Vermietung',
        sign: '-',
        description: "Wenn die Vermietung was verbraucht. Nicht wenn wir was von der Vermietung abkaufen => Eingekauft",
        id: 4,
    },
    {
        name: REASON.CORRECTED_RENTAL_CONSUMPTION,
        germanName: 'Korrektur Vermietung',
        sign: '+',
        description: "Wenn die Vermietung nicht alles verbraucht hat und wir wieder die Sachen im Lager haben",
        id: 5,
    },
    {
        name: REASON.INTERNAL_FREE_CONSUMPTION,
        germanName: 'Interner freier Verbrauch',
        sign: '-',
        description: "Während man z.B. in der Bar arbeitet oder Baressen",
        id: 6,
    },
    {
        name: REASON.INTERNAL_PAYED_CONSUMPTION,
        germanName: 'Interner bezahlter Verbrauch',
        sign: '-',
        description: "Wenn man sich privat Getränke nimmt und diese bezahlt",
        id: 7,
    },
    {
        name: REASON.RECEIVED_DONATION,
        germanName: 'Erhaltene Spende',
        sign: '+',
        description: "Wenn wir etwas Geschenkt bekommen. Z.b. die Getränke der Mitglieder beim Baressen",
        id: 8,
    },
    {
        name: REASON.GIVE_AWAY,
        germanName: 'Weggegeben / Spende',
        sign: '-',
        description: "Wenn wir Sachen verschenken (Winterfest, Sommerfest, soll weg)",
        id: 9,
    },
    {
        name: REASON.DISCARDED,
        germanName: 'Weggeworfen',
        sign: '-',
        description: "Wenn z.B. Sachen abgelaufen sind oder nicht mehr benötigt werden",
        id: 10,
    },
    {
        name: REASON.SOLD,
        germanName: 'Verkauft',
        sign: '-',
        description: "Wenn wir Sachen verkaufen, z.B. an Hausbewohner oder Kachouri (zurückverkaufen)",
        id: 11,
    },
    {
        name: REASON.OTHER,
        germanName: 'Anderer Grund',
        sign: '±',
        description: "Wenn keiner der obigen passt. Der richtige Grund muss in der Notiz angegeben werden.",
        id: 12,
    }
];

const inventoryReason = {
    name: REASON.INVENTORY,
    germanName: 'Inventar',
    sign: 'i',
    description: "Zeigt die aktuelle Menge des gescannten Items an.",
    id: 0,
}

const reasonNames = reasons.map(reason => reason.name);
const addReasons = reasons.filter(r => r.sign !== '-').map(r => ({ ...r, sign: '+' }));
const removeReasons = reasons.filter(r => r.sign !== '+').map(r => ({ ...r, sign: '-' }));

const commands = {
    minusOne: 20001,
    cancel: 20002,
    done: 20003,
    next: 20004,
    previous: 20005,
}

const findIndex = (name, reasons) => {
    return reasons.findIndex((item) => item.name === name);
}
export { reasons, reasonNames, addReasons, removeReasons, findIndex, inventoryReason, commands, REASON };
