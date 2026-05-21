const toIsoDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

export const getLastNMonths = (n, base = new Date()) => {
    const to = new Date(base);
    const from = new Date(base);
    from.setMonth(from.getMonth() - n);
    return { from: toIsoDate(from), to: toIsoDate(to) };
};

export const getFiscalYearRange = (base = new Date()) => {
    const month = base.getMonth();
    const year = month < 3 ? base.getFullYear() - 1 : base.getFullYear();
    return { from: `${year}-04-01`, to: `${year + 1}-03-31` };
};

export const inDateRange = (date, from, to) => {
    if (!date) return !from && !to;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
};
