import { useState, useEffect } from 'react';
import { Container, Typography, Box, TextField, Button, MenuItem, FormControl, InputLabel, Select, Dialog, DialogTitle, DialogContent, DialogActions, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';

const LEAVE_TYPES = [
    '有給休暇',
    '特別休暇',
    '欠勤',
    '遅刻',
    '早退',
    'その他'
];

function LeaveApplication() {
    const [leaveList, setLeaveList] = useState([]); // 下書き一覧
    const [mode, setMode] = useState('list'); // 'list' or 'edit'
    const [editId, setEditId] = useState('new');
    const [leaveType, setLeaveType] = useState('有給休暇');
    const [date, setDate] = useState('');
    const [reason, setReason] = useState('');
    const [open, setOpen] = useState(false);

    useEffect(() => {
        // サンプルデータがなければ初期投入
        if (!localStorage.getItem('leaveApplications')) {
            const sample = [
                {
                    id: 'leave_20240601',
                    leaveType: '有給休暇',
                    date: '2024-06-10',
                    reason: '私用のため',
                    status: '申請中',
                    submittedAt: '2024-06-01T09:00:00.000Z',
                },
                {
                    id: 'leave_20240602',
                    leaveType: '遅刻',
                    date: '2024-06-05',
                    reason: '通院のため',
                    status: '承認済',
                    submittedAt: '2024-06-02T10:00:00.000Z',
                },
                {
                    id: 'leave_20240603',
                    leaveType: '早退',
                    date: '2024-06-03',
                    reason: '家庭の事情',
                    status: '非承認',
                    submittedAt: '2024-06-03T11:00:00.000Z',
                }
            ];
            localStorage.setItem('leaveApplications', JSON.stringify(sample));
        }
        // 下書きの初期化
        const saved = JSON.parse(localStorage.getItem('leaveDrafts') || '[]');
        setLeaveList(saved);
    }, []);

    const resetForm = () => {
        setEditId('new');
        setLeaveType('有給休暇');
        setDate('');
        setReason('');
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
        const newList = leaveList.filter(d => d.id !== id);
        setLeaveList(newList);
        localStorage.setItem('leaveDrafts', JSON.stringify(newList));
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
        localStorage.setItem('leaveDrafts', JSON.stringify(newList));
        setEditId(id);
        setMode('list');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // 申請としてleaveApplicationsに保存
        const newApp = {
            id: editId === 'new' ? `leave_${Date.now()}` : editId,
            leaveType,
            date,
            reason,
            status: '申請中',
            submittedAt: new Date().toISOString(),
        };
        const prev = JSON.parse(localStorage.getItem('leaveApplications') || '[]');
        localStorage.setItem('leaveApplications', JSON.stringify([...prev, newApp]));
        // 下書きから削除
        const newList = leaveList.filter(d => d.id !== newApp.id);
        setLeaveList(newList);
        localStorage.setItem('leaveDrafts', JSON.stringify(newList));
        setOpen(true);
        resetForm();
        setMode('list');
    };
    const handleClose = () => setOpen(false);
    const handleNew = () => {
        resetForm();
        setMode('edit');
    };

    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            {mode === 'list' && (
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>勤怠（休暇）下書き一覧</Typography>
                    <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={handleNew}>新規作成</Button>
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
                                            <Button size="small" variant="outlined" onClick={() => handleEdit(draft.id)}>編集</Button>
                                            <Button size="small" color="error" variant="outlined" sx={{ ml: 1 }} onClick={() => handleDelete(draft.id)}>削除</Button>
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
                    <Button variant="text" sx={{ mb: 2 }} onClick={() => setMode('list')}>← 一覧に戻る</Button>
                    <Box sx={{ my: 4 }}>
                        <Typography variant="h6" component="h1" gutterBottom>
                            勤怠（休暇）申請
                        </Typography>
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
                            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mb: 2 }}>
                                申請
                            </Button>
                            <Button variant="outlined" color="primary" onClick={handleSaveDraft} fullWidth>
                                下書き保存
                            </Button>
                        </form>
                    </Box>
                </Box>
            )}
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>申請完了</DialogTitle>
                <DialogContent>
                    <Typography>申請を受け付けました。</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>閉じる</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default LeaveApplication;
