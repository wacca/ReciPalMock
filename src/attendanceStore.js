import { DEFAULT_USER, getUserProfile } from './userDirectory';

const STORAGE_KEY = 'attendanceTimesheets_v1';

export const ATTENDANCE_APPROVAL_STATUSES = ['下書き', '申請中', '承認済', '差戻し', '取消'];

// 旧データ互換: 「非承認」を「差戻し」に正規化
const migrateApprovalStatus = (status) => (status === '非承認' ? '差戻し' : status);

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
        approvalStatus: '差戻し',
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
    approvalStatus: migrateApprovalStatus(record.approvalStatus || '下書き'),
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

// 全日休の種別 → 勤怠 entry.type
const FULL_DAY_LEAVE_TYPE = {
    '有給休暇': '有給',
    '特別休暇': '振替休日',
    '欠勤': '欠勤',
};

const BUSINESS_START = '09:30';
const BUSINESS_END = '18:30';

const isWeekend = (dateStr) => {
    const d = new Date(`${dateStr}T00:00:00`);
    const w = d.getDay();
    return w === 0 || w === 6;
};

// 'HH:MM' に X 時間（小数可）を加算して 'HH:MM' を返す
const addHoursToHM = (hhmm, hoursDelta) => {
    if (!hhmm || !Number.isFinite(hoursDelta)) return hhmm || '';
    const [h, m] = hhmm.split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
    const total = h * 60 + m + Math.round(hoursDelta * 60);
    const hh = Math.max(0, Math.min(23, Math.floor(total / 60)));
    const mm = Math.max(0, Math.min(59, ((total % 60) + 60) % 60));
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

// 時間休/遅刻/早退時の出退勤調整を計算する。`hours` を主軸にし、無ければ legacy timeFrom/timeTo を参照
const computeHourlyEntry = (leaveApp, existing) => {
    const hours = Number(leaveApp.hours) > 0
        ? Number(leaveApp.hours)
        : 0;
    const baseClockIn = existing.clockIn || BUSINESS_START;
    const baseClockOut = existing.clockOut || BUSINESS_END;

    if (leaveApp.leaveType === '遅刻') {
        // X 時間遅刻 → 出社時刻を 始業+X に
        const newClockIn = hours > 0 ? addHoursToHM(BUSINESS_START, hours) : (leaveApp.timeTo || baseClockIn);
        return { type: '出勤', clockIn: newClockIn, clockOut: baseClockOut };
    }
    if (leaveApp.leaveType === '早退') {
        // X 時間早退 → 退社時刻を 終業-X に
        const newClockOut = hours > 0 ? addHoursToHM(BUSINESS_END, -hours) : (leaveApp.timeFrom || baseClockOut);
        return { type: '出勤', clockIn: baseClockIn, clockOut: newClockOut };
    }
    // 時間休（有給/特別/欠勤/その他）: 具体的な時間帯は不明なため、出退勤時刻は据え置きで note のみ追記
    return null;
};

/**
 * 承認された勤怠申請（休暇/遅刻/早退/時間休）を月次勤怠 entries に反映する。
 * - 平日のみ反映、土日はスキップ
 * - 月単位の record が無ければ自動作成（下書き状態）
 * - closingStatus='closed' の月はスキップ
 * - 全日休: type を有給/欠勤/振替休日に切替、出退勤クリア
 * - 時間休/遅刻/早退: type='出勤' のまま clockIn/clockOut を時刻調整
 * - 「その他」「中抜け時間休」は note のみ追記
 * @param {Object} leaveApp 承認された申請
 * @returns {{updated: number, skippedClosed: number, skippedWeekend: number, months: string[]}}
 */
export const applyLeaveToAttendance = (leaveApp) => {
    const result = { updated: 0, skippedClosed: 0, skippedWeekend: 0, months: [] };
    if (!leaveApp?.dateFrom || !leaveApp.applicantId) return result;

    const dates = [];
    const from = new Date(`${leaveApp.dateFrom}T00:00:00`);
    const to = new Date(`${leaveApp.isHourly ? leaveApp.dateFrom : (leaveApp.dateTo || leaveApp.dateFrom)}T00:00:00`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return result;
    const cur = new Date(from);
    while (cur <= to && dates.length < 366) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const d = String(cur.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
        cur.setDate(cur.getDate() + 1);
    }

    let all = loadAttendanceTimesheets();
    const hoursLabel = leaveApp.isHourly && Number(leaveApp.hours) > 0
        ? ` ${Number(leaveApp.hours)}時間`
        : '';
    const noteText = `[勤怠反映] ${leaveApp.leaveType}${hoursLabel}${leaveApp.reason ? ` / ${leaveApp.reason}` : ''}`;
    const monthsTouched = new Set();

    for (const dateKey of dates) {
        if (isWeekend(dateKey)) { result.skippedWeekend += 1; continue; }
        const [y, m] = dateKey.split('-');
        const year = Number(y);
        const month = Number(m);

        let record = findAttendance(all, leaveApp.applicantId, year, month);
        if (!record) {
            record = normalizeAttendanceTimesheet({
                userId: leaveApp.applicantId,
                userName: leaveApp.applicantName,
                department: leaveApp.applicantDepartment,
                year,
                month,
                entries: {},
                approvalStatus: '下書き',
            });
        }

        if (record.closingStatus === 'closed') { result.skippedClosed += 1; continue; }

        const existing = record.entries[dateKey] || {};
        let nextEntry;
        if (leaveApp.isHourly) {
            const hourly = computeHourlyEntry(leaveApp, existing);
            nextEntry = hourly
                ? { ...hourly, note: existing.note ? `${existing.note}\n${noteText}` : noteText }
                : { ...existing, note: existing.note ? `${existing.note}\n${noteText}` : noteText };
        } else if (FULL_DAY_LEAVE_TYPE[leaveApp.leaveType]) {
            // 全日休
            nextEntry = {
                type: FULL_DAY_LEAVE_TYPE[leaveApp.leaveType],
                clockIn: '',
                clockOut: '',
                note: existing.note ? `${existing.note}\n${noteText}` : noteText,
            };
        } else {
            // 全日のその他: note のみ
            nextEntry = { ...existing, note: existing.note ? `${existing.note}\n${noteText}` : noteText };
        }

        const nextEntries = { ...record.entries, [dateKey]: nextEntry };
        const nextRecord = { ...record, entries: nextEntries };
        all = upsertAttendance(all, nextRecord);
        result.updated += 1;
        monthsTouched.add(`${year}-${String(month).padStart(2, '0')}`);
    }

    saveAttendanceTimesheets(all);
    result.months = Array.from(monthsTouched);
    return result;
};
