import { useState, useEffect } from 'react';
import { Container, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, MenuItem, Select, FormControl, TextField, Snackbar, Alert, Chip } from '@mui/material';
import {
    formatYen,
    getExpenseApplicationStatus,
    getExpenseApplicationTotal,
    loadExpenseApplications,
    saveExpenseApplications,
} from './expenseApplicationStore';

const approvers = [
    { value: 'user1', label: '由引 安人(ubiast@univa.tech)' },
    { value: 'user2', label: '油ニ 和平(univapay@univa.tech)' },
];

function Approvals() {
    const [data, setData] = useState([]);
    const [commentMap, setCommentMap] = useState({});
    const [selectedApprover, setSelectedApprover] = useState('user1');
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });

    useEffect(() => {
        setData(loadExpenseApplications());
    }, []);

    const persistData = (newData) => {
        setData(newData);
        saveExpenseApplications(newData);
    };

    const handleGroupStatus = (groupIdx, newStatus) => {
        const target = data[groupIdx];
        const comment = commentMap[target.applicationId] || '';
        const newData = [...data];
        newData[groupIdx] = {
            ...target,
            remarks: newStatus === '非承認' ? comment : '',
            approvedBy: approvers.find(approver => approver.value === selectedApprover)?.label,
            approvedAt: new Date().toISOString(),
            details: target.details.map(row => ({ ...row, status: newStatus })),
        };
        persistData(newData);
        setCommentMap({ ...commentMap, [target.applicationId]: '' });
        setSnackbar({ open: true, message: newStatus === '承認済' ? '申請を承認しました' : '申請を非承認にしました' });
    };

    const approvalTargets = data.filter(application => getExpenseApplicationStatus(application) === '申請中');

    return (
        <Container maxWidth="lg" sx={{ textAlign: 'left' }}>
            <Box sx={{ my: 4 }}>
                <Box className="pageHeaderRow">
                    <Box>
                        <Typography variant="h6" component="div">
                            経費承認
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            申請中の経費のみを表示します。承認結果は申請済画面にも反映されます。
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
                {approvalTargets.length === 0 && (
                    <Alert severity="info">承認待ちの経費申請はありません。</Alert>
                )}
                {approvalTargets.map((group) => {
                    const groupIdx = data.findIndex(item => item.applicationId === group.applicationId);
                    return (
                        <Box key={group.applicationId} className="applicationGroup">
                            <Box className="sectionHeaderRow">
                                <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                        申請ID: {group.applicationId}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        申請日: {group.applicationDate} / 支払種別: {group.paymentType || '-'} / 合計: {formatYen(getExpenseApplicationTotal(group))}
                                    </Typography>
                                </Box>
                                <Chip label="申請中" color="primary" />
                            </Box>
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ width: 150 }}>日付</TableCell>
                                            <TableCell sx={{ width: 220 }}>内容</TableCell>
                                            <TableCell>用途・行き先</TableCell>
                                            <TableCell sx={{ width: 180 }}>費目</TableCell>
                                            <TableCell sx={{ width: 140 }}>金額</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {group.details.map((row, rowIdx) => (
                                            <TableRow key={`${group.applicationId}_${rowIdx}`}>
                                                <TableCell>{row.date}</TableCell>
                                                <TableCell>{row.description}</TableCell>
                                                <TableCell>{row.destination}</TableCell>
                                                <TableCell>{row.category}</TableCell>
                                                <TableCell>{formatYen(row.amount)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <Box className="formActionBar">
                                <TextField
                                    label="非承認時の備考"
                                    size="small"
                                    value={commentMap[group.applicationId] || ''}
                                    onChange={e => setCommentMap({ ...commentMap, [group.applicationId]: e.target.value })}
                                    sx={{ minWidth: 320 }}
                                />
                                <Box className="pageActionBar">
                                    <Button variant="contained" color="primary" onClick={() => handleGroupStatus(groupIdx, '承認済')}>
                                        承認
                                    </Button>
                                    <Button variant="contained" color="error" onClick={() => handleGroupStatus(groupIdx, '非承認')}>
                                        非承認
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    );
                })}
            </Box>
            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity="success" sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default Approvals;
