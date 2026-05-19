import { DEFAULT_USER, getUserProfile } from './userDirectory';

const STORAGE_KEY = 'expenseApplications_v4';

export const EXPENSE_CATEGORIES = [
    '旅費交通費',
    '会議費',
    '接待交際費',
    '消耗品※事務用品含',
    '新聞図書費',
    '送料※切手代含',
    'その他',
];

export const emptyExpenseRow = () => ({
    date: '',
    description: '',
    destination: '',
    category: '',
    amount: '',
    receiptName: '',
    receiptPreview: '',
});

const SAMPLE_APPLICATIONS = [
    {
        applicationId: 'A20260515001',
        applicationDate: '2026-05-15',
        applicantId: 'univatech@univa.tech',
        applicantName: '由仁場 技朗',
        applicantDepartment: '営業部',
        paymentType: '個人立替払用',
        integrationStatus: 'not_applicable',
        details: [
            { date: '2026-05-13', description: '出張電車代', destination: '東京-新大阪', category: '旅費交通費', amount: 13870, status: '申請中' },
            { date: '2026-05-13', description: '〇〇（店名）', destination: '××社××様 会食', category: '接待交際費', amount: 19440, status: '申請中' },
        ],
    },
    {
        applicationId: 'A20260512001',
        applicationDate: '2026-05-12',
        applicantId: 'univatech@univa.tech',
        applicantName: '由仁場 技朗',
        applicantDepartment: '営業部',
        paymentType: '法人カード経費分',
        integrationStatus: 'not_applicable',
        details: [
            { date: '2026-05-10', description: 'Amazon', destination: '業務PC用 ケーブル', category: '消耗品※事務用品含', amount: 970, status: '非承認' },
        ],
        remarks: '予算オーバーのため非承認',
    },
    {
        applicationId: 'A20260508001',
        applicationDate: '2026-05-08',
        applicantId: 'ubiast@univa.tech',
        applicantName: '由引 安人',
        applicantDepartment: '営業部',
        paymentType: '個人立替払用',
        integrationStatus: 'error',
        integrationError: '経費 SaaS API 認証エラー',
        approvedBy: '油ニ 和平(univapay@univa.tech)',
        approvedAt: '2026-05-09T10:30:00.000Z',
        details: [
            { date: '2026-05-06', description: 'タクシー', destination: '羽田-渋谷', category: '旅費交通費', amount: 7820, status: '承認済' },
        ],
    },
    {
        applicationId: 'A20260425001',
        applicationDate: '2026-04-25',
        applicantId: 'univapay@univa.tech',
        applicantName: '油ニ 和平',
        applicantDepartment: '経理部',
        paymentType: '個人立替払用',
        integrationStatus: 'not_applicable',
        details: [
            { date: '2026-04-24', description: '書籍購入', destination: '会計実務本 2冊', category: '新聞図書費', amount: 6600, status: '申請中' },
        ],
    },
    {
        applicationId: 'A20260410001',
        applicationDate: '2026-04-10',
        applicantId: 'kamiya@univa.tech',
        applicantName: '紙谷 風花',
        applicantDepartment: '開発部',
        paymentType: '法人カード経費分',
        integrationStatus: 'synced',
        integrationSyncedAt: '2026-04-12T03:15:00.000Z',
        approvedBy: '由引 安人(ubiast@univa.tech)',
        approvedAt: '2026-04-11T09:00:00.000Z',
        details: [
            { date: '2026-04-08', description: 'AWS 利用料', destination: '開発検証用', category: 'その他', amount: 24500, status: '承認済' },
            { date: '2026-04-09', description: 'GitHub Copilot', destination: '開発チーム5名分', category: 'その他', amount: 5500, status: '承認済' },
        ],
    },
    {
        applicationId: 'A20260322001',
        applicationDate: '2026-03-22',
        applicantId: 'tachibana@univa.tech',
        applicantName: '立花 蓮',
        applicantDepartment: '開発部',
        paymentType: '個人立替払用',
        integrationStatus: 'not_applicable',
        details: [
            { date: '2026-03-20', description: '勉強会参加費', destination: 'React Tokyo Conference', category: 'その他', amount: 15000, status: '申請中' },
        ],
    },
    {
        applicationId: 'A20260318001',
        applicationDate: '2026-03-18',
        applicantId: 'kamiya@univa.tech',
        applicantName: '紙谷 風花',
        applicantDepartment: '開発部',
        paymentType: '個人立替払用',
        integrationStatus: 'pending',
        approvedBy: '油ニ 和平(univapay@univa.tech)',
        approvedAt: '2026-05-15T08:00:00.000Z',
        details: [
            { date: '2026-03-15', description: 'クライアント打合せ往復', destination: '横浜', category: '旅費交通費', amount: 2840, status: '承認済' },
        ],
    },
];

export const normalizeExpenseRow = (row) => ({
    date: row.date || '',
    description: row.description || '',
    destination: row.destination || '',
    category: row.category || '',
    amount: Number(row.amount || 0),
    receiptName: row.receiptName || '',
    receiptPreview: row.receiptPreview || '',
    status: row.status || '申請中',
});

const normalizeExpenseApplication = (app) => ({
    ...app,
    applicantId: app.applicantId || DEFAULT_USER.id,
    applicantName: app.applicantName || DEFAULT_USER.name,
    applicantDepartment: app.applicantDepartment || DEFAULT_USER.department,
    integrationStatus: app.integrationStatus || 'not_applicable',
    details: Array.isArray(app.details) ? app.details.map(normalizeExpenseRow) : [],
});

export const getExpenseIntegrationStatus = (app) => {
    const overall = getExpenseApplicationStatus(app);
    if (overall !== '承認済') return 'not_applicable';
    return app.integrationStatus && app.integrationStatus !== 'not_applicable'
        ? app.integrationStatus
        : 'pending';
};

export const loadExpenseApplications = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        if (Array.isArray(stored) && stored.length > 0) {
            return stored.map(normalizeExpenseApplication);
        }
    } catch {
        // モックなので壊れたローカルデータは初期データで復旧する
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_APPLICATIONS));
    return SAMPLE_APPLICATIONS;
};

export const saveExpenseApplications = (applications) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
};

export const buildExpenseApplication = ({ rows, paymentType, draftId, applicantId }) => {
    const profile = getUserProfile(applicantId);
    return {
        applicationId: `A${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`,
        applicationDate: new Date().toISOString().slice(0, 10),
        sourceDraftId: draftId === 'new' ? undefined : draftId,
        applicantId: profile.id,
        applicantName: profile.name,
        applicantDepartment: profile.department,
        paymentType,
        integrationStatus: 'not_applicable',
        details: rows.map((row) => normalizeExpenseRow({ ...row, status: '申請中' })),
    };
};

export const getExpenseApplicationStatus = (application) => {
    const statuses = application.details.map((row) => row.status);
    if (statuses.length === 0) return '明細なし';
    if (statuses.every((status) => status === '承認済')) return '承認済';
    if (statuses.every((status) => status === '非承認')) return '非承認';
    if (statuses.every((status) => status === '取消')) return '取消';
    return '申請中';
};

export const getExpenseApplicationTotal = (application) => (
    application.details.reduce((sum, row) => sum + Number(row.amount || 0), 0)
);

export const formatYen = (value) => (
    new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(Number(value || 0))
);
