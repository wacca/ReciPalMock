import { useState, useEffect } from 'react';
import { Container, Typography, Box, Button, TextField, Paper, Snackbar, Alert, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Switch, Dialog, DialogTitle, DialogContent, DialogActions, Chip, InputAdornment, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import AdminConfirmDialog from './components/AdminConfirmDialog';

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
            ? department.positions
                .map(position => (typeof position === 'string' ? { name: position } : position))
                .filter(position => position?.name)
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
        // モックなので壊れたローカルデータは初期データで復旧する
    }
    localStorage.setItem('accounts', JSON.stringify(SAMPLE_ACCOUNTS));
    return SAMPLE_ACCOUNTS;
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function AccountManagement() {
    const [accounts, setAccounts] = useState([]);
    const [editIdx, setEditIdx] = useState(null);
    const [editAccount, setEditAccount] = useState({});
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
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

    const showSnackbar = (message, severity = 'success') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const getPositionsForDepartment = (departmentName) => (
        departments.find(department => department.name === departmentName)?.positions?.map(position => position.name) || []
    );

    const validateAccount = (account, currentIdx = null) => {
        if (!account.name || !account.userId || !account.department || !account.position || !account.email) {
            return '必須項目を入力してください';
        }
        if (!isValidEmail(account.email)) {
            return 'メールアドレスの形式を確認してください';
        }
        const duplicateUserId = accounts.some((item, idx) => idx !== currentIdx && item.userId === account.userId);
        if (duplicateUserId) {
            return '同じユーザーIDのアカウントが既に存在します';
        }
        const duplicateEmail = accounts.some((item, idx) => idx !== currentIdx && item.email === account.email);
        if (duplicateEmail) {
            return '同じメールアドレスのアカウントが既に存在します';
        }
        return '';
    };

    const handleAddOpen = () => {
        setAddForm(emptyAccount);
        setAddDialogOpen(true);
    };
    const handleAddClose = () => {
        setAddDialogOpen(false);
    };
    const handleAddChange = (field, value) => {
        setAddForm({
            ...addForm,
            [field]: value,
            ...(field === 'department' ? { position: '' } : {}),
        });
    };
    const handleAdd = () => {
        const validationMessage = validateAccount(addForm);
        if (validationMessage) {
            showSnackbar(validationMessage, 'warning');
            return;
        }
        const newAccount = { ...addForm };
        const newAccounts = [...accounts, newAccount];
        setAccounts(newAccounts);
        localStorage.setItem('accounts', JSON.stringify(newAccounts));
        setAddDialogOpen(false);
        showSnackbar('アカウントを追加しました');
    };

    const handleDeleteRequest = (idx) => {
        setDeleteTarget({ idx, account: accounts[idx] });
    };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        const newAccounts = accounts.filter((_, i) => i !== deleteTarget.idx);
        setAccounts(newAccounts);
        localStorage.setItem('accounts', JSON.stringify(newAccounts));
        setDeleteTarget(null);
        showSnackbar('アカウントを削除しました');
    };

    const handleEdit = (idx) => {
        setEditIdx(idx);
        setEditAccount({ ...accounts[idx] });
    };
    const handleEditChange = (field, value) => {
        setEditAccount({
            ...editAccount,
            [field]: value,
            ...(field === 'department' ? { position: '' } : {}),
        });
    };
    const handleSave = (idx) => {
        const validationMessage = validateAccount(editAccount, idx);
        if (validationMessage) {
            showSnackbar(validationMessage, 'warning');
            return;
        }
        const newAccounts = [...accounts];
        newAccounts[idx] = editAccount;
        setAccounts(newAccounts);
        localStorage.setItem('accounts', JSON.stringify(newAccounts));
        setEditIdx(null);
        setEditAccount({});
        showSnackbar('アカウントを保存しました');
    };
    const handleCancel = () => {
        setEditIdx(null);
        setEditAccount({});
    };

    const filteredAccounts = accounts.filter(account => {
        const keyword = searchText.trim().toLowerCase();
        const matchesKeyword = !keyword || [account.name, account.userId, account.department, account.position, account.email]
            .some(value => String(value || '').toLowerCase().includes(keyword));
        const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? account.status : !account.status);
        return matchesKeyword && matchesStatus;
    });

    const activeCount = accounts.filter(account => account.status).length;

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper sx={{ p: 3, mb: 4 }}>
                <Box className="pageHeaderRow">
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            アカウント管理
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            利用者、所属部署、役職、有効状態を管理します。
                        </Typography>
                    </Box>
                    <Box className="pageActionBar">
                        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleAddOpen}>新規追加</Button>
                    </Box>
                </Box>
                <Box className="expenseSummaryStrip">
                    <Box>
                        <Typography variant="caption" color="text.secondary">登録数</Typography>
                        <Typography variant="subtitle1">{accounts.length}件</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">有効</Typography>
                        <Typography variant="subtitle1">{activeCount}件</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">無効</Typography>
                        <Typography variant="subtitle1">{accounts.length - activeCount}件</Typography>
                    </Box>
                </Box>
                <Box className="accountToolbar">
                    <TextField
                        size="small"
                        label="検索"
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
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
                    <TextField
                        select
                        size="small"
                        label="状態"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        sx={{ width: 160 }}
                    >
                        <MenuItem value="all">すべて</MenuItem>
                        <MenuItem value="active">有効のみ</MenuItem>
                        <MenuItem value="inactive">無効のみ</MenuItem>
                    </TextField>
                </Box>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>氏名</TableCell>
                            <TableCell>ユーザーID</TableCell>
                            <TableCell>所属部署</TableCell>
                            <TableCell>役職</TableCell>
                            <TableCell>メールアドレス</TableCell>
                            <TableCell>有効</TableCell>
                            <TableCell>操作</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredAccounts.length === 0 && (
                            <TableRow><TableCell colSpan={7}>該当するアカウントはありません</TableCell></TableRow>
                        )}
                        {filteredAccounts.map((acc) => {
                            const accountIdx = accounts.findIndex(account => account.userId === acc.userId);
                            return (
                            <TableRow key={acc.userId}>
                                {editIdx === accountIdx ? (
                                    <>
                                        <TableCell><TextField size="small" value={editAccount.name} onChange={e => handleEditChange('name', e.target.value)} /></TableCell>
                                        <TableCell><TextField size="small" value={editAccount.userId} onChange={e => handleEditChange('userId', e.target.value)} /></TableCell>
                                        <TableCell>
                                            <TextField select size="small" value={editAccount.department} onChange={e => handleEditChange('department', e.target.value)}>
                                                {departments.map((dep) => <MenuItem key={dep.name} value={dep.name}>{dep.name}</MenuItem>)}
                                            </TextField>
                                        </TableCell>
                                        <TableCell>
                                            <TextField select size="small" value={editAccount.position} onChange={e => handleEditChange('position', e.target.value)} disabled={!editAccount.department}>
                                                {getPositionsForDepartment(editAccount.department).map((pos) => <MenuItem key={pos} value={pos}>{pos}</MenuItem>)}
                                            </TextField>
                                        </TableCell>
                                        <TableCell><TextField size="small" value={editAccount.email} onChange={e => handleEditChange('email', e.target.value)} /></TableCell>
                                        <TableCell><Switch checked={editAccount.status} onChange={e => handleEditChange('status', e.target.checked)} /></TableCell>
                                        <TableCell>
                                            <Box className="tableActionGroup">
                                                <Tooltip title="保存">
                                                    <IconButton aria-label="保存" color="primary" onClick={() => handleSave(accountIdx)}><SaveIcon /></IconButton>
                                                </Tooltip>
                                                <Tooltip title="キャンセル">
                                                    <IconButton aria-label="キャンセル" onClick={handleCancel}><CancelIcon /></IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </>
                                ) : (
                                    <>
                                        <TableCell>{acc.name}</TableCell>
                                        <TableCell>{acc.userId}</TableCell>
                                        <TableCell>{acc.department}</TableCell>
                                        <TableCell>{acc.position}</TableCell>
                                        <TableCell>{acc.email}</TableCell>
                                        <TableCell>
                                            <Chip size="small" label={acc.status ? '有効' : '無効'} color={acc.status ? 'primary' : 'default'} variant={acc.status ? 'filled' : 'outlined'} />
                                        </TableCell>
                                        <TableCell>
                                            <Box className="tableActionGroup">
                                                <Tooltip title="編集">
                                                    <IconButton aria-label={`${acc.name}を編集`} onClick={() => handleEdit(accountIdx)}><EditIcon /></IconButton>
                                                </Tooltip>
                                                <Tooltip title="削除">
                                                    <IconButton aria-label={`${acc.name}を削除`} color="error" onClick={() => handleDeleteRequest(accountIdx)}><DeleteIcon /></IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </>
                                )}
                            </TableRow>
                        )})}
                    </TableBody>
                </Table>
            </Paper>
            <Dialog open={addDialogOpen} onClose={handleAddClose} maxWidth="sm" fullWidth>
                <DialogTitle>アカウント新規登録</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField label="氏名" value={addForm.name} onChange={e => handleAddChange('name', e.target.value)} required />
                        <TextField label="ユーザーID" value={addForm.userId} onChange={e => handleAddChange('userId', e.target.value)} required />
                        <TextField select label="所属部署" value={addForm.department} onChange={e => handleAddChange('department', e.target.value)} required>
                            {departments.map((dep) => <MenuItem key={dep.name} value={dep.name}>{dep.name}</MenuItem>)}
                        </TextField>
                        <TextField select label="役職" value={addForm.position} onChange={e => handleAddChange('position', e.target.value)} required disabled={!addForm.department}>
                            {getPositionsForDepartment(addForm.department).map((pos) => <MenuItem key={pos} value={pos}>{pos}</MenuItem>)}
                        </TextField>
                        <TextField label="メールアドレス" type="email" value={addForm.email} onChange={e => handleAddChange('email', e.target.value)} required />
                        <Box className="inlineActionGroup">
                            <Typography>状態</Typography>
                            <Switch checked={addForm.status} onChange={e => handleAddChange('status', e.target.checked)} />
                            <Chip size="small" label={addForm.status ? '有効' : '無効'} color={addForm.status ? 'primary' : 'default'} variant={addForm.status ? 'filled' : 'outlined'} />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" color="inherit" onClick={handleAddClose}>キャンセル</Button>
                    <Button variant="contained" onClick={handleAdd}>登録</Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
                <Alert severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
            <AdminConfirmDialog
                open={Boolean(deleteTarget)}
                title="アカウントを削除しますか？"
                message={`${deleteTarget?.account?.name || ''} をアカウント一覧から削除します。`}
                confirmLabel="削除"
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
            />
        </Container>
    );
}

export default AccountManagement;
