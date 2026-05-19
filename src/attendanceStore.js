import { DEFAULT_USER, getUserProfile } from './userDirectory';

const STORAGE_KEY = 'attendanceTimesheets_v1';

export const ATTENDANCE_APPROVAL_STATUSES = ['下書き', '申請中', '承認済', '非承認', '取消'];

const sampleWeekdayEntries = (year, month, baseDay = 1) => {
    const entries = {};
    const last = new Date(year, month, 0).getDate();
    for (let d = baseDay; d <= last; d += 1) {
        const date = new Date(year, month - 1, d);
        const weekday = date.getDay();
        if (weekday === 0 || weekday === 6) continue;
        const key = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        entries[key] = { type: '出勤', clockIn: '09:30', clockOut: '18:30', note: '' };
    }
    return entries;
};

export const attendanceId = (userId, year, month) => (
    `att_${userId}_${year}-${String(month).padStart(2, '0')}`
);

const SAMPLE_TIMESHEETS = [
    {
        id: attendanceId('univatech@univa.tech', 2026, 4),
        userId: 'univatech@univa.tech', userName: '由仁場 技朗', department: '営業部',
        year: 2026, month: 4,
        entries: sampleWeekdayEntries(2026, 4),
        approvalStatus: '承認済',
        submittedAt: '2026-05-01T18:00:00.000Z',
        approvedBy: '油ニ 和平(univapay@univa.tech)',
        approvedAt: '2026-05-02T09:00:00.000Z',
        remarks: '',
        integrationStatus: 'synced',
        integrationSyncedAt: '2026-05-02T10:00:00.000Z',
        closingStatus: 'closed',
    },
    {
        id: attendanceId('univatech@univa.tech', 2026, 5),
        userId: 'univatech@univa.tech', userName: '由仁場 技朗', department: '営業部',
        year: 2026, month: 5,
        entries: sampleWeekdayEntries(2026, 5, 1),
        approvalStatus: '申請中',
        submittedAt: '2026-05-18T19:00:00.000Z',
        approvedBy: '',
        approvedAt: '',
        remarks: '',
        integrationStatus: 'not_applicable',
        closingStatus: 'open',
    },
    {
        id: attendanceId('ubiast@univa.tech', 2026, 4),
        userId: 'ubiast@univa.tech', userName: '由引 安人', department: '営業部',
        year: 2026, month: 4,
        entries: sampleWeekdayEntries(2026, 4),
        approvalStatus: '承認済',
        submittedAt: '2026-05-01T17:30:00.000Z',
        approvedBy: '油ニ 和平(univapay@univa.tech)',
        approvedAt: '2026-05-02T09:10:00.000Z',
        remarks: '',
        integrationStatus: 'pending',
        closingStatus: 'closed',
    },
    {
        id: attendanceId('ubiast@univa.tech', 2026, 5),
        userId: 'ubiast@univa.tech', userName: '由引 安人', department: '営業部',
        year: 2026, month: 5,
        entries: {},
        approvalStatus: '下書き',
        submittedAt: '',
        approvedBy: '',
        approvedAt: '',
        remarks: '',
        integrationStatus: 'not_applicable',
        closingStatus: 'open',
    },
    {
        id: attendanceId('kamiya@univa.tech', 2026, 4),
        userId: 'kamiya@univa.tech', userName: '紙谷 風花', department: '開発部',
        year: 2026, month: 4,
        entries: sampleWeekdayEntries(2026, 4),
        approvalStatus: '承認済',
        submittedAt: '2026-04-30T20:00:00.000Z',
        approvedBy: '由引 安人(ubiast@univa.tech)',
        approvedAt: '2026-05-01T11:00:00.000Z',
        remarks: '',
        integrationStatus: 'synced',
        integrationSyncedAt: '2026-05-01T12:00:00.000Z',
        closingStatus: 'closed',
    },
    {
        id: attendanceId('tachibana@univa.tech', 2026, 4),
        userId: 'tachibana@univa.tech', userName: '立花 蓮', department: '開発部',
        year: 2026, month: 4,
        entries: sampleWeekdayEntries(2026, 4),
        approvalStatus: '非承認',
        submittedAt: '2026-05-01T22:00:00.000Z',
        approvedBy: '由引 安人(ubiast@univa.tech)',
        approvedAt: '2026-05-02T10:00:00.000Z',
        remarks: '4/15 の打刻が抜けています',
        integrationStatus: 'not_applicable',
        closingStatus: 'open',
    },
    {
        id: attendanceId('tachibana@univa.tech', 2026, 5),
        userId: 'tachibana@univa.tech', userName: '立花 蓮', department: '開発部',
        year: 2026, month: 5,
        entries: sampleWeekdayEntries(2026, 5, 1),
        approvalStatus: '申請中',
        submittedAt: '2026-05-17T19:30:00.000Z',
        approvedBy: '',
        approvedAt: '',
        remarks: '',
        integrationStatus: 'not_applicable',
        closingStatus: 'open',
    },
    {
        id: attendanceId('univapay@univa.tech', 2026, 4),
        userId: 'univapay@univa.tech', userName: '油ニ 和平', department: '経理部',
        year: 2026, month: 4,
        entries: sampleWeekdayEntries(2026, 4),
        approvalStatus: '承認済',
        submittedAt: '2026-04-30T18:00:00.000Z',
        approvedBy: '由引 安人(ubiast@univa.tech)',
        approvedAt: '2026-05-01T09:00:00.000Z',
        remarks: '',
        integrationStatus: 'error',
        integrationError: '給与SaaS 同期失敗（社員コード不一致）',
        closingStatus: 'closed',
    },
];

export const normalizeAttendanceTimesheet = (record = {}) => ({
    id: record.id || attendanceId(record.userId || DEFAULT_USER.id, record.year, record.month),
    userId: record.userId || DEFAULT_USER.id,
    userName: record.userName || DEFAULT_USER.name,
    department: record.department || DEFAULT_USER.department,
    year: Number(record.year || new Date().getFullYear()),
    month: Number(record.month || new Date().getMonth() + 1),
    entries: record.entries && typeof record.entries === 'object' ? record.entries : {},
    approvalStatus: record.approvalStatus || '下書き',
    submittedAt: record.submittedAt || '',
    approvedBy: record.approvedBy || '',
    approvedAt: record.approvedAt || '',
    remarks: record.remarks || '',
    integrationStatus: record.integrationStatus || 'not_applicable',
    integrationSyncedAt: record.integrationSyncedAt || '',
    integrationError: record.integrationError || '',
    closingStatus: record.closingStatus || 'open',
});

export const loadAttendanceTimesheets = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        if (Array.isArray(stored) && stored.length > 0) {
            return stored.map(normalizeAttendanceTimesheet);
        }
    } catch {
        // モックなので壊れたローカルデータは初期データで復旧
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_TIMESHEETS));
    return SAMPLE_TIMESHEETS.map(normalizeAttendanceTimesheet);
};

export const saveAttendanceTimesheets = (records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

export const findAttendance = (records, userId, year, month) => (
    records.find((r) => r.userId === userId && r.year === Number(year) && r.month === Number(month)) || null
);

export const upsertAttendance = (records, record) => {
    const normalized = normalizeAttendanceTimesheet(record);
    const idx = records.findIndex((r) => r.id === normalized.id);
    if (idx >= 0) {
        const next = [...records];
        next[idx] = normalized;
        return next;
    }
    return [...records, normalized];
};

export const emptyAttendance = (userId, year, month) => {
    const profile = getUserProfile(userId);
    return normalizeAttendanceTimesheet({
        userId: profile.id,
        userName: profile.name,
        department: profile.department,
        year,
        month,
        entries: {},
        approvalStatus: '下書き',
    });
};

export const getAttendanceIntegrationStatus = (record) => {
    if (record.approvalStatus !== '承認済') return 'not_applicable';
    return record.integrationStatus && record.integrationStatus !== 'not_applicable'
        ? record.integrationStatus
        : 'pending';
};
