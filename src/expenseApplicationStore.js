const STORAGE_KEY = 'expenseApplications';

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
        applicationId: 'A20240528001',
        applicationDate: '2024-05-28',
        paymentType: '個人立替払用',
        details: [
            { date: '2024-05-25', description: '出張電車代', destination: '東京-新大阪', category: '旅費交通費', amount: 13870, status: '申請中' },
            { date: '2024-05-25', description: '〇〇（店名）', destination: '××社××様 会食', category: '接待交際費', amount: 19440, status: '申請中' },
        ],
    },
    {
        applicationId: 'A20240528002',
        applicationDate: '2024-05-27',
        paymentType: '法人カード経費分',
        details: [
            { date: '2024-05-26', description: 'Amazon', destination: '業務PC用 ケーブル', category: '消耗品※事務用品含', amount: 970, status: '非承認' },
        ],
        remarks: '予算オーバーのため非承認',
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

export const loadExpenseApplications = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        if (Array.isArray(stored) && stored.length > 0) {
            return stored.map(app => ({
                ...app,
                details: Array.isArray(app.details) ? app.details.map(normalizeExpenseRow) : [],
            }));
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

export const buildExpenseApplication = ({ rows, paymentType, draftId }) => ({
    applicationId: `A${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`,
    applicationDate: new Date().toISOString().slice(0, 10),
    sourceDraftId: draftId === 'new' ? undefined : draftId,
    paymentType,
    details: rows.map(row => normalizeExpenseRow({ ...row, status: '申請中' })),
});

export const getExpenseApplicationStatus = (application) => {
    const statuses = application.details.map(row => row.status);
    if (statuses.length === 0) return '明細なし';
    if (statuses.every(status => status === '承認済')) return '承認済';
    if (statuses.every(status => status === '非承認')) return '非承認';
    if (statuses.every(status => status === '取消')) return '取消';
    return '申請中';
};

export const getExpenseApplicationTotal = (application) => (
    application.details.reduce((sum, row) => sum + Number(row.amount || 0), 0)
);

export const formatYen = (value) => (
    new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(Number(value || 0))
);
