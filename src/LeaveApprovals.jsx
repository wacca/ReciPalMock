import { useState, useEffect } from 'react';
import { Container, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, TextField, Chip, FormControl, Select, MenuItem } from '@mui/material';
import {
    loadLeaveApplications,
    saveLeaveApplications,
} from './leaveApplicationStore';

const approvers = [
    { value: 'user1', label: '油ニ 和平(univapay@univa.tech)' },
    { value: 'user2', label: '由引 安人(ubiast@univa.tech)' },
];

function LeaveApprovals() {
    const [data, setData] = useState([]);
    const [commentMap, setCommentMap] = useState({});
    const [selectedApprover, setSelectedApprover] = useState('user1');
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });

    useEffect(() => {
        setData(loadLeaveApplications());
    }, []);

    const persistData = (newData) => {
        setData(newData);
        saveLeaveApplications(newData);
    };

    const handleStatus = (id, status) => {
        const approver = approvers.find(item => item.value === selectedApprover)?.label || '';
        const newData = data.map(row => (
            row.id === id
                ? {
                    ...row,
                    status,
                    remarks: status === '非承認' ? commentMap[id] || '' : '',
                    approvedBy: approver,
                    approvedAt: new Date().toISOString(),
                }
                : row
        ));
        persistData(newData);
        setCommentMap({ ...commentMap, [id]: '' });
        setSnackbar({ open: true, message: status === '承認済' ? '勤怠（休暇）申請を承認しました' : '勤怠（休暇）申請を非承認にしました' });
    };
    const handleOpen = (row) => {
        setSelected(row);
        setOpen(true);
    };
    const handleClose = () => setOpen(false);

    const approvalTargets = data.filter(row => (row.status || '申請中') === '申請中');

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Box className="pageHeaderRow">
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        勤怠（休暇）承認
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        申請中の休暇申請のみを表示します。承認結果は申請済み一覧に反映されます。
                    </Typography>
                </Box>
                <FormControl size="small" sx={{ minWidth: 260 }}>
                    <Select value={selectedApprover} onChange={e => setSelectedApprover(e.target.value)}>
                        {approvers.map(approver => (
                            <MenuItem key={approver.value} value={approver.value}>{approver.label}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
            {approvalTargets.length === 0 ? (
                <Alert severity="info">承認待ち申請はありません。</Alert>
            ) : (
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>申請日</TableCell>
                                <TableCell>申請種別</TableCell>
                                <TableCell>日付</TableCell>
                                <TableCell>理由・備考</TableCell>
                                <TableCell>状態</TableCell>
                                <TableCell>操作</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {approvalTargets.map((row, idx) => (
                                <TableRow key={row.id || idx}>
                                    <TableCell>{row.submittedAt ? new Date(row.submittedAt).toLocaleString() : '-'}</TableCell>
                                    <TableCell>{row.leaveType}</TableCell>
                                    <TableCell>{row.date}</TableCell>
                                    <TableCell>{row.reason}</TableCell>
                                    <TableCell><Chip size="small" label="申請中" color="primary" /></TableCell>
                                    <TableCell>
                                        <Box className="tableActionGroup">
                                            <Button size="small" variant="outlined" onClick={() => handleOpen(row)}>詳細</Button>
                                            <Button size="small" color="primary" variant="contained" onClick={() => handleStatus(row.id, '承認済')}>承認</Button>
                                            <Button size="small" color="error" variant="contained" onClick={() => handleStatus(row.id, '非承認')}>非承認</Button>
                                        </Box>
                                        <TextField
                                            label="非承認時の備考"
                                            size="small"
                                            value={commentMap[row.id] || ''}
                                            onChange={e => setCommentMap({ ...commentMap, [row.id]: e.target.value })}
                                            sx={{ mt: 1, minWidth: 240 }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
                <DialogTitle>申請詳細</DialogTitle>
                <DialogContent>
                    {selected && (
                        <Box className="detailStack">
                            <Typography>申請種別: {selected.leaveType}</Typography>
                            <Typography>日付: {selected.date}</Typography>
                            <Typography>理由・備考: {selected.reason}</Typography>
                            <Typography>状態: {selected.status || '申請中'}</Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" onClick={handleClose}>閉じる</Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity="success" sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default LeaveApprovals;
