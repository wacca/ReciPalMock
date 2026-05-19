const escapeCell = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
};

export const buildCsv = (rows, columns) => {
    const headerLine = columns.map((c) => escapeCell(c.label)).join(',');
    const dataLines = rows.map((row) => (
        columns.map((c) => escapeCell(typeof c.value === 'function' ? c.value(row) : row[c.key])).join(',')
    ));
    return [headerLine, ...dataLines].join('\r\n');
};

export const downloadCsv = (csv, filename) => {
    // Excel が UTF-8 を正しく解釈できるよう BOM を先頭に付与
    const bom = '﻿';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const todayStamp = () => {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
};
