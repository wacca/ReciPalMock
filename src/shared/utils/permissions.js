export const ROLES = {
    EMPLOYEE: 'employee',
    APPROVER: 'approver',
    HR_ADMIN: 'hr_admin',
    SYSTEM_ADMIN: 'system_admin',
};

export const ROLE_ORDER = [ROLES.EMPLOYEE, ROLES.APPROVER, ROLES.HR_ADMIN, ROLES.SYSTEM_ADMIN];

export const ROLE_LABELS = {
    [ROLES.EMPLOYEE]: '一般社員',
    [ROLES.APPROVER]: '承認者',
    [ROLES.HR_ADMIN]: 'HR / 総務',
    [ROLES.SYSTEM_ADMIN]: 'システム管理者',
};

export const ROLE_DESCRIPTIONS = {
    [ROLES.EMPLOYEE]: '自分の申請・勤怠入力',
    [ROLES.APPROVER]: '一般社員 + 部下の承認業務',
    [ROLES.HR_ADMIN]: '承認者 + 全社の参照・連携作業',
    [ROLES.SYSTEM_ADMIN]: 'HR / 総務 + システム設定',
};

export const ROLE_ACCENTS = {
    [ROLES.EMPLOYEE]: { bg: 'var(--surface-sunken)', fg: 'var(--ink-secondary)' },
    [ROLES.APPROVER]: { bg: 'var(--accent-iris-soft)', fg: 'var(--accent-iris)' },
    [ROLES.HR_ADMIN]: { bg: 'var(--accent-amber-soft)', fg: 'var(--accent-amber)' },
    [ROLES.SYSTEM_ADMIN]: { bg: 'var(--accent-rose-soft)', fg: 'var(--accent-rose)' },
};

export const PERMISSIONS = {
    VIEW_DASHBOARD: 'view:dashboard',
    APPLY_EXPENSE: 'apply:expense',
    APPLY_LEAVE: 'apply:leave',
    APPLY_ATTENDANCE: 'apply:attendance',
    APPROVE_EXPENSE: 'approve:expense',
    APPROVE_LEAVE: 'approve:leave',
    APPROVE_ATTENDANCE: 'approve:attendance',
    MANAGE_EXPENSE: 'manage:expense',
    MANAGE_LEAVE: 'manage:leave',
    MANAGE_ATTENDANCE: 'manage:attendance',
    ADMIN_FLOW: 'admin:flow',
    ADMIN_REMINDER: 'admin:reminder',
    ADMIN_ACCOUNT: 'admin:account',
    ADMIN_MASTER: 'admin:master',
    ADMIN_PERMISSION: 'admin:permission',
    ADMIN_HOLIDAY: 'admin:holiday',
};

const EMPLOYEE_PERMS = [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.APPLY_EXPENSE,
    PERMISSIONS.APPLY_LEAVE,
    PERMISSIONS.APPLY_ATTENDANCE,
];

const APPROVER_PERMS = [
    ...EMPLOYEE_PERMS,
    PERMISSIONS.APPROVE_EXPENSE,
    PERMISSIONS.APPROVE_LEAVE,
    PERMISSIONS.APPROVE_ATTENDANCE,
];

const HR_ADMIN_PERMS = [
    ...APPROVER_PERMS,
    PERMISSIONS.MANAGE_EXPENSE,
    PERMISSIONS.MANAGE_LEAVE,
    PERMISSIONS.MANAGE_ATTENDANCE,
    PERMISSIONS.ADMIN_HOLIDAY,
];

const SYSTEM_ADMIN_PERMS = [
    ...HR_ADMIN_PERMS,
    PERMISSIONS.ADMIN_FLOW,
    PERMISSIONS.ADMIN_REMINDER,
    PERMISSIONS.ADMIN_ACCOUNT,
    PERMISSIONS.ADMIN_MASTER,
    PERMISSIONS.ADMIN_PERMISSION,
];

export const ROLE_PERMISSIONS = {
    [ROLES.EMPLOYEE]: EMPLOYEE_PERMS,
    [ROLES.APPROVER]: APPROVER_PERMS,
    [ROLES.HR_ADMIN]: HR_ADMIN_PERMS,
    [ROLES.SYSTEM_ADMIN]: SYSTEM_ADMIN_PERMS,
};

export const hasPermission = (role, permission) => {
    const perms = ROLE_PERMISSIONS[role];
    if (!perms || !permission) return false;
    return perms.includes(permission);
};

export const hasAnyPermission = (role, permissions = []) => (
    permissions.length === 0 || permissions.some((p) => hasPermission(role, p))
);
