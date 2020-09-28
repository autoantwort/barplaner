const getGermanReason = reason => {
    if (reason === "rentalConsumption") {
        return "Vermietung";
    } else if (reason === "correctedRentalConsumption") {
        return "Korrektur Vermietung";
    } else if (reason === "consumedDuringBar") {
        return "Verbraucht während Bar";
    } else if (reason === "correctedConsumptionDuringBar") {
        return "Korrektur Verbrauch Bar";
    } else if (reason === "internalFreeConsumption") {
        return "Interner freier Verbrauch";
    } else if (reason === "internalPayedConsumption") {
        return "Interner bezahlter Verbrauch";
    } else if (reason === "bought") {
        return "Eingekauft";
    } else if (reason === "receivedDonation") {
        return "Erhaltene Spende";
    } else if (reason === "giveAway") {
        return "Weggegeben / Spende";
    } else if (reason === "discarded") {
        return "Weggeworfen";
    } else if (reason === "sold") {
        return "Verkauft";
    } else if (reason === "other") {
        return "Anderer Grund";
    } else {
        return "error: " + reason;
    }
};

const getFilterFunction = reason => {
    const now = new Date();
    const day = 1000 * 60 * 60 * 24;
    const days8 = day * 8;
    const days15 = day * 15;
    const days30 = day * 30;
    if (reason === "rentalConsumption" || reason === "correctedRentalConsumption") {
        return i => (i.reason === "rentalConsumption" || i.reason === "correctedRentalConsumption") && now - i.date < days8;
    } else if (reason === "consumedDuringBar" || reason === "correctedConsumptionDuringBar") {
        return i => (i.reason === "consumedDuringBar" || i.reason === "correctedConsumptionDuringBar") && now - i.date < days15;
    } else if (reason === "internalFreeConsumption" || reason === "internalPayedConsumption") {
        return i => (i.reason === "internalFreeConsumption" || i.reason === "internalPayedConsumption") && now - i.date < day;
    } else if (reason === "bought") {
        return i => i.reason === "bought";
    } else if (reason === "receivedDonation") {
        return i => i.reason === "receivedDonation" && now - i.date < days30;
    } else if (reason === "giveAway") {
        return i => i.reason === "giveAway" && now - i.date < day;
    } else if (reason === "discarded") {
        return i => i.reason === "giveAway" && now - i.date < days15;
    } else if (reason === "sold") {
        return i => i.reason === "sold" && now - i.date < days15;
    } else if (reason === "other") {
        return () => true;
    } else {
        return () => true;
    }
};

export { getGermanReason, getFilterFunction };