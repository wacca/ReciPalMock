// 祝日マスタストア（モック）
// 本番では holidays テーブル / API に置換。ここでは localStorage に永続化。
// レコード形状: { date: 'YYYY-MM-DD', name: string, source: 'legal' | 'company' | 'adjusted', note?: string }

const STORAGE_KEY = 'holidayMaster_v2';

// 内閣府 CSV を取り込んだ想定のシードデータ（法定祝日）
const LEGAL_SEED = [
    // 2025
    { date: '2025-01-01', name: '元日' },
    { date: '2025-01-13', name: '成人の日' },
    { date: '2025-02-11', name: '建国記念の日' },
    { date: '2025-02-23', name: '天皇誕生日' },
    { date: '2025-02-24', name: '振替休日' },
    { date: '2025-03-20', name: '春分の日' },
    { date: '2025-04-29', name: '昭和の日' },
    { date: '2025-05-03', name: '憲法記念日' },
    { date: '2025-05-04', name: 'みどりの日' },
    { date: '2025-05-05', name: 'こどもの日' },
    { date: '2025-05-06', name: '振替休日' },
    { date: '2025-07-21', name: '海の日' },
    { date: '2025-08-11', name: '山の日' },
    { date: '2025-09-15', name: '敬老の日' },
    { date: '2025-09-23', name: '秋分の日' },
    { date: '2025-10-13', name: 'スポーツの日' },
    { date: '2025-11-03', name: '文化の日' },
    { date: '2025-11-23', name: '勤労感謝の日' },
    { date: '2025-11-24', name: '振替休日' },
    // 2026
    { date: '2026-01-01', name: '元日' },
    { date: '2026-01-12', name: '成人の日' },
    { date: '2026-02-11', name: '建国記念の日' },
    { date: '2026-02-23', name: '天皇誕生日' },
    { date: '2026-03-20', name: '春分の日' },
    { date: '2026-04-29', name: '昭和の日' },
    { date: '2026-05-03', name: '憲法記念日' },
    { date: '2026-05-04', name: 'みどりの日' },
    { date: '2026-05-05', name: 'こどもの日' },
    { date: '2026-05-06', name: '振替休日' },
    { date: '2026-07-20', name: '海の日' },
    { date: '2026-08-11', name: '山の日' },
    { date: '2026-09-21', name: '敬老の日' },
    { date: '2026-09-22', name: '国民の休日' },
    { date: '2026-09-23', name: '秋分の日' },
    { date: '2026-10-12', name: 'スポーツの日' },
    { date: '2026-11-03', name: '文化の日' },
    { date: '2026-11-23', name: '勤労感謝の日' },
    // 2027
    { date: '2027-01-01', name: '元日' },
    { date: '2027-01-11', name: '成人の日' },
    { date: '2027-02-11', name: '建国記念の日' },
    { date: '2027-02-23', name: '天皇誕生日' },
    { date: '2027-03-21', name: '春分の日' },
    { date: '2027-03-22', name: '振替休日' },
    { date: '2027-04-29', name: '昭和の日' },
    { date: '2027-05-03', name: '憲法記念日' },
    { date: '2027-05-04', name: 'みどりの日' },
    { date: '2027-05-05', name: 'こどもの日' },
    { date: '2027-07-19', name: '海の日' },
    { date: '2027-08-11', name: '山の日' },
    { date: '2027-09-20', name: '敬老の日' },
    { date: '2027-09-23', name: '秋分の日' },
    { date: '2027-10-11', name: 'スポーツの日' },
    { date: '2027-11-03', name: '文化の日' },
    { date: '2027-11-23', name: '勤労感謝の日' },
];

const COMPANY_SEED = [
    { date: '2026-01-02', name: '年始休暇（会社指定）' },
    { date: '2026-01-03', name: '年始休暇（会社指定）' },
    { date: '2026-01-04', name: '年始休暇（会社指定）' },
    { date: '2026-12-29', name: '年末年始休暇（会社指定）' },
    { date: '2026-12-30', name: '年末年始休暇（会社指定）' },
];

export const HOLIDAY_SOURCES = {
    legal:    { label: '法定',  description: '内閣府CSV由来（バッチ更新）', color: 'var(--accent-iris)',  softBg: 'var(--accent-iris-soft)' },
    company:  { label: '会社',  description: '会社指定の休業日',           color: 'var(--accent-leaf)',  softBg: 'var(--accent-leaf-soft)' },
    adjusted: { label: '補正',  description: '法改正に伴う手動補正',       color: 'var(--accent-amber)', softBg: 'var(--accent-amber-soft)' },
};

const sortByDate = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

const normalize = (rec) => ({
    date: String(rec.date || '').slice(0, 10),
    name: String(rec.name || '').trim(),
    source: HOLIDAY_SOURCES[rec.source] ? rec.source : 'legal',
    note: rec.note ? String(rec.note) : '',
});

const seed = () => {
    const records = [
        ...LEGAL_SEED.map((r) => normalize({ ...r, source: 'legal' })),
        ...COMPANY_SEED.map((r) => normalize({ ...r, source: 'company' })),
    ].sort(sortByDate);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return records;
};

export const loadHolidays = () => {
    try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        if (Array.isArray(raw)) {
            return raw.map(normalize).sort(sortByDate);
        }
    } catch { /* noop */ }
    return seed();
};

const persist = (records) => {
    const sorted = [...records].sort(sortByDate);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    return sorted;
};

export const upsertHoliday = (records, holiday) => {
    const next = normalize(holiday);
    if (!next.date || !next.name) return records;
    const idx = records.findIndex((r) => r.date === next.date && r.source === next.source);
    if (idx >= 0) {
        const copy = [...records];
        copy[idx] = next;
        return persist(copy);
    }
    return persist([...records, next]);
};

export const deleteHoliday = (records, date, source) => (
    persist(records.filter((r) => !(r.date === date && r.source === source)))
);

// 「年次バッチ取込」のシミュレーション: 指定年の legal を最新シードで置換、company/adjusted は保持
export const importLegalForYear = (records, year) => {
    const kept = records.filter((r) => r.source !== 'legal' || !r.date.startsWith(`${year}-`));
    const fresh = LEGAL_SEED.filter((r) => r.date.startsWith(`${year}-`)).map((r) => normalize({ ...r, source: 'legal' }));
    return persist([...kept, ...fresh]);
};

export const resetHolidays = () => {
    localStorage.removeItem(STORAGE_KEY);
    return seed();
};

// holidays.js から参照される単純なルックアップ
const buildIndex = (records) => {
    const map = {};
    records.forEach((r) => { map[r.date] = r; });
    return map;
};
let cache = null;
const getCache = () => {
    if (cache) return cache;
    cache = buildIndex(loadHolidays());
    return cache;
};
export const invalidateHolidayCache = () => { cache = null; };

export const lookupHoliday = (dateKey) => getCache()[dateKey] || null;
