const APPLICATIONS_KEY = 'leaveApplications';
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
        id: 'leave_20240601',
        leaveType: '有給休暇',
        date: '2024-06-10',
        reason: '私用のため',
        status: '申請中',
        submittedAt: '2024-06-01T09:00:00.000Z',
    },
    {
        id: 'leave_20240602',
        leaveType: '遅刻',
        date: '2024-06-05',
        reason: '通院のため',
        status: '承認済',
        submittedAt: '2024-06-02T10:00:00.000Z',
        approvedBy: '油ニ 和平(univapay@univa.tech)',
        approvedAt: '2024-06-02T13:00:00.000Z',
    },
    {
        id: 'leave_20240603',
        leaveType: '早退',
        date: '2024-06-03',
        reason: '家庭の事情',
        status: '非承認',
        submittedAt: '2024-06-03T11:00:00.000Z',
        remarks: '理由の補足が必要です',
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
    leaveType: application.leaveType || '有給休暇',
    date: application.date || '',
    reason: application.reason || '',
    status: application.status || '申請中',
    submittedAt: application.submittedAt || new Date().toISOString(),
    updated: application.updated,
    remarks: application.remarks || '',
    approvedBy: application.approvedBy || '',
    approvedAt: application.approvedAt || '',
});

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
    return SAMPLE_APPLICATIONS;
};

export const saveLeaveApplications = (applications) => {
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications));
};

export const loadLeaveDrafts = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(DRAFTS_KEY) || '[]');
        return Array.isArray(stored) ? stored.map(normalizeLeaveDraft) : [];
    } catch {
        return [];
    }
};

export const saveLeaveDrafts = (drafts) => {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
};

export const buildLeaveApplication = ({ editId, leaveType, date, reason }) => ({
    id: editId === 'new' ? `leave_${Date.now()}` : editId,
    leaveType,
    date,
    reason,
    status: '申請中',
    submittedAt: new Date().toISOString(),
    remarks: '',
});

export const buildLeaveApplications = ({ editId, rows }) => {
    const submittedAt = new Date().toISOString();
    const baseId = editId === 'new' ? `leave_${Date.now()}` : editId;

    return rows.map((row, index) => ({
        id: rows.length === 1 ? baseId : `${baseId}_${index + 1}`,
        ...normalizeLeaveRow(row),
        status: '申請中',
        submittedAt,
        remarks: '',
    }));
};
