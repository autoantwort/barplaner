const dateFormat = Intl.DateTimeFormat("de-DE", {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});
export function printDate(date) {
    if (date === undefined) return "";
    return dateFormat.format(new Date(date));
}

const dateTimeFormat = Intl.DateTimeFormat("de-DE", {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: 'numeric',
});
export function printDateTime(date) {
    if (date === undefined) return "";
    return dateTimeFormat.format(new Date(date));
}

const dayDateTimeFormat = Intl.DateTimeFormat("de-DE", {
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: 'numeric',
});
export function printDayDateTime(date) {
    if (date === undefined) return "";
    return dayDateTimeFormat.format(new Date(date));
}