import { DEFAULT_USER, getUserProfile } from './userDirectory';

const APPLICATIONS_KEY = 'leaveApplications_v7';
const DRAFTS_KEY = 'leaveDrafts_v4';

export const LEAVE_TYPES = [
    '有給休暇',
    '特別休暇',
    '欠勤',
    '遅刻',
    '早退',
    'その他',
];

// 期間入力に意味がある種別（複数日の休み）。遅刻・早退は単日扱い
export const RANGEABLE_LEAVE_TYPES = ['有給休暇', '特別休暇', '欠勤', 'その他'];
// 常に時間指定する種別（遅刻・早退）
export const ALWAYS_HOURLY_TYPES = ['遅刻', '早退'];

// 営業時間の標準値（モック）
export const BUSINESS_START = '09:30';
export const BUSINESS_END = '18:30';

const SAMPLE_APPLICATIONS = [
    {
        id: 'leave_20260515',
        applicantId: 'univatech@univa.tech',
        applicantName: '由仁場 技朗',
        applicantDepartment: '営業部',
        leaveType: '有給休暇',
        dateFrom: '2026-05-25',
        dateTo: '2026-05-27',
        isHourly: false,
        hours: 0,
        reason: '帰省のため',
        status: '申請中',
        submittedAt: '2026-05-15T09:00:00.000Z',
    },
    {
        id: 'leave_20260418',
        applicantId: 'univatech@univa.tech',
        applicantName: '由仁場 技朗',
        applicantDepartment: '営業部',
        leaveType: '遅刻',
        dateFrom: '2026-04-20',
        dateTo: '2026-04-20',
        isHourly: true,
        hours: 1,
        reason: '通院のため',
        status: '承認済',
        submittedAt: '2026-04-18T10:00:00.000Z',
        approvedBy: '油ニ 和平(univapay@univa.tech)',
        approvedAt: '2026-04-18T13:00:00.000Z',
        integrationStatus: 'synced',
        integrationSyncedAt: '2026-04-18T14:00:00.000Z',
    },
    {
        id: 'leave_20260420',
        applicantId: 'univatech@univa.tech',
        applicantName: '由仁場 技朗',
        applicantDepartment: '営業部',
        leaveType: '早退',
        dateFrom: '2026-04-22',
        dateTo: '2026-04-22',
        isHourly: true,
        hours: 1.5,
        reason: '家庭の事情',
        status: '非承認',
        submittedAt: '2026-04-20T11:00:00.000Z',
        remarks: '理由の補足が必要です',
    },
    {
        id: 'leave_20260505',
        applicantId: 'ubiast@univa.tech',
        applicantName: '由引 安人',
        applicantDepartment: '営業部',
        leaveType: '有給休暇',
        dateFrom: '2026-06-01',
        dateTo: '2026-06-05',
        isHourly: false,
        hours: 0,
        reason: 'リフレッシュ休暇',
        status: '申請中',
        submittedAt: '2026-05-05T08:30:00.000Z',
    },
    {
        id: 'leave_20260507',
        applicantId: 'kamiya@univa.tech',
        applicantName: '紙谷 風花',
        applicantDepartment: '開発部',
        leaveType: '有給休暇',
        dateFrom: '2026-05-10',
        dateTo: '2026-05-10',
        isHourly: false,
        hours: 0,
        reason: '私用',
        status: '承認済',
        submittedAt: '2026-05-07T16:20:00.000Z',
        approvedBy: '油ニ 和平(univapay@univa.tech)',
        approvedAt: '2026-05-08T09:10:00.000Z',
        integrationStatus: 'pending',
    },
    {
        id: 'leave_20260508_am',
        applicantId: 'kamiya@univa.tech',
        applicantName: '紙谷 風花',
        applicantDepartment: '開発部',
        leaveType: '有給休暇',
        dateFrom: '2026-05-18',
        dateTo: '2026-05-18',
        isHourly: true,
        hours: 2.5,
        reason: '午前 通院',
        status: '申請中',
        submittedAt: '2026-05-08T19:00:00.000Z',
    },
    {
        id: 'leave_20260512',
        applicantId: 'tachibana@univa.tech',
        applicantName: '立花 蓮',
        applicantDepartment: '開発部',
        leaveType: '特別休暇',
        dateFrom: '2026-06-15',
        dateTo: '2026-06-16',
        isHourly: false,
        hours: 0,
        reason: '結婚式参列のため',
        status: '申請中',
        submittedAt: '2026-05-12T11:45:00.000Z',
    },
    {
        id: 'leave_20260513_pm',
        applicantId: 'tachibana@univa.tech',
        applicantName: '立花 蓮',
        applicantDepartment: '開発部',
        leaveType: '有給休暇',
        dateFrom: '2026-05-22',
        dateTo: '2026-05-22',
        isHourly: true,
        hours: 5,
        reason: '午後 私用',
        status: '申請中',
        submittedAt: '2026-05-13T18:00:00.000Z',
    },
    {
        id: 'leave_20260514',
        applicantId: 'univapay@univa.tech',
        applicantName: '油ニ 和平',
        applicantDepartment: '経理部',
        leaveType: '遅刻',
        dateFrom: '2026-05-20',
        dateTo: '2026-05-20',
        isHourly: true,
        hours: 0.5,
        reason: '電車遅延の見込み',
        status: '申請中',
        submittedAt: '2026-05-14T07:00:00.000Z',
    },
];

const SAMPLE_DRAFTS = [];

// 旧データ（timeFrom/timeTo のみ）から hours を算出するための互換ヘルパ
const legacyTimesToHours = (timeFrom, timeTo) => {
    if (!timeFrom || !timeTo) return 0;
    const [h1, m1] = String(timeFrom).split(':').map(Number);
    const [h2, m2] = String(timeTo).split(':').map(Number);
    if (![h1, m1, h2, m2].every(Number.isFinite)) return 0;
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff <= 0) return 0;
    return Math.round((diff / 60) * 100) / 100;
};

const resolveHours = (row) => {
    if (row?.hours !== undefined && row.hours !== null && row.hours !== '') {
        const n = Number(row.hours);
        return Number.isFinite(n) && n > 0 ? n : 0;
    }
    return legacyTimesToHours(row?.timeFrom, row?.timeTo);
};

export const emptyLeaveDraft = () => ({
    id: 'new',
    leaveType: '有給休暇',
    dateFrom: '',
    dateTo: '',
    isHourly: false,
    hours: 0,
    reason: '',
});

export const emptyLeaveRow = () => ({
    leaveType: '有給休暇',
    dateFrom: '',
    dateTo: '',
    isHourly: false,
    hours: 0,
    reason: '',
});

export const normalizeLeaveRow = (row = {}) => {
    const dateFrom = row.dateFrom || row.date || '';
    const dateTo = row.dateTo || row.date || dateFrom;
    const isHourly = Boolean(row.isHourly) || ALWAYS_HOURLY_TYPES.includes(row.leaveType);
    const hours = isHourly ? resolveHours(row) : 0;
    return {
        leaveType: row.leaveType || '有給休暇',
        dateFrom,
        // 時間休は単日扱い
        dateTo: isHourly ? dateFrom : dateTo,
        date: dateFrom,
        isHourly,
        hours,
        reason: row.reason || '',
    };
};

export const normalizeLeaveDraft = (draft = {}) => {
    const details = Array.isArray(draft.details)
        ? draft.details.map(normalizeLeaveRow)
        : [normalizeLeaveRow(draft)];

    return {
        id: draft.id || 'new',
        status: draft.status || '下書き',
        updated: draft.updated || '',
        details: details.length > 0 ? details : [emptyLeaveRow()],
    };
};

export const normalizeLeaveApplication = (application) => {
    const dateFrom = application.dateFrom || application.date || '';
    const dateTo = application.dateTo || application.date || dateFrom;
    const isHourly = Boolean(application.isHourly) || ALWAYS_HOURLY_TYPES.includes(application.leaveType);
    const hours = isHourly ? resolveHours(application) : 0;
    return {
        id: application.id || `leave_${Date.now()}`,
        applicantId: application.applicantId || DEFAULT_USER.id,
        applicantName: application.applicantName || DEFAULT_USER.name,
        applicantDepartment: application.applicantDepartment || DEFAULT_USER.department,
        leaveType: application.leaveType || '有給休暇',
        dateFrom,
        dateTo: isHourly ? dateFrom : dateTo,
        date: dateFrom,
        isHourly,
        hours,
        reason: application.reason || '',
        status: application.status || '申請中',
        submittedAt: application.submittedAt || new Date().toISOString(),
        updated: application.updated,
        remarks: application.remarks || '',
        approvedBy: application.approvedBy || '',
        approvedAt: application.approvedAt || '',
        integrationStatus: application.integrationStatus || 'not_applicable',
        integrationSyncedAt: application.integrationSyncedAt || '',
        integrationError: application.integrationError || '',
    };
};

export const getLeaveIntegrationStatus = (row) => {
    if (row.status !== '承認済') return 'not_applicable';
    return row.integrationStatus && row.integrationStatus !== 'not_applicable'
        ? row.integrationStatus
        : 'pending';
};

// dateFrom..dateTo の範囲を「YYYY-MM-DD」文字列の配列で返す（土日含む）。時間休は単日のみ
export const getLeaveDateList = (app) => {
    if (!app?.dateFrom) return [];
    if (app.isHourly) return [app.dateFrom];
    const from = new Date(`${app.dateFrom}T00:00:00`);
    const to = new Date(`${app.dateTo || app.dateFrom}T00:00:00`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return [];
    const list = [];
    const cur = new Date(from);
    while (cur <= to && list.length < 366) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const d = String(cur.getDate()).padStart(2, '0');
        list.push(`${y}-${m}-${d}`);
        cur.setDate(cur.getDate() + 1);
    }
    return list;
};

export const getLeaveDayCount = (app) => (app?.isHourly ? 0 : getLeaveDateList(app).length);

export const getLeaveHours = (app) => {
    if (!app?.isHourly) return 0;
    return resolveHours(app);
};

export const formatLeavePeriod = (app, { withDays = true } = {}) => {
    if (!app?.dateFrom) return '-';
    if (app.isHourly) {
        const h = getLeaveHours(app);
        const hoursLabel = h > 0 ? `${h}時間` : '時間未入力';
        return withDays ? `${app.dateFrom}（${hoursLabel}）` : `${app.dateFrom} ${hoursLabel}`;
    }
    if (!app.dateTo || app.dateFrom === app.dateTo) return app.dateFrom;
    const days = withDays ? `（${getLeaveDayCount(app)}日間）` : '';
    return `${app.dateFrom} 〜 ${app.dateTo}${days}`;
};

export const loadLeaveApplications = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '[]');
        if (Array.isArray(stored) && stored.length > 0) {
            return stored.map(normalizeLeaveApplication);
        }
    } catch {
        // モックなので壊れたローカルデータは初期データで復旧する
    }
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(SAMPLE_APPLICATIONS));
    return SAMPLE_APPLICATIONS.map(normalizeLeaveApplication);
};

export const saveLeaveApplications = (applications) => {
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications));
};

export const loadLeaveDrafts = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(DRAFTS_KEY) || '[]');
        if (Array.isArray(stored) && stored.length > 0) {
            return stored.map(normalizeLeaveDraft);
        }
    } catch {
        // モックなので壊れたローカルデータは初期データで復旧する
    }
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(SAMPLE_DRAFTS));
    return SAMPLE_DRAFTS.map(normalizeLeaveDraft);
};

export const saveLeaveDrafts = (drafts) => {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
};

export const buildLeaveApplications = ({ editId, rows, applicantId }) => {
    const submittedAt = new Date().toISOString();
    const baseId = editId === 'new' ? `leave_${Date.now()}` : editId;
    const profile = getUserProfile(applicantId);

    return rows.map((row, index) => {
        const normalized = normalizeLeaveRow(row);
        return {
            id: rows.length === 1 ? baseId : `${baseId}_${index + 1}`,
            applicantId: profile.id,
            applicantName: profile.name,
            applicantDepartment: profile.department,
            ...normalized,
            status: '申請中',
            submittedAt,
            remarks: '',
            integrationStatus: 'not_applicable',
        };
    });
};
