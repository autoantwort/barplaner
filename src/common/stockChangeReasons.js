const reasons = [
    {
        name: 'bought',
        germanName: 'Eingekauft',
        sign: '+',
        description: "Wenn wir etwas bei der Metro, Rewe, etc kaufen. Aber auch, wenn wir einer Vermietung etwas abkaufen (In Notiz erwähnen)",
        id: 1,
    },
    {
        name: 'correctedConsumptionDuringBar',
        germanName: 'Korrektur Verbrauch Bar',
        sign: '+',
        description: "Was wir nach einer Bar wieder zurück ins Lager räumen",
        id: 2,
    },
    {
        name: 'consumedDuringBar',
        germanName: 'Verbraucht während Bar',
        sign: '-',
        description: "Was wir während einer Bar verbrauchen. Nicht sowas wie Baressen (Interner freier Verbrauch), Sommerfest (Weggegeben / Spende)",
        id: 3,
    },
    {
        name: 'rentalConsumption',
        germanName: 'Vermietung',
        sign: '-',
        description: "Wenn die Vermietung was verbraucht. Nicht wenn wir was von der Vermietung abkaufen => Eingekauft",
        id: 4,
    },
    {
        name: 'correctedRentalConsumption',
        germanName: 'Korrektur Vermietung',
        sign: '+',
        description: "Wenn die Vermietung nicht alles verbraucht hat und wir wieder die Sachen im Lager haben",
        id: 5,
    },
    {
        name: 'internalFreeConsumption',
        germanName: 'Interner freier Verbrauch',
        sign: '-',
        description: "Während man z.B. in der Bar arbeitet oder Baressen",
        id: 6,
    },
    {
        name: 'internalPayedConsumption',
        germanName: 'Interner bezahlter Verbrauch',
        sign: '-',
        description: "Wenn man sich privat Getränke nimmt und diese bezahlt",
        id: 7,
    },
    {
        name: 'receivedDonation',
        germanName: 'Erhaltene Spende',
        sign: '+',
        description: "Wenn wir etwas Geschenkt bekommen. Z.b. die Getränke der Mitglieder beim Baressen",
        id: 8,
    },
    {
        name: 'giveAway',
        germanName: 'Weggegeben / Spende',
        sign: '-',
        description: "Wenn wir Sachen verschenken (Winterfest, Sommerfest, soll weg)",
        id: 9,
    },
    {
        name: 'discarded',
        germanName: 'Weggeworfen',
        sign: '-',
        description: "Wenn z.B. Sachen abgelaufen sind oder nicht mehr benötigt werden",
        id: 10,
    },
    {
        name: 'sold',
        germanName: 'Verkauft',
        sign: '-',
        description: "Wenn wir Sachen verkaufen, z.B. an Hausbewohner oder Kachouri (zurückverkaufen)",
        id: 11,
    },
    {
        name: 'other',
        germanName: 'Anderer Grund',
        sign: '±',
        description: "Wenn keiner der obigen passt. Der richtige Grund muss in der Notiz angegeben werden.",
        id: 12,
    }
];

const inventoryReason = {
    name: 'inventory',
    germanName: 'Inventar',
    sign: 'i',
    description: "Zeigt die aktuelle Menge des gescannten Items an.",
    id: 0,
}

const reasonNames = reasons.map(reason => reason.name);
const addReasons = reasons.filter(r => r.sign !== '-').map(r => ({...r, sign: '+'}));
const removeReasons = reasons.filter(r => r.sign !== '+').map(r => ({...r, sign: '-'}));

const commands = {
    minusOne: 20001,
    cancel: 20002,
    done: 20003,
}

const findIndex = (name, reasons) => {
    return reasons.findIndex((item) => item.name === name);
}
module.exports = { reasons, reasonNames, addReasons, removeReasons, findIndex, inventoryReason, commands };
