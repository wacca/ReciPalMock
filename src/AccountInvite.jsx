import { useState, useEffect } from 'react';
import { Container, Typography, Box, Button, TextField, Paper, Snackbar, Alert, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Switch } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

function AccountManagement() {
    const [accounts, setAccounts] = useState([]);
    const [editIdx, setEditIdx] = useState(null);
    const [editAccount, setEditAccount] = useState({});
    const [name, setName] = useState('');
    const [userId, setUserId] = useState('');
    const [department, setDepartment] = useState('');
    const [position, setPosition] = useState('');
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState(true);
    const [open, setOpen] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState([]);

    useEffect(() => {
        setDepartments(JSON.parse(localStorage.getItem('departments') || '[]'));
        setPositions(JSON.parse(localStorage.getItem('positions') || '[]'));
        setAccounts(JSON.parse(localStorage.getItem('accounts') || '[]'));
    }, []);

    const handleAdd = () => {
        if (!name || !userId || !department || !position || !email) return;
        const newAccount = { name, userId, department, position, email, status };
        const newAccounts = [...accounts, newAccount];
        setAccounts(newAccounts);
        localStorage.setItem('accounts', JSON.stringify(newAccounts));
        setName(''); setUserId(''); setDepartment(''); setPosition(''); setEmail(''); setStatus(true);
        setOpen(true);
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
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                    <TextField label="氏名" value={name} onChange={e => setName(e.target.value)} required />
                    <TextField label="ユーザーID" value={userId} onChange={e => setUserId(e.target.value)} required />
                    <TextField select label="所属部署" value={department} onChange={e => setDepartment(e.target.value)} required>
                        {departments.map((dep, idx) => <MenuItem key={idx} value={dep}>{dep}</MenuItem>)}
                    </TextField>
                    <TextField select label="役職" value={position} onChange={e => setPosition(e.target.value)} required>
                        {positions.map((pos, idx) => <MenuItem key={idx} value={pos}>{pos}</MenuItem>)}
                    </TextField>
                    <TextField label="メールアドレス" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography>有効</Typography>
                        <Switch checked={status} onChange={e => setStatus(e.target.checked)} />
                    </Box>
                    <Button variant="contained" color="primary" onClick={handleAdd}>追加</Button>
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
            <Snackbar open={open} autoHideDuration={3000} onClose={() => setOpen(false)}>
                <Alert severity="success" sx={{ width: '100%' }}>
                    アカウントを追加しました
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default AccountManagement;
