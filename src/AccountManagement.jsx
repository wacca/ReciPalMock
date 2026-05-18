import { useState, useEffect } from 'react';
import { Container, Typography, Box, Button, TextField, Paper, Snackbar, Alert, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Switch, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

function AccountManagement() {
    const [accounts, setAccounts] = useState([]);
    const [editIdx, setEditIdx] = useState(null);
    const [editAccount, setEditAccount] = useState({});
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState([]);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', userId: '', department: '', position: '', email: '', status: true });

    useEffect(() => {
        setDepartments(JSON.parse(localStorage.getItem('departments') || '[]'));
        setPositions(JSON.parse(localStorage.getItem('positions') || '[]'));
        // サンプルアカウント
        const sampleAccounts = [
            { name: '由仁場 技朗', userId: 'univatech@univa.tech', department: '開発部', position: '部長', email: 'univatech@univa.tech', status: true },
            { name: '油ニ 和平', userId: 'univapay@univa.tech', department: '営業部', position: '課長', email: 'univapay@univa.tech', status: true },
            { name: '由引 安人', userId: 'ubiast@univa.tech', department: '総務部', position: '一般社員', email: 'ubiast@univa.tech', status: false }
        ];
        const stored = JSON.parse(localStorage.getItem('accounts') || '[]');
        if (!stored || stored.length === 0) {
            setAccounts(sampleAccounts);
            localStorage.setItem('accounts', JSON.stringify(sampleAccounts));
        } else {
            setAccounts(stored);
        }
    }, []);

    const handleAddOpen = () => {
        setAddForm({ name: '', userId: '', department: '', position: '', email: '', status: true });
        setAddDialogOpen(true);
    };
    const handleAddClose = () => {
        setAddDialogOpen(false);
    };
    const handleAddChange = (field, value) => {
        setAddForm({ ...addForm, [field]: value });
    };
    const handleAdd = () => {
        if (!addForm.name || !addForm.userId || !addForm.department || !addForm.position || !addForm.email) return;
        const newAccount = { ...addForm };
        const newAccounts = [...accounts, newAccount];
        setAccounts(newAccounts);
        localStorage.setItem('accounts', JSON.stringify(newAccounts));
        setAddDialogOpen(false);
        setSnackbarOpen(true);
    };

    const handleDelete = (idx) => {
        const newAccounts = accounts.filter((_, i) => i !== idx);
        setAccounts(newAccounts);
        localStorage.setItem('accounts', JSON.stringify(newAccounts));
    };

    const handleEdit = (idx) => {
        setEditIdx(idx);
        setEditAccount({ ...accounts[idx] });
    };
    const handleEditChange = (field, value) => {
        setEditAccount({ ...editAccount, [field]: value });
    };
    const handleSave = (idx) => {
        const newAccounts = [...accounts];
        newAccounts[idx] = editAccount;
        setAccounts(newAccounts);
        localStorage.setItem('accounts', JSON.stringify(newAccounts));
        setEditIdx(null);
        setEditAccount({});
    };
    const handleCancel = () => {
        setEditIdx(null);
        setEditAccount({});
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    アカウント管理
                </Typography>
                <Box sx={{ mb: 2, textAlign: 'right' }}>
                    <Button variant="contained" color="primary" onClick={handleAddOpen}>新規登録</Button>
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
                        {accounts.map((acc, idx) => (
                            <TableRow key={idx}>
                                {editIdx === idx ? (
                                    <>
                                        <TableCell><TextField size="small" value={editAccount.name} onChange={e => handleEditChange('name', e.target.value)} /></TableCell>
                                        <TableCell><TextField size="small" value={editAccount.userId} onChange={e => handleEditChange('userId', e.target.value)} /></TableCell>
                                        <TableCell>
                                            <TextField select size="small" value={editAccount.department} onChange={e => handleEditChange('department', e.target.value)}>
                                                {departments.map((dep, i) => <MenuItem key={i} value={dep}>{dep}</MenuItem>)}
                                            </TextField>
                                        </TableCell>
                                        <TableCell>
                                            <TextField select size="small" value={editAccount.position} onChange={e => handleEditChange('position', e.target.value)}>
                                                {positions.map((pos, i) => <MenuItem key={i} value={pos}>{pos}</MenuItem>)}
                                            </TextField>
                                        </TableCell>
                                        <TableCell><TextField size="small" value={editAccount.email} onChange={e => handleEditChange('email', e.target.value)} /></TableCell>
                                        <TableCell><Switch checked={editAccount.status} onChange={e => handleEditChange('status', e.target.checked)} /></TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleSave(idx)}><SaveIcon /></IconButton>
                                            <IconButton onClick={handleCancel}><CancelIcon /></IconButton>
                                        </TableCell>
                                    </>
                                ) : (
                                    <>
                                        <TableCell>{acc.name}</TableCell>
                                        <TableCell>{acc.userId}</TableCell>
                                        <TableCell>{acc.department}</TableCell>
                                        <TableCell>{acc.position}</TableCell>
                                        <TableCell>{acc.email}</TableCell>
                                        <TableCell>{acc.status ? '有効' : '無効'}</TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleEdit(idx)}><EditIcon /></IconButton>
                                            <IconButton onClick={() => handleDelete(idx)}><DeleteIcon /></IconButton>
                                        </TableCell>
                                    </>
                                )}
                            </TableRow>
                        ))}
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
                            {departments.map((dep, idx) => <MenuItem key={idx} value={dep}>{dep}</MenuItem>)}
                        </TextField>
                        <TextField select label="役職" value={addForm.position} onChange={e => handleAddChange('position', e.target.value)} required>
                            {positions.map((pos, idx) => <MenuItem key={idx} value={pos}>{pos}</MenuItem>)}
                        </TextField>
                        <TextField label="メールアドレス" type="email" value={addForm.email} onChange={e => handleAddChange('email', e.target.value)} required />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography>有効</Typography>
                            <Switch checked={addForm.status} onChange={e => handleAddChange('status', e.target.checked)} />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleAddClose}>キャンセル</Button>
                    <Button variant="contained" onClick={handleAdd}>登録</Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
                <Alert severity="success" sx={{ width: '100%' }}>
                    アカウントを追加しました
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default AccountManagement;
