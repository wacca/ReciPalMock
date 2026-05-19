import { ROLES } from './permissions';

export const DEPARTMENTS = ['営業部', '開発部', '経理部', '総務部'];

export const USER_DIRECTORY = [
    { id: 'univatech@univa.tech', name: '由仁場 技朗', department: '営業部', role: ROLES.EMPLOYEE },
    { id: 'ubiast@univa.tech',    name: '由引 安人',   department: '営業部', role: ROLES.APPROVER },
    { id: 'univapay@univa.tech',  name: '油ニ 和平',   department: '経理部', role: ROLES.HR_ADMIN },
    { id: 'kamiya@univa.tech',    name: '紙谷 風花',   department: '開発部', role: ROLES.EMPLOYEE },
    { id: 'tachibana@univa.tech', name: '立花 蓮',     department: '開発部', role: ROLES.EMPLOYEE },
    { id: 'admin@univa.tech',     name: '管理者',      department: '総務部', role: ROLES.SYSTEM_ADMIN },
];

export const DEFAULT_USER = USER_DIRECTORY[0];

export const getUserProfile = (userId) => {
    if (!userId) return DEFAULT_USER;
    const found = USER_DIRECTORY.find((u) => u.id === userId);
    if (found) return found;
    return { id: userId, name: userId, department: '総務部', role: ROLES.EMPLOYEE };
};

export const getUserRole = (userId) => getUserProfile(userId).role;
