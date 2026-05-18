import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Switch,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import AdminConfirmDialog from './components/AdminConfirmDialog';

const SCREEN_GROUPS = [
    {
        title: 'ホーム',
        screens: [
            { key: 'dashboard', label: 'ダッシュボード' },
        ],
    },
    {
        title: '申請',
        screens: [
            { key: 'application', label: '経費申請' },
            { key: 'submitted', label: '経費申請済' },
            { key: 'approvals', label: '経費承認' },
            { key: 'leave-application', label: '休暇申請' },
            { key: 'leave-submitted', label: '休暇申請済' },
            { key: 'leave-approvals', label: '休暇承認' },
        ],
    },
    {
        title: '勤怠',
        screens: [
            { key: 'attendance-input', label: '勤怠入力' },
        ],
    },
    {
        title: '管理',
        screens: [
            { key: 'flow-settings-menu', label: '申請フロー設定' },
            { key: 'reminder-settings', label: 'アラート設定' },
            { key: 'account-management', label: 'アカウント管理' },
            { key: 'master-settings', label: 'マスタ管理' },
            { key: 'permission-settings', label: '権限設定' },
        ],
    },
];

const SCREENS = SCREEN_GROUPS.flatMap(group => group.screens);

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
    admin: SCREENS.map(screen => screen.key),
    approver: ['dashboard', 'submitted', 'approvals', 'leave-submitted', 'leave-approvals', 'attendance-input'],
    user: ['dashboard', 'application', 'submitted', 'leave-application', 'leave-submitted', 'attendance-input'],
};

const createPermissionsFromKeys = (screenKeys) => (
    SCREENS.reduce((permissions, screen) => ({
        ...permissions,
        [screen.key]: screenKeys.includes(screen.key),
    }), {})
);

const createDefaultPermissions = () => (
    INITIAL_ROLES.reduce((permissions, role) => ({
        ...permissions,
        [role.key]: createPermissionsFromKeys(ROLE_PERMISSION_PRESETS[role.key] || []),
    }), {})
);

const loadJson = (key, fallback) => {
    try {
        const parsed = JSON.parse(localStorage.getItem(key) || 'null');
        return parsed || fallback;
    } catch {
        return fallback;
    }
};

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
        const mergedPermissions = loadedRoles.reduce((permissions, role) => ({
            ...permissions,
            [role.key]: {
                ...(defaultPermissions[role.key] || createPermissionsFromKeys([])),
                ...(savedPermissions[role.key] || {}),
            },
        }), {});
        const savedUserRoles = loadJson('userRoles', {});
        const normalizedUserRoles = loadedAccounts.reduce((roles, account, index) => ({
            ...roles,
            [account.userId]: savedUserRoles[account.userId] || (index === 0 ? 'admin' : index === 1 ? 'approver' : 'user'),
        }), {});

        setAccounts(loadedAccounts);
        setDefinedRoles(loadedRoles);
        setSelectedRoleKey(loadedRoles[0]?.key || '');
        setRolesPermissions(mergedPermissions);
        setUserRoles(normalizedUserRoles);
        localStorage.setItem('rolesPermissions', JSON.stringify(mergedPermissions));
        localStorage.setItem('userRoles', JSON.stringify(normalizedUserRoles));
    }, []);

    const selectedRole = definedRoles.find(role => role.key === selectedRoleKey);

    const filteredAccounts = useMemo(() => {
        const keyword = userSearchText.trim().toLowerCase();
        return accounts.filter(account => (
            !keyword
            || [account.name, account.userId, account.department, account.position, account.email]
                .some(value => String(value || '').toLowerCase().includes(keyword))
        ));
    }, [accounts, userSearchText]);

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const persistDefinedRoles = (roles) => {
        setDefinedRoles(roles);
        localStorage.setItem('definedRoles', JSON.stringify(roles));
    };

    const persistRolesPermissions = (permissions) => {
        setRolesPermissions(permissions);
        localStorage.setItem('rolesPermissions', JSON.stringify(permissions));
    };

    const persistUserRoles = (roles) => {
        setUserRoles(roles);
        localStorage.setItem('userRoles', JSON.stringify(roles));
    };

    const getRoleUsageCount = (roleKey) => Object.values(userRoles).filter(value => value === roleKey).length;

    const getEnabledPermissionCount = (roleKey) => (
        SCREENS.filter(screen => rolesPermissions[roleKey]?.[screen.key]).length
    );

    const handleRolePermissionChange = (screenKey, canAccess) => {
        const nextPermissions = {
            ...rolesPermissions,
            [selectedRoleKey]: {
                ...(rolesPermissions[selectedRoleKey] || {}),
                [screenKey]: canAccess,
            },
        };
        persistRolesPermissions(nextPermissions);
        showSnackbar('権限を保存しました');
    };

    const handleSetAllPermissions = (canAccess) => {
        const nextPermissions = {
            ...rolesPermissions,
            [selectedRoleKey]: createPermissionsFromKeys(canAccess ? SCREENS.map(screen => screen.key) : []),
        };
        persistRolesPermissions(nextPermissions);
        showSnackbar(canAccess ? 'すべての画面を許可しました' : 'すべての画面を解除しました');
    };

    const handleUserRoleChange = (userId, newRoleKey) => {
        const nextUserRoles = {
            ...userRoles,
            [userId]: newRoleKey,
        };
        persistUserRoles(nextUserRoles);
        showSnackbar('ロール割り当てを保存しました');
    };

    const openRoleDialog = (role = null) => {
        setEditingRole(role);
        setRoleNameInput(role ? role.label : '');
        setRoleDialogOpen(true);
    };

    const closeRoleDialog = () => {
        setRoleDialogOpen(false);
        setEditingRole(null);
        setRoleNameInput('');
    };

    const handleSaveRole = () => {
        const trimmedName = roleNameInput.trim();
        if (!trimmedName) {
            showSnackbar('ロール名を入力してください', 'warning');
            return;
        }
        const hasDuplicateLabel = definedRoles.some(role => (
            role.key !== editingRole?.key && role.label.trim() === trimmedName
        ));
        if (hasDuplicateLabel) {
            showSnackbar('同じロール名が既に存在します', 'warning');
            return;
        }

        if (editingRole) {
            const nextRoles = definedRoles.map(role => (
                role.key === editingRole.key ? { ...role, label: trimmedName } : role
            ));
            persistDefinedRoles(nextRoles);
            closeRoleDialog();
            showSnackbar('ロールを保存しました');
            return;
        }

        const newRoleKey = `role_${Date.now()}`;
        const nextRoles = [...definedRoles, { key: newRoleKey, label: trimmedName }];
        const nextPermissions = {
            ...rolesPermissions,
            [newRoleKey]: createPermissionsFromKeys([]),
        };

        persistDefinedRoles(nextRoles);
        persistRolesPermissions(nextPermissions);
        setSelectedRoleKey(newRoleKey);
        closeRoleDialog();
        showSnackbar('ロールを追加しました');
    };

    const handleDeleteRoleRequest = (roleKeyToDelete) => {
        if (definedRoles.length <= 1) {
            showSnackbar('最低1つのロールが必要です', 'warning');
            return;
        }

        const targetRole = definedRoles.find(role => role.key === roleKeyToDelete);
        const affectedUserCount = getRoleUsageCount(roleKeyToDelete);
        setDeleteTarget({ roleKey: roleKeyToDelete, role: targetRole, affectedUserCount });
    };

    const handleDeleteRoleConfirm = () => {
        if (!deleteTarget) return;
        const roleKeyToDelete = deleteTarget.roleKey;
        const nextRoles = definedRoles.filter(role => role.key !== roleKeyToDelete);
        const defaultRoleKey = nextRoles[0]?.key || '';
        const nextPermissions = { ...rolesPermissions };
        const nextUserRoles = Object.fromEntries(
            Object.entries(userRoles).map(([userId, roleKey]) => [
                userId,
                roleKey === roleKeyToDelete ? defaultRoleKey : roleKey,
            ])
        );

        delete nextPermissions[roleKeyToDelete];
        persistDefinedRoles(nextRoles);
        persistRolesPermissions(nextPermissions);
        persistUserRoles(nextUserRoles);
        if (selectedRoleKey === roleKeyToDelete) {
            setSelectedRoleKey(defaultRoleKey);
        }
        setDeleteTarget(null);
        showSnackbar('ロールを削除しました');
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Box className="pageHeaderRow">
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            権限設定
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            ロールごとの画面アクセスと、ユーザーへのロール割り当てを管理します。
                        </Typography>
                    </Box>
                    <Box className="pageActionBar">
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openRoleDialog()}>
                            ロール追加
                        </Button>
                    </Box>
                </Box>

                <Box className="expenseSummaryStrip">
                    <Box>
                        <Typography variant="caption" color="text.secondary">ロール</Typography>
                        <Typography variant="subtitle1">{definedRoles.length}件</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">対象画面</Typography>
                        <Typography variant="subtitle1">{SCREENS.length}画面</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">ユーザー</Typography>
                        <Typography variant="subtitle1">{accounts.length}名</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">選択ロールの許可</Typography>
                        <Typography variant="subtitle1">{selectedRole ? `${getEnabledPermissionCount(selectedRole.key)}画面` : '-'}</Typography>
                    </Box>
                </Box>

                <Tabs value={currentTab} onChange={(event, newValue) => setCurrentTab(newValue)} sx={{ mb: 3 }}>
                    <Tab label="ロール設定" />
                    <Tab label="ユーザー割り当て" />
                </Tabs>

                {currentTab === 0 && (
                    <Box className="permissionLayout">
                        <Box>
                            <Box className="sectionHeaderRow">
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                    ロール一覧
                                </Typography>
                            </Box>
                            <List disablePadding className="permissionRoleList">
                                {definedRoles.map(role => (
                                    <ListItem
                                        key={role.key}
                                        disablePadding
                                        secondaryAction={
                                            <Box className="tableActionGroup">
                                                <Tooltip title="編集">
                                                    <IconButton aria-label={`${role.label}を編集`} onClick={() => openRoleDialog(role)}>
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="削除">
                                                    <span>
                                                        <IconButton
                                                            aria-label={`${role.label}を削除`}
                                                            color="error"
                                                            onClick={() => handleDeleteRoleRequest(role.key)}
                                                            disabled={definedRoles.length <= 1}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            </Box>
                                        }
                                    >
                                        <ListItemButton
                                            selected={selectedRoleKey === role.key}
                                            onClick={() => setSelectedRoleKey(role.key)}
                                            className="permissionRoleButton"
                                        >
                                            <ListItemText
                                                primary={role.label}
                                                secondary={`${getEnabledPermissionCount(role.key)}画面許可 / ${getRoleUsageCount(role.key)}名`}
                                                primaryTypographyProps={{ fontWeight: 800 }}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </Box>

                        <Box>
                            {selectedRole ? (
                                <>
                                    <Box className="sectionHeaderRow">
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                {selectedRole.label}の画面アクセス権限
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                有効にした画面だけサイドメニューから利用できる想定です。
                                            </Typography>
                                        </Box>
                                        <Box className="pageActionBar">
                                            <Button variant="outlined" startIcon={<HighlightOffIcon />} onClick={() => handleSetAllPermissions(false)}>
                                                すべて解除
                                            </Button>
                                            <Button variant="contained" startIcon={<CheckCircleIcon />} onClick={() => handleSetAllPermissions(true)}>
                                                すべて許可
                                            </Button>
                                        </Box>
                                    </Box>

                                    <Box className="permissionGroupStack">
                                        {SCREEN_GROUPS.map(group => (
                                            <Box key={group.title} className="permissionGroup">
                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                                    {group.title}
                                                </Typography>
                                                <Box className="permissionScreenGrid">
                                                    {group.screens.map(screen => {
                                                        const canAccess = Boolean(rolesPermissions[selectedRole.key]?.[screen.key]);
                                                        return (
                                                            <Paper key={screen.key} variant="outlined" className="permissionScreenCard">
                                                                <Box>
                                                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                                        {screen.label}
                                                                    </Typography>
                                                                    <Chip
                                                                        size="small"
                                                                        label={canAccess ? '許可' : '未許可'}
                                                                        color={canAccess ? 'primary' : 'default'}
                                                                        variant={canAccess ? 'filled' : 'outlined'}
                                                                        sx={{ mt: 0.75 }}
                                                                    />
                                                                </Box>
                                                                <Switch
                                                                    checked={canAccess}
                                                                    onChange={(event) => handleRolePermissionChange(screen.key, event.target.checked)}
                                                                    inputProps={{ 'aria-label': `${screen.label}のアクセス権限` }}
                                                                />
                                                            </Paper>
                                                        );
                                                    })}
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                                </>
                            ) : (
                                <Typography color="text.secondary">ロールを選択してください。</Typography>
                            )}
                        </Box>
                    </Box>
                )}

                {currentTab === 1 && (
                    <Box>
                        <Box className="sectionHeaderRow">
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                    ユーザーへのロール割り当て
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    アカウントごとに利用できる画面セットを選択します。
                                </Typography>
                            </Box>
                        </Box>
                        <Box className="accountToolbar">
                            <TextField
                                size="small"
                                label="検索"
                                value={userSearchText}
                                onChange={event => setUserSearchText(event.target.value)}
                                sx={{ minWidth: 280 }}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon fontSize="small" />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                        </Box>
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
                                    <TableRow>
                                        <TableCell colSpan={5}>該当するユーザーはありません</TableCell>
                                    </TableRow>
                                )}
                                {filteredAccounts.map(account => (
                                    <TableRow key={account.userId}>
                                        <TableCell>{account.name}</TableCell>
                                        <TableCell>{account.userId}</TableCell>
                                        <TableCell>{account.department} / {account.position}</TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={account.status ? '有効' : '無効'}
                                                color={account.status ? 'primary' : 'default'}
                                                variant={account.status ? 'filled' : 'outlined'}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ minWidth: 220 }}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>ロール</InputLabel>
                                                <Select
                                                    value={userRoles[account.userId] || definedRoles[0]?.key || ''}
                                                    label="ロール"
                                                    onChange={(event) => handleUserRoleChange(account.userId, event.target.value)}
                                                >
                                                    {definedRoles.map(role => (
                                                        <MenuItem key={role.key} value={role.key}>
                                                            {role.label}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                )}
            </Paper>

            <Dialog open={roleDialogOpen} onClose={closeRoleDialog} maxWidth="xs" fullWidth>
                <DialogTitle>{editingRole ? 'ロール編集' : 'ロール追加'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="ロール名"
                        fullWidth
                        value={roleNameInput}
                        onChange={(event) => setRoleNameInput(event.target.value)}
                        onKeyDown={(event) => event.key === 'Enter' && handleSaveRole()}
                    />
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" color="inherit" startIcon={<CancelIcon />} onClick={closeRoleDialog}>キャンセル</Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveRole}>保存</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
            <AdminConfirmDialog
                open={Boolean(deleteTarget)}
                title="ロールを削除しますか？"
                message={`ロール「${deleteTarget?.role?.label || ''}」を削除します。${deleteTarget?.affectedUserCount || 0}名の割り当ては先頭のロールへ変更されます。`}
                confirmLabel="削除"
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleDeleteRoleConfirm}
            />
        </Container>
    );
}

export default PermissionSettings;
