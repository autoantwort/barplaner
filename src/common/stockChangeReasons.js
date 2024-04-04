const reasons = [
    {
        name: 'bought',
        germanName: 'Eingekauft',
        sign: '+',
        description: "Wenn wir etwas bei der Metro, Rewe, etc kaufen. Aber auch, wenn wir einer Vermietung etwas abkaufen (In Notiz erwähnen)",
    },
    {
        name: 'correctedConsumptionDuringBar',
        germanName: 'Korrektur Verbrauch Bar',
        sign: '+',
        description: "Was wir nach einer Bar wieder zurück ins Lager räumen"
    },
    {
        name: 'consumedDuringBar',
        germanName: 'Verbraucht während Bar',
        sign: '-',
        description: "Was wir während einer normalen Bar verbrauchen. Nicht sowas wie Baressen (Interner freier Verbrauch), Sommerfest (Weggegeben / Spende)",
    },
    {
        name: 'rentalConsumption',
        germanName: 'Vermietung',
        sign: '-',
        description: "Wenn die Vermietung was verbraucht. Nicht wenn wir was von der Vermietung abkaufen => Eingekauft",
    },
    {
        name: 'correctedRentalConsumption',
        germanName: 'Korrektur Vermietung',
        sign: '+',
        description: "Wenn die Vermietung nicht alles verbraucht hat und wir wieder die Sachen im Lager haben",
    },
    {
        name: 'internalFreeConsumption',
        germanName: 'Interner freier Verbrauch',
        sign: '-',
        description: "Während man z.B. in der Bar arbeitet oder Baressen",
    },
    {
        name: 'internalPayedConsumption',
        germanName: 'Interner bezahlter Verbrauch',
        sign: '-',
        description: "Wenn man sich privat Getränke nimmt und diese bezahlt",
    },
    {
        name: 'receivedDonation',
        germanName: 'Erhaltene Spende',
        sign: '+',
        description: "Wenn wir etwas Geschenkt bekommen. Z.b. die Getränke der Mitglieder beim Baressen",
    },
    {
        name: 'giveAway',
        germanName: 'Weggegeben / Spende',
        sign: '-',
        description: "Wenn wir Sachen verschenken (Winterfest, Sommerfest, soll weg)",
    },
    {
        name: 'discarded',
        germanName: 'Weggeworfen',
        sign: '-',
        description: "Wenn z.B. Sachen abgelaufen sind oder nicht mehr benötigt werden",
    },
    {
        name: 'sold',
        germanName: 'Verkauft',
        sign: '-',
        description: "Wenn wir Sachen verkaufen, z.B. an Hausbewohner oder Kachouri (zurückverkaufen)",
    },
    {
        name: 'other',
        germanName: 'Anderer Grund',
        sign: '±',
        description: "Wenn keiner der obigen passt. Der richtige Grund muss in der Notiz angegeben werden.",
    }
];

const reasonNames = reasons.map(reason => reason.name);

module.exports = { reasons, reasonNames };
