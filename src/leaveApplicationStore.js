import { DEFAULT_USER, getUserProfile } from './userDirectory';

const APPLICATIONS_KEY = 'leaveApplications_v4';
const DRAFTS_KEY = 'leaveDrafts';

export const LEAVE_TYPES = [
    '有給休暇',
    '特別休暇',
    '欠勤',
    '遅刻',
    '早退',
    'その他',
];

const SAMPLE_APPLICATIONS = [
    {
        id: 'leave_20260515',
        applicantId: 'univatech@univa.tech',
        applicantName: '由仁場 技朗',
        applicantDepartment: '営業部',
        leaveType: '有給休暇',
        date: '2026-05-25',
        reason: '私用のため',
        status: '申請中',
        submittedAt: '2026-05-15T09:00:00.000Z',
    },
    {
        id: 'leave_20260418',
        applicantId: 'univatech@univa.tech',
        applicantName: '由仁場 技朗',
        applicantDepartment: '営業部',
        leaveType: '遅刻',
        date: '2026-04-20',
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
        date: '2026-04-22',
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
        date: '2026-06-01',
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
        date: '2026-05-10',
        reason: '私用',
        status: '承認済',
        submittedAt: '2026-05-07T16:20:00.000Z',
        approvedBy: '油ニ 和平(univapay@univa.tech)',
        approvedAt: '2026-05-08T09:10:00.000Z',
        integrationStatus: 'pending',
    },
    {
        id: 'leave_20260512',
        applicantId: 'tachibana@univa.tech',
        applicantName: '立花 蓮',
        applicantDepartment: '開発部',
        leaveType: '特別休暇',
        date: '2026-06-15',
        reason: '結婚式参列のため',
        status: '申請中',
        submittedAt: '2026-05-12T11:45:00.000Z',
    },
    {
        id: 'leave_20260514',
        applicantId: 'univapay@univa.tech',
        applicantName: '油ニ 和平',
        applicantDepartment: '経理部',
        leaveType: '遅刻',
        date: '2026-05-20',
        reason: '電車遅延の見込み',
        status: '申請中',
        submittedAt: '2026-05-14T07:00:00.000Z',
    },
];

const SAMPLE_DRAFTS = [
    {
        id: 'leave_draft_20240604',
        status: '下書き',
        updated: '2024-06-04T09:30:00.000Z',
        details: [
            {
                leaveType: '有給休暇',
                date: '2024-06-14',
                reason: '私用のため',
            },
        ],
    },
    {
        id: 'leave_draft_20240605',
        status: '下書き',
        updated: '2024-06-05T15:10:00.000Z',
        details: [
            {
                leaveType: '遅刻',
                date: '2024-06-18',
                reason: '通院後に出社予定',
            },
            {
                leaveType: '早退',
                date: '2024-06-21',
                reason: '家庭の事情',
            },
        ],
    },
];

export const emptyLeaveDraft = () => ({
    id: 'new',
    leaveType: '有給休暇',
    date: '',
    reason: '',
});

export const emptyLeaveRow = () => ({
    leaveType: '有給休暇',
    date: '',
    reason: '',
});

export const normalizeLeaveRow = (row = {}) => ({
    leaveType: row.leaveType || '有給休暇',
    date: row.date || '',
    reason: row.reason || '',
});

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

export const normalizeLeaveApplication = (application) => ({
    id: application.id || `leave_${Date.now()}`,
    applicantId: application.applicantId || DEFAULT_USER.id,
    applicantName: application.applicantName || DEFAULT_USER.name,
    applicantDepartment: application.applicantDepartment || DEFAULT_USER.department,
    leaveType: application.leaveType || '有給休暇',
    date: application.date || '',
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
});

export const getLeaveIntegrationStatus = (row) => {
    if (row.status !== '承認済') return 'not_applicable';
    return row.integrationStatus && row.integrationStatus !== 'not_applicable'
        ? row.integrationStatus
        : 'pending';
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

export const buildLeaveApplication = ({ editId, leaveType, date, reason, applicantId }) => {
    const profile = getUserProfile(applicantId);
    return {
        id: editId === 'new' ? `leave_${Date.now()}` : editId,
        applicantId: profile.id,
        applicantName: profile.name,
        applicantDepartment: profile.department,
        leaveType,
        date,
        reason,
        status: '申請中',
        submittedAt: new Date().toISOString(),
        remarks: '',
    };
};

export const buildLeaveApplications = ({ editId, rows, applicantId }) => {
    const submittedAt = new Date().toISOString();
    const baseId = editId === 'new' ? `leave_${Date.now()}` : editId;
    const profile = getUserProfile(applicantId);

    return rows.map((row, index) => ({
        id: rows.length === 1 ? baseId : `${baseId}_${index + 1}`,
        applicantId: profile.id,
        applicantName: profile.name,
        applicantDepartment: profile.department,
        ...normalizeLeaveRow(row),
        status: '申請中',
        submittedAt,
        remarks: '',
        integrationStatus: 'not_applicable',
    }));
};
