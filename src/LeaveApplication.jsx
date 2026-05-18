import { useState, useEffect } from 'react';
import { Container, Typography, Box, TextField, Button, MenuItem, FormControl, InputLabel, Select, Snackbar, Alert, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Chip } from '@mui/material';
import {
    LEAVE_TYPES,
    buildLeaveApplication,
    emptyLeaveDraft,
    loadLeaveApplications,
    loadLeaveDrafts,
    saveLeaveApplications,
    saveLeaveDrafts,
} from './leaveApplicationStore';

function LeaveApplication() {
    const [leaveList, setLeaveList] = useState([]); // 下書き一覧
    const [mode, setMode] = useState('list'); // 'list' or 'edit'
    const [editId, setEditId] = useState('new');
    const [leaveType, setLeaveType] = useState('有給休暇');
    const [date, setDate] = useState('');
    const [reason, setReason] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });

    useEffect(() => {
        loadLeaveApplications();
        setLeaveList(loadLeaveDrafts());
    }, []);

    const resetForm = () => {
        setEditId('new');
        const draft = emptyLeaveDraft();
        setLeaveType(draft.leaveType);
        setDate(draft.date);
        setReason(draft.reason);
    };

    const handleEdit = (id) => {
        const draft = leaveList.find(d => d.id === id);
        if (draft) {
            setEditId(id);
            setLeaveType(draft.leaveType);
            setDate(draft.date);
            setReason(draft.reason);
            setMode('edit');
        }
    };

    const handleDelete = (id) => {
        if (!window.confirm('この下書きを削除しますか？')) return;
        const newList = leaveList.filter(d => d.id !== id);
        setLeaveList(newList);
        saveLeaveDrafts(newList);
        setSnackbar({ open: true, message: '下書きを削除しました' });
    };

    const handleSaveDraft = () => {
        const id = editId === 'new' ? `leave_${Date.now()}` : editId;
        const newDraft = { id, leaveType, date, reason, status: '下書き', updated: new Date().toISOString() };
        let newList;
        if (editId === 'new') {
            newList = [...leaveList, newDraft];
        } else {
            newList = leaveList.map(d => d.id === id ? newDraft : d);
        }
        setLeaveList(newList);
        saveLeaveDrafts(newList);
        setEditId(id);
        setMode('list');
        setSnackbar({ open: true, message: '下書きを保存しました' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newApp = buildLeaveApplication({ editId, leaveType, date, reason });
        const prev = loadLeaveApplications();
        saveLeaveApplications([newApp, ...prev]);
        const newList = leaveList.filter(d => d.id !== newApp.id);
        setLeaveList(newList);
        saveLeaveDrafts(newList);
        setSnackbar({ open: true, message: '勤怠（休暇）申請を送信しました' });
        resetForm();
        setMode('list');
    };
    const handleNew = () => {
        resetForm();
        setMode('edit');
    };

    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            {mode === 'list' && (
                <Box>
                    <Box className="pageHeaderRow">
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>勤怠（休暇）下書き一覧</Typography>
                        <Box className="pageActionBar">
                            <Button variant="contained" color="primary" onClick={handleNew}>新規作成</Button>
                        </Box>
                    </Box>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ width: 180 }}>更新日</TableCell>
                                    <TableCell sx={{ width: 120 }}>申請種別</TableCell>
                                    <TableCell sx={{ width: 120 }}>日付</TableCell>
                                    <TableCell sx={{ width: 120 }}>操作</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {leaveList.length === 0 && (
                                    <TableRow><TableCell colSpan={4}>下書きはありません</TableCell></TableRow>
                                )}
                                {leaveList.map(draft => (
                                    <TableRow key={draft.id}>
                                        <TableCell>{draft.updated ? new Date(draft.updated).toLocaleString() : '-'}</TableCell>
                                        <TableCell>{draft.leaveType}</TableCell>
                                        <TableCell>{draft.date}</TableCell>
                                        <TableCell>
                                            <Box className="tableActionGroup">
                                                <Button size="small" variant="outlined" onClick={() => handleEdit(draft.id)}>編集</Button>
                                                <Button size="small" color="error" variant="outlined" onClick={() => handleDelete(draft.id)}>削除</Button>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
            {mode === 'edit' && (
                <Box>
                    <Box sx={{ my: 4 }}>
                        <Typography variant="h6" component="h1" gutterBottom>
                            勤怠（休暇）申請
                        </Typography>
                        <Box className="expenseSummaryStrip">
                            <Box>
                                <Typography variant="caption" color="text.secondary">申請種別</Typography>
                                <Typography variant="subtitle1">{leaveType}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">対象日</Typography>
                                <Typography variant="subtitle1">{date || '-'}</Typography>
                            </Box>
                            <Chip size="small" label="送信後は申請済・承認画面に反映" color="primary" variant="outlined" />
                        </Box>
                        <form onSubmit={handleSubmit}>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>申請種別</InputLabel>
                                <Select
                                    value={leaveType}
                                    label="申請種別"
                                    onChange={e => setLeaveType(e.target.value)}
                                    required
                                >
                                    {LEAVE_TYPES.map(type => (
                                        <MenuItem key={type} value={type}>{type}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                label="日付"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                required
                                fullWidth
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                label="理由・備考"
                                multiline
                                minRows={2}
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                fullWidth
                                sx={{ mb: 2 }}
                            />
                            <Box className="formActionBar">
                                <Button className="backAction" variant="outlined" onClick={() => setMode('list')}>一覧に戻る</Button>
                                <Button variant="outlined" color="primary" onClick={handleSaveDraft}>下書き保存</Button>
                                <Button type="submit" variant="contained" color="primary">申請</Button>
                            </Box>
                        </form>
                    </Box>
                </Box>
            )}
            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity="success" sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default LeaveApplication;
