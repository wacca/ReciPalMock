export const APPROVAL_ROLES = [
    { value: '申請者', label: '申請者' },
    { value: '一次承認者', label: '一次承認者' },
    { value: '二次承認者', label: '二次承認者' },
    { value: '最終承認者', label: '最終承認者' },
    { value: '経理', label: '経理' },
];

const FALLBACK_ACCOUNTS = [
    { name: '由仁場 技朗', userId: 'univatech@univa.tech', email: 'univatech@univa.tech' },
    { name: '油ニ 和平', userId: 'univapay@univa.tech', email: 'univapay@univa.tech' },
    { name: '由引 安人', userId: 'ubiast@univa.tech', email: 'ubiast@univa.tech' },
];

const FALLBACK_DEPARTMENTS = ['営業部', '開発部', '総務部'];

export const createDefaultSteps = () => ([
    { role: '申請者', name: '', email: '' },
    { role: '一次承認者', name: '', email: '' },
]);

export const normalizeDepartmentNames = (items) => (
    items
        .map(item => (typeof item === 'string' ? item : item?.name))
        .filter(Boolean)
);

export const loadFlowAccounts = () => {
    try {
        const stored = JSON.parse(localStorage.getItem('accounts') || '[]');
        if (Array.isArray(stored) && stored.length > 0) return stored;
    } catch {
        // モックなので壊れたローカルデータは初期候補で復旧する
    }
    return FALLBACK_ACCOUNTS;
};

export const loadFlowDepartments = () => {
    try {
        const departments = normalizeDepartmentNames(JSON.parse(localStorage.getItem('departments') || '[]'));
        if (departments.length > 0) return departments;
    } catch {
        // モックなので壊れたローカルデータは初期候補で復旧する
    }
    return FALLBACK_DEPARTMENTS;
};

export const formatStep = (step) => (
    step.name ? `${step.role}: ${step.name} (${step.email || '-'})` : `${step.role}: 未設定`
);

export const getFlowTarget = (type, target) => (
    type === 'user' ? target?.name : target
);

export const applyApplicantStep = (steps, type, target) => {
    const nextSteps = steps.map(step => ({ ...step }));
    const targetName = getFlowTarget(type, target);
    nextSteps[0] = {
        ...nextSteps[0],
        role: '申請者',
        name: type === 'user' ? targetName || '' : '部署内申請者',
        email: type === 'user' ? target?.email || target?.userId || '' : '',
    };
    return nextSteps;
};

export const hasDuplicateFlow = (flows, type, target, excludeIdx = null) => (
    flows.some((flow, idx) => idx !== excludeIdx && flow.type === type && flow.target === target)
);

export const validateFlow = ({ flows, type, target, steps, excludeIdx = null }) => {
    if (!target) return '対象を選択してください';
    if (hasDuplicateFlow(flows, type, target, excludeIdx)) return '同じ対象のフローが既に存在します';
    if (steps.length < 2) return '承認ステップは2件以上必要です';
    const missingApprover = steps.slice(1).some(step => !step.name || !step.email);
    if (missingApprover) return '承認者を選択してください';
    return '';
};

export const buildFlow = (type, target, steps) => ({
    type,
    target,
    steps: steps.map(step => ({ ...step })),
});
