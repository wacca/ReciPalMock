import { useEffect, useMemo, useState } from 'react';
import {
    Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputAdornment,
    InputLabel, MenuItem, Select, Snackbar, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs,
    TextField, Tooltip, Stack, Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import HighlightOffRoundedIcon from '@mui/icons-material/HighlightOffRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import AdminConfirmDialog from './components/AdminConfirmDialog';
import PageScaffold from './ui/PageScaffold.jsx';
import Section from './ui/Section.jsx';
import StatusChip from './ui/StatusChip.jsx';

const SCREEN_GROUPS = [
    { title: 'ホーム', screens: [{ key: 'dashboard', label: 'ダッシュボード' }] },
    { title: '申請', screens: [
        { key: 'application', label: '経費申請' }, { key: 'submitted', label: '経費履歴' }, { key: 'approvals', label: '経費承認' },
        { key: 'leave-application', label: '勤怠申請' }, { key: 'leave-submitted', label: '勤怠申請履歴' }, { key: 'leave-approvals', label: '勤怠申請承認' },
    ] },
    { title: '勤怠', screens: [{ key: 'attendance-input', label: '勤怠入力' }] },
    { title: '管理', screens: [
        { key: 'flow-settings-menu', label: '申請フロー設定' }, { key: 'reminder-settings', label: 'アラート設定' },
        { key: 'account-management', label: 'アカウント管理' }, { key: 'master-settings', label: 'マスタ管理' },
        { key: 'permission-settings', label: '権限設定' },
    ] },
];

const SCREENS = SCREEN_GROUPS.flatMap((g) => g.screens);

const INITIAL_ROLES = [
    { key: 'admin', label: '管理者' },
    { key: 'approver', label: '承認者' },
    { key: 'user', label: '一般ユーザー' },
];

const SAMPLE_ACCOUNTS = [
    { name: '由仁場 技朗', userId: 'univatech@univa.tech', department: '開発部', position: '部長', email: 'univatech@univa.tech', status: true },
    { name: '油ニ 和平', userId: 'univapay@univa.tech', department: '営業部', position: '課長', email: 'univapay@univa.tech', status: true },
    { name: '由引 安人', userId: 'ubiast@univa.tech', department: '総務部', position: '一般社員', email: 'ubiast@univa.tech', status: false },
];

const ROLE_PERMISSION_PRESETS = {
    admin: SCREENS.map((s) => s.key),
    approver: ['dashboard', 'submitted', 'approvals', 'leave-submitted', 'leave-approvals', 'attendance-input'],
    user: ['dashboard', 'application', 'submitted', 'leave-application', 'leave-submitted', 'attendance-input'],
};

const TEMPLATES = [
    { key: 'admin', label: '管理者向け（すべて）', icon: '🛡', keys: SCREENS.map((s) => s.key) },
    { key: 'approver', label: '承認者向け', icon: '✅', keys: ROLE_PERMISSION_PRESETS.approver },
    { key: 'user', label: '一般ユーザー向け', icon: '👤', keys: ROLE_PERMISSION_PRESETS.user },
    { key: 'readonly', label: '閲覧のみ', icon: '👁', keys: ['dashboard', 'submitted', 'leave-submitted'] },
];

const createPermissionsFromKeys = (keys) => SCREENS.reduce((p, s) => ({ ...p, [s.key]: keys.includes(s.key) }), {});
const createDefaultPermissions = () => INITIAL_ROLES.reduce((p, r) => ({ ...p, [r.key]: createPermissionsFromKeys(ROLE_PERMISSION_PRESETS[r.key] || []) }), {});

const loadJson = (key, fallback) => { try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v || fallback; } catch { return fallback; } };
const loadAccounts = () => {
    const stored = loadJson('accounts', []);
    return Array.isArray(stored) && stored.length > 0 ? stored : SAMPLE_ACCOUNTS;
};

function PermissionSettings() {
    const [currentTab, setCurrentTab] = useState(0);
    const [accounts, setAccounts] = useState([]);
    const [definedRoles, setDefinedRoles] = useState(INITIAL_ROLES);
    const [selectedRoleKey, setSelectedRoleKey] = useState(INITIAL_ROLES[0].key);
    const [rolesPermissions, setRolesPermissions] = useState({});
    const [userRoles, setUserRoles] = useState({});
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [roleNameInput, setRoleNameInput] = useState('');
    const [userSearchText, setUserSearchText] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        const loadedAccounts = loadAccounts();
        const loadedRoles = loadJson('definedRoles', INITIAL_ROLES);
        const savedPermissions = loadJson('rolesPermissions', {});
        const defaultPermissions = createDefaultPermissions();
        const mergedPermissions = loadedRoles.reduce((p, r) => ({
            ...p,
            [r.key]: { ...(defaultPermissions[r.key] || createPermissionsFromKeys([])), ...(savedPermissions[r.key] || {}) },
        }), {});
        const savedUserRoles = loadJson('userRoles', {});
        const normalizedUserRoles = loadedAccounts.reduce((r, a, i) => ({
            ...r, [a.userId]: savedUserRoles[a.userId] || (i === 0 ? 'admin' : i === 1 ? 'approver' : 'user'),
        }), {});

        setAccounts(loadedAccounts);
        setDefinedRoles(loadedRoles);
        setSelectedRoleKey(loadedRoles[0]?.key || '');
        setRolesPermissions(mergedPermissions);
        setUserRoles(normalizedUserRoles);
        localStorage.setItem('rolesPermissions', JSON.stringify(mergedPermissions));
        localStorage.setItem('userRoles', JSON.stringify(normalizedUserRoles));
    }, []);

    const selectedRole = definedRoles.find((r) => r.key === selectedRoleKey);

    const filteredAccounts = useMemo(() => {
        const k = userSearchText.trim().toLowerCase();
        return accounts.filter((a) =>
            !k || [a.name, a.userId, a.department, a.position, a.email].some((v) => String(v || '').toLowerCase().includes(k)),
        );
    }, [accounts, userSearchText]);

    const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });
    const persistDefinedRoles = (roles) => { setDefinedRoles(roles); localStorage.setItem('definedRoles', JSON.stringify(roles)); };
    const persistRolesPermissions = (p) => { setRolesPermissions(p); localStorage.setItem('rolesPermissions', JSON.stringify(p)); };
    const persistUserRoles = (r) => { setUserRoles(r); localStorage.setItem('userRoles', JSON.stringify(r)); };

    const getRoleUsageCount = (key) => Object.values(userRoles).filter((v) => v === key).length;
    const getEnabledPermissionCount = (key) => SCREENS.filter((s) => rolesPermissions[key]?.[s.key]).length;

    const handleRolePermissionChange = (screenKey, canAccess) => {
        persistRolesPermissions({ ...rolesPermissions, [selectedRoleKey]: { ...(rolesPermissions[selectedRoleKey] || {}), [screenKey]: canAccess } });
        showSnackbar('権限を保存しました');
    };
    const handleApplyTemplate = (keys, label) => {
        persistRolesPermissions({ ...rolesPermissions, [selectedRoleKey]: createPermissionsFromKeys(keys) });
        showSnackbar(`「${label}」テンプレートを適用しました`);
    };
    const handleUserRoleChange = (userId, newRoleKey) => {
        persistUserRoles({ ...userRoles, [userId]: newRoleKey });
        showSnackbar('ロール割り当てを保存しました');
    };

    const openRoleDialog = (role = null) => { setEditingRole(role); setRoleNameInput(role ? role.label : ''); setRoleDialogOpen(true); };
    const closeRoleDialog = () => { setRoleDialogOpen(false); setEditingRole(null); setRoleNameInput(''); };

    const handleSaveRole = () => {
        const trimmed = roleNameInput.trim();
        if (!trimmed) { showSnackbar('ロール名を入力してください', 'warning'); return; }
        if (definedRoles.some((r) => r.key !== editingRole?.key && r.label.trim() === trimmed)) {
            showSnackbar('同じロール名が既に存在します', 'warning'); return;
        }
        if (editingRole) {
            persistDefinedRoles(definedRoles.map((r) => (r.key === editingRole.key ? { ...r, label: trimmed } : r)));
            closeRoleDialog();
            showSnackbar('ロールを保存しました');
            return;
        }
        const newKey = `role_${Date.now()}`;
        const nextRoles = [...definedRoles, { key: newKey, label: trimmed }];
        persistDefinedRoles(nextRoles);
        persistRolesPermissions({ ...rolesPermissions, [newKey]: createPermissionsFromKeys([]) });
        setSelectedRoleKey(newKey);
        closeRoleDialog();
        showSnackbar('ロールを追加しました');
    };

    const handleDeleteRoleConfirm = () => {
        if (!deleteTarget) return;
        const k = deleteTarget.roleKey;
        const nextRoles = definedRoles.filter((r) => r.key !== k);
        const defaultRoleKey = nextRoles[0]?.key || '';
        const nextPerm = { ...rolesPermissions };
        const nextUser = Object.fromEntries(Object.entries(userRoles).map(([u, rk]) => [u, rk === k ? defaultRoleKey : rk]));
        delete nextPerm[k];
        persistDefinedRoles(nextRoles);
        persistRolesPermissions(nextPerm);
        persistUserRoles(nextUser);
        if (selectedRoleKey === k) setSelectedRoleKey(defaultRoleKey);
        setDeleteTarget(null);
        showSnackbar('ロールを削除しました');
    };

    return (
        <PageScaffold
            eyebrow="管理"
            title="権限設定"
            subtitle="ロールごとの画面アクセスと、ユーザーへのロール割り当てを管理します。"
            actions={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => openRoleDialog()}>ロール追加</Button>}
        >
            <Section tone="sunken" elevation={0}>
                <Stack direction="row" spacing={4} flexWrap="wrap">
                    <Stat label="ロール" value={`${definedRoles.length}件`} tone="primary" />
                    <Stat label="対象画面" value={`${SCREENS.length}画面`} tone="iris" />
                    <Stat label="ユーザー" value={`${accounts.length}名`} tone="leaf" />
                    <Stat label={`${selectedRole?.label || '-'} の許可`} value={selectedRole ? `${getEnabledPermissionCount(selectedRole.key)}画面` : '-'} tone="amber" />
                </Stack>
            </Section>

            <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)} sx={{ mb: 1 }}>
                <Tab label="ロール権限" />
                <Tab label="ユーザー割り当て" />
            </Tabs>

            {currentTab === 0 && (
                <Box className="permissionLayout">
                    <Section title="ロール一覧" padded>
                        <Stack spacing={0.75}>
                            {definedRoles.map((role) => {
                                const active = selectedRoleKey === role.key;
                                return (
                                    <Box
                                        key={role.key}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            paddingInline: 1.5,
                                            paddingBlock: 1.25,
                                            borderRadius: 'var(--radius-md)',
                                            background: active ? 'var(--accent-primary-soft)' : 'transparent',
                                            color: active ? 'var(--accent-primary-ink)' : 'var(--ink-primary)',
                                            transition: 'var(--motion-fast)',
                                            '&:hover': { background: active ? 'var(--accent-primary-soft)' : 'var(--surface-sunken)' },
                                        }}
                                    >
                                        <Box
                                            onClick={() => setSelectedRoleKey(role.key)}
                                            sx={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                                        >
                                            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{role.label}</Typography>
                                            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                                                {getEnabledPermissionCount(role.key)}画面 ・ {getRoleUsageCount(role.key)}名
                                            </Typography>
                                        </Box>
                                        <Stack direction="row" spacing={0.5}>
                                            <Tooltip title="編集"><IconButton size="small" onClick={() => openRoleDialog(role)}><EditRoundedIcon fontSize="small" /></IconButton></Tooltip>
                                            <Tooltip title="削除">
                                                <span>
                                                    <IconButton size="small" color="error" disabled={definedRoles.length <= 1}
                                                        onClick={() => setDeleteTarget({ roleKey: role.key, role, affectedUserCount: getRoleUsageCount(role.key) })}>
                                                        <DeleteOutlineRoundedIcon fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </Stack>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Section>

                    {selectedRole && (
                        <Box>
                            <Section
                                title={`${selectedRole.label}の画面アクセス`}
                                subtitle="テンプレートで一気に揃え、必要な箇所だけ個別に調整できます。"
                                icon={<AutoFixHighRoundedIcon />}
                                padded
                            >
                                <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
                                    {TEMPLATES.map((tpl) => (
                                        <Button
                                            key={tpl.key}
                                            variant="outlined"
                                            size="small"
                                            onClick={() => handleApplyTemplate(tpl.keys, tpl.label)}
                                            sx={{ borderRadius: 'var(--radius-pill)' }}
                                        >
                                            <span style={{ marginRight: 6 }}>{tpl.icon}</span>
                                            {tpl.label}
                                        </Button>
                                    ))}
                                    <Box sx={{ flex: 1 }} />
                                    <Button variant="text" color="inherit" startIcon={<HighlightOffRoundedIcon />}
                                        onClick={() => handleApplyTemplate([], 'すべて解除')}
                                        sx={{ color: 'var(--ink-tertiary)' }}>
                                        すべて解除
                                    </Button>
                                    <Button variant="text" startIcon={<CheckCircleRoundedIcon />}
                                        onClick={() => handleApplyTemplate(SCREENS.map((s) => s.key), 'すべて許可')}>
                                        すべて許可
                                    </Button>
                                </Stack>

                                <Stack spacing={1.5}>
                                    {SCREEN_GROUPS.map((group) => (
                                        <Box key={group.title} sx={{ padding: 1.5, borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)' }}>
                                            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', display: 'block', mb: 1 }}>
                                                {group.title}
                                            </Typography>
                                            <Stack direction="row" spacing={0.75} flexWrap="wrap">
                                                {group.screens.map((screen) => {
                                                    const canAccess = Boolean(rolesPermissions[selectedRole.key]?.[screen.key]);
                                                    return (
                                                        <Box
                                                            key={screen.key}
                                                            onClick={() => handleRolePermissionChange(screen.key, !canAccess)}
                                                            sx={{
                                                                cursor: 'pointer',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: 1,
                                                                paddingInline: 1.5,
                                                                paddingBlock: 1,
                                                                borderRadius: 'var(--radius-pill)',
                                                                background: canAccess ? 'var(--accent-primary)' : 'var(--surface-raised)',
                                                                color: canAccess ? '#fff' : 'var(--ink-secondary)',
                                                                boxShadow: canAccess ? 'var(--shadow-1)' : 'none',
                                                                transition: 'var(--motion-base)',
                                                                fontWeight: 600,
                                                                fontSize: 13,
                                                                marginBottom: '6px !important',
                                                                '&:hover': { transform: 'translateY(-1px)', boxShadow: 'var(--shadow-1)' },
                                                            }}
                                                        >
                                                            {canAccess ? <CheckCircleRoundedIcon sx={{ fontSize: 16 }} /> : <HighlightOffRoundedIcon sx={{ fontSize: 16, color: 'var(--ink-muted)' }} />}
                                                            {screen.label}
                                                        </Box>
                                                    );
                                                })}
                                            </Stack>
                                        </Box>
                                    ))}
                                </Stack>
                            </Section>
                        </Box>
                    )}
                </Box>
            )}

            {currentTab === 1 && (
                <Section title="ユーザーへのロール割り当て" subtitle="アカウントごとに利用できる画面セットを選択します。" padded>
                    <Box sx={{ mb: 1.5 }}>
                        <TextField
                            size="small"
                            placeholder="氏名・ID・部署・メールで検索"
                            value={userSearchText}
                            onChange={(e) => setUserSearchText(e.target.value)}
                            sx={{ minWidth: 280, maxWidth: 480 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchRoundedIcon sx={{ color: 'var(--ink-tertiary)', fontSize: 18 }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                    <Box sx={{ overflowX: 'auto' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>氏名</TableCell>
                                    <TableCell>ユーザーID</TableCell>
                                    <TableCell>所属</TableCell>
                                    <TableCell>状態</TableCell>
                                    <TableCell>ロール</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredAccounts.length === 0 && (
                                    <TableRow><TableCell colSpan={5} sx={{ color: 'var(--ink-tertiary)' }}>該当するユーザーはありません</TableCell></TableRow>
                                )}
                                {filteredAccounts.map((acc) => (
                                    <TableRow key={acc.userId} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>{acc.name}</TableCell>
                                        <TableCell sx={{ color: 'var(--ink-tertiary)' }}>{acc.userId}</TableCell>
                                        <TableCell>{acc.department} / {acc.position}</TableCell>
                                        <TableCell><StatusChip status={acc.status ? 'active' : 'inactive'} size="sm" /></TableCell>
                                        <TableCell sx={{ minWidth: 220 }}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>ロール</InputLabel>
                                                <Select value={userRoles[acc.userId] || definedRoles[0]?.key || ''} label="ロール"
                                                    onChange={(e) => handleUserRoleChange(acc.userId, e.target.value)}>
                                                    {definedRoles.map((role) => <MenuItem key={role.key} value={role.key}>{role.label}</MenuItem>)}
                                                </Select>
                                            </FormControl>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                </Section>
            )}

            <Dialog open={roleDialogOpen} onClose={closeRoleDialog} maxWidth="xs" fullWidth>
                <DialogTitle>{editingRole ? 'ロール編集' : 'ロール追加'}</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" label="ロール名" fullWidth value={roleNameInput}
                        onChange={(e) => setRoleNameInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveRole()} />
                </DialogContent>
                <DialogActions>
                    <Button variant="text" color="inherit" startIcon={<CancelRoundedIcon />} onClick={closeRoleDialog}>キャンセル</Button>
                    <Button variant="contained" startIcon={<SaveRoundedIcon />} onClick={handleSaveRole}>保存</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
            <AdminConfirmDialog
                open={Boolean(deleteTarget)}
                title="ロールを削除しますか？"
                message={`ロール「${deleteTarget?.role?.label || ''}」を削除します。${deleteTarget?.affectedUserCount || 0}名の割り当ては先頭のロールへ変更されます。`}
                confirmLabel="削除"
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleDeleteRoleConfirm}
            />
        </PageScaffold>
    );
}

const Stat = ({ label, value, tone = 'primary' }) => {
    const tones = { primary: 'var(--accent-primary)', iris: 'var(--accent-iris)', leaf: 'var(--accent-leaf)', amber: 'var(--accent-amber)' };
    return (
        <Box>
            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>{label}</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 22, color: tones[tone] }} className="tabular-nums">{value}</Typography>
        </Box>
    );
};

export default PermissionSettings;
