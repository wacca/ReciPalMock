import { useState, useEffect } from 'react';
import { Container, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Snackbar, Alert, TextField, Chip, FormControl, Select, MenuItem, IconButton, Tooltip } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
        const comment = (commentMap[id] || '').trim();
        const newData = data.map(row => (
            row.id === id
                ? {
                    ...row,
                    status,
                    remarks: status === '非承認' ? comment : '',
                    approvedBy: approver,
                    approvedAt: new Date().toISOString(),
                }
                : row
        ));
        persistData(newData);
        setCommentMap({ ...commentMap, [id]: '' });
        setSnackbar({ open: true, message: status === '承認済' ? '休暇申請を承認しました' : '休暇申請を非承認にしました' });
    };
    const approvalTargets = data.filter(row => (row.status || '申請中') === '申請中');

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Box className="pageHeaderRow">
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        休暇承認
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
                            {approvalTargets.map((row, idx) => {
                                const rejectionComment = (commentMap[row.id] || '').trim();
                                return (
                                    <TableRow key={row.id || idx}>
                                        <TableCell>{row.submittedAt ? new Date(row.submittedAt).toLocaleString() : '-'}</TableCell>
                                        <TableCell>{row.leaveType}</TableCell>
                                        <TableCell>{row.date}</TableCell>
                                        <TableCell>{row.reason}</TableCell>
                                        <TableCell><Chip size="small" label="申請中" color="primary" /></TableCell>
                                        <TableCell>
                                            <Box className="tableActionGroup">
                                                <Tooltip title="承認">
                                                    <IconButton aria-label="休暇申請を承認" color="primary" onClick={() => handleStatus(row.id, '承認済')}>
                                                        <CheckCircleIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={rejectionComment ? '非承認' : '非承認には承認者備考が必要です'}>
                                                    <span>
                                                        <IconButton
                                                            aria-label="休暇申請を非承認"
                                                            color="error"
                                                            disabled={!rejectionComment}
                                                            onClick={() => handleStatus(row.id, '非承認')}
                                                        >
                                                            <CancelIcon />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            </Box>
                                            <TextField
                                                label="承認者備考"
                                                size="small"
                                                value={commentMap[row.id] || ''}
                                                onChange={e => setCommentMap({ ...commentMap, [row.id]: e.target.value })}
                                                sx={{ mt: 1, minWidth: 240 }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity="success" sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default LeaveApprovals;
