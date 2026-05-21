import { useState, useEffect } from 'react';
import {
    Box, Button, TextField, Snackbar, Alert, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, IconButton,
    Switch, Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, Tooltip, Typography, Stack,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import PersonRemoveRoundedIcon from '@mui/icons-material/PersonRemoveRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AdminConfirmDialog from '../../shared/components/AdminConfirmDialog';
import PageScaffold from '../../shared/ui/PageScaffold.jsx';
import Section from '../../shared/ui/Section.jsx';
import StatusChip from '../../shared/ui/StatusChip.jsx';

const SAMPLE_DEPARTMENTS = [
    { name: '営業部', positions: [{ name: '部長' }, { name: '課長' }, { name: '一般社員' }] },
    { name: '開発部', positions: [{ name: '部長' }, { name: '主任' }, { name: '一般社員' }] },
    { name: '総務部', positions: [{ name: '部長' }, { name: '一般社員' }] },
];

const SAMPLE_ACCOUNTS = [
    { name: '由仁場 技朗', userId: 'univatech@univa.tech', department: '開発部', position: '部長', email: 'univatech@univa.tech', status: true },
    { name: '油ニ 和平', userId: 'univapay@univa.tech', department: '営業部', position: '課長', email: 'univapay@univa.tech', status: true },
    { name: '由引 安人', userId: 'ubiast@univa.tech', department: '総務部', position: '一般社員', email: 'ubiast@univa.tech', status: false },
];

const emptyAccount = { name: '', userId: '', department: '', position: '', email: '', status: true };

const normalizeDepartments = (rawDepartments) => {
    if (!Array.isArray(rawDepartments) || rawDepartments.length === 0) return SAMPLE_DEPARTMENTS;
    return rawDepartments.map((department, index) => ({
        name: typeof department === 'string' ? department : department?.name || `部署${index + 1}`,
        positions: Array.isArray(department?.positions)
            ? department.positions.map((position) => (typeof position === 'string' ? { name: position } : position)).filter((position) => position?.name)
            : [],
    }));
};

const loadDepartments = () => {
    try {
        const departments = normalizeDepartments(JSON.parse(localStorage.getItem('departments') || '[]'));
        localStorage.setItem('departments', JSON.stringify(departments));
        return departments;
    } catch {
        localStorage.setItem('departments', JSON.stringify(SAMPLE_DEPARTMENTS));
        return SAMPLE_DEPARTMENTS;
    }
};

const loadAccounts = () => {
    try {
        const stored = JSON.parse(localStorage.getItem('accounts') || '[]');
        if (Array.isArray(stored) && stored.length > 0) return stored;
    } catch {
        /* fall through */
    }
    localStorage.setItem('accounts', JSON.stringify(SAMPLE_ACCOUNTS));
    return SAMPLE_ACCOUNTS;
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function AccountManagement() {
    const [accounts, setAccounts] = useState([]);
    const [editIdx, setEditIdx] = useState(null);
    const [editAccount, setEditAccount] = useState({});
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [departments, setDepartments] = useState([]);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [addForm, setAddForm] = useState(emptyAccount);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        setDepartments(loadDepartments());
        setAccounts(loadAccounts());
    }, []);

    const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

    const getPositionsForDepartment = (departmentName) =>
        departments.find((d) => d.name === departmentName)?.positions?.map((p) => p.name) || [];

    const validateAccount = (account, currentIdx = null) => {
        if (!account.name || !account.userId || !account.department || !account.position || !account.email) return '必須項目を入力してください';
        if (!isValidEmail(account.email)) return 'メールアドレスの形式を確認してください';
        if (accounts.some((item, idx) => idx !== currentIdx && item.userId === account.userId)) return '同じユーザーIDのアカウントが既に存在します';
        if (accounts.some((item, idx) => idx !== currentIdx && item.email === account.email)) return '同じメールアドレスのアカウントが既に存在します';
        return '';
    };

    const handleAddOpen = () => { setAddForm(emptyAccount); setAddDialogOpen(true); };
    const handleAddChange = (field, value) => setAddForm({ ...addForm, [field]: value, ...(field === 'department' ? { position: '' } : {}) });
    const handleAdd = () => {
        const msg = validateAccount(addForm);
        if (msg) { showSnackbar(msg, 'warning'); return; }
        const newAccounts = [...accounts, { ...addForm }];
        setAccounts(newAccounts);
        localStorage.setItem('accounts', JSON.stringify(newAccounts));
        setAddDialogOpen(false);
        showSnackbar('アカウントを追加しました');
    };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        const next = accounts.filter((_, i) => i !== deleteTarget.idx);
        setAccounts(next);
        localStorage.setItem('accounts', JSON.stringify(next));
        setDeleteTarget(null);
        showSnackbar('アカウントを削除しました');
    };

    const handleEdit = (idx) => { setEditIdx(idx); setEditAccount({ ...accounts[idx] }); };
    const handleEditChange = (field, value) => setEditAccount({ ...editAccount, [field]: value, ...(field === 'department' ? { position: '' } : {}) });
    const handleSave = () => {
        if (editIdx === null) return;
        const msg = validateAccount(editAccount, editIdx);
        if (msg) { showSnackbar(msg, 'warning'); return; }
        const next = [...accounts];
        next[editIdx] = editAccount;
        setAccounts(next);
        localStorage.setItem('accounts', JSON.stringify(next));
        setEditIdx(null); setEditAccount({});
        showSnackbar('アカウントを保存しました');
    };
    const handleCancel = () => { setEditIdx(null); setEditAccount({}); };

    const filteredAccounts = accounts.filter((a) => {
        const k = searchText.trim().toLowerCase();
        const matchK = !k || [a.name, a.userId, a.department, a.position, a.email].some((v) => String(v || '').toLowerCase().includes(k));
        const matchS = statusFilter === 'all' || (statusFilter === 'active' ? a.status : !a.status);
        return matchK && matchS;
    });

    const activeCount = accounts.filter((a) => a.status).length;

    return (
        <PageScaffold
            eyebrow="管理"
            title="アカウント管理"
            subtitle="利用者、所属部署、役職、有効状態を管理します。"
            actions={(
                <Button variant="contained" color="primary" startIcon={<AddRoundedIcon />} onClick={handleAddOpen}>
                    新規追加
                </Button>
            )}
        >
            <Section tone="sunken" elevation={0}>
                <Stack direction="row" spacing={4} flexWrap="wrap">
                    <Stat label="登録数" value={accounts.length} tone="primary" />
                    <Stat label="有効" value={activeCount} tone="leaf" />
                    <Stat label="無効" value={accounts.length - activeCount} tone="slate" />
                </Stack>
            </Section>

            <Section padded>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                    <TextField
                        size="small"
                        placeholder="氏名・ID・部署・メールで検索"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        sx={{ minWidth: 300, flex: 1 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchRoundedIcon sx={{ color: 'var(--ink-tertiary)', fontSize: 18 }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField select size="small" label="状態" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ width: 160 }}>
                        <MenuItem value="all">すべて</MenuItem>
                        <MenuItem value="active">有効のみ</MenuItem>
                        <MenuItem value="inactive">無効のみ</MenuItem>
                    </TextField>
                </Stack>
                <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>氏名</TableCell>
                                <TableCell>ユーザーID</TableCell>
                                <TableCell>所属部署</TableCell>
                                <TableCell>役職</TableCell>
                                <TableCell>メールアドレス</TableCell>
                                <TableCell>有効</TableCell>
                                <TableCell align="right">操作</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredAccounts.length === 0 && (
                                <TableRow><TableCell colSpan={7} sx={{ color: 'var(--ink-tertiary)' }}>該当するアカウントはありません</TableCell></TableRow>
                            )}
                            {filteredAccounts.map((acc) => {
                                const idx = accounts.findIndex((a) => a.userId === acc.userId);
                                return (
                                    <TableRow key={acc.userId} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>{acc.name}</TableCell>
                                        <TableCell sx={{ color: 'var(--ink-tertiary)' }}>{acc.userId}</TableCell>
                                        <TableCell>{acc.department}</TableCell>
                                        <TableCell>{acc.position}</TableCell>
                                        <TableCell sx={{ color: 'var(--ink-tertiary)' }}>{acc.email}</TableCell>
                                        <TableCell><StatusChip status={acc.status ? 'active' : 'inactive'} size="sm" /></TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                <Tooltip title="編集"><IconButton aria-label={`${acc.name}を編集`} onClick={() => handleEdit(idx)}><EditRoundedIcon fontSize="small" /></IconButton></Tooltip>
                                                <Tooltip title="削除"><IconButton aria-label={`${acc.name}を削除`} color="error" onClick={() => setDeleteTarget({ idx, account: acc })}><PersonRemoveRoundedIcon fontSize="small" /></IconButton></Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Box>
            </Section>

            <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>アカウント新規登録</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField label="氏名" value={addForm.name} onChange={(e) => handleAddChange('name', e.target.value)} required />
                        <TextField label="ユーザーID" value={addForm.userId} onChange={(e) => handleAddChange('userId', e.target.value)} required />
                        <TextField select label="所属部署" value={addForm.department} onChange={(e) => handleAddChange('department', e.target.value)} required>
                            {departments.map((dep) => <MenuItem key={dep.name} value={dep.name}>{dep.name}</MenuItem>)}
                        </TextField>
                        <TextField select label="役職" value={addForm.position} onChange={(e) => handleAddChange('position', e.target.value)} required disabled={!addForm.department}>
                            {getPositionsForDepartment(addForm.department).map((pos) => <MenuItem key={pos} value={pos}>{pos}</MenuItem>)}
                        </TextField>
                        <TextField label="メールアドレス" type="email" value={addForm.email} onChange={(e) => handleAddChange('email', e.target.value)} required />
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Typography variant="body2" sx={{ color: 'var(--ink-secondary)' }}>状態</Typography>
                            <Switch checked={addForm.status} onChange={(e) => handleAddChange('status', e.target.checked)} />
                            <StatusChip status={addForm.status ? 'active' : 'inactive'} size="sm" />
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button variant="text" color="inherit" startIcon={<CancelRoundedIcon />} onClick={() => setAddDialogOpen(false)}>キャンセル</Button>
                    <Button variant="contained" startIcon={<SaveRoundedIcon />} onClick={handleAdd}>登録</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={editIdx !== null} onClose={handleCancel} maxWidth="sm" fullWidth>
                <DialogTitle>アカウント編集</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField label="氏名" value={editAccount.name || ''} onChange={(e) => handleEditChange('name', e.target.value)} required />
                        <TextField label="ユーザーID" value={editAccount.userId || ''} onChange={(e) => handleEditChange('userId', e.target.value)} required />
                        <TextField select label="所属部署" value={editAccount.department || ''} onChange={(e) => handleEditChange('department', e.target.value)} required>
                            {departments.map((dep) => <MenuItem key={dep.name} value={dep.name}>{dep.name}</MenuItem>)}
                        </TextField>
                        <TextField select label="役職" value={editAccount.position || ''} onChange={(e) => handleEditChange('position', e.target.value)} required disabled={!editAccount.department}>
                            {getPositionsForDepartment(editAccount.department).map((pos) => <MenuItem key={pos} value={pos}>{pos}</MenuItem>)}
                        </TextField>
                        <TextField label="メールアドレス" type="email" value={editAccount.email || ''} onChange={(e) => handleEditChange('email', e.target.value)} required />
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Typography variant="body2" sx={{ color: 'var(--ink-secondary)' }}>状態</Typography>
                            <Switch checked={Boolean(editAccount.status)} onChange={(e) => handleEditChange('status', e.target.checked)} />
                            <StatusChip status={editAccount.status ? 'active' : 'inactive'} size="sm" />
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button variant="text" color="inherit" startIcon={<CancelRoundedIcon />} onClick={handleCancel}>キャンセル</Button>
                    <Button variant="contained" startIcon={<SaveRoundedIcon />} onClick={handleSave}>保存</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
            <AdminConfirmDialog
                open={Boolean(deleteTarget)}
                title="アカウントを削除しますか？"
                message={`${deleteTarget?.account?.name || ''} をアカウント一覧から削除します。元に戻すことはできません。`}
                confirmLabel="削除"
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
            />
        </PageScaffold>
    );
}

const Stat = ({ label, value, tone = 'primary' }) => {
    const tones = {
        primary: 'var(--accent-primary)',
        leaf: 'var(--accent-leaf)',
        slate: 'var(--ink-tertiary)',
    };
    return (
        <Box>
            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>{label}</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: tones[tone] }}>
                <span className="tabular-nums">{value}</span>件
            </Typography>
        </Box>
    );
};

export default AccountManagement;
