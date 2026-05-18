import { useState, useEffect } from 'react';
import { Container, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Snackbar, Alert, Chip, MenuItem } from '@mui/material';
import {
    EXPENSE_CATEGORIES,
    formatYen,
    getExpenseApplicationStatus,
    getExpenseApplicationTotal,
    loadExpenseApplications,
    saveExpenseApplications,
} from './expenseApplicationStore';

const statusColor = {
    申請中: 'primary',
    承認済: 'success',
    非承認: 'error',
    取消: 'default',
    明細なし: 'default',
};

function SubmittedApplications() {
    const [data, setData] = useState([]);
    const [editGroupIndexAll, setEditGroupIndexAll] = useState(null);
    const [editGroupRows, setEditGroupRows] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });

    useEffect(() => {
        setData(loadExpenseApplications());
    }, []);

    const persistData = (newData) => {
        setData(newData);
        saveExpenseApplications(newData);
    };

    const handleCancelGroup = (groupIdx) => {
        if (!window.confirm('この申請を取り消しますか？')) return;
        const newData = [...data];
        newData[groupIdx] = {
            ...newData[groupIdx],
            details: newData[groupIdx].details.map(row => ({ ...row, status: '取消' })),
        };
        persistData(newData);
        setSnackbar({ open: true, message: '申請を取り消しました' });
    };

    const handleEditGroup = (groupIdx) => {
        setEditGroupIndexAll(groupIdx);
        setEditGroupRows(data[groupIdx].details.map(row => ({ ...row })));
    };

    const handleEditGroupRowChange = (rowIdx, field, value) => {
        const newRows = [...editGroupRows];
        newRows[rowIdx] = { ...newRows[rowIdx], [field]: value };
        setEditGroupRows(newRows);
    };

    const handleEditGroupSave = () => {
        const newData = [...data];
        newData[editGroupIndexAll] = {
            ...newData[editGroupIndexAll],
            details: editGroupRows.map(row => ({ ...row, amount: Number(row.amount || 0) })),
        };
        persistData(newData);
        setEditGroupIndexAll(null);
        setEditGroupRows([]);
        setSnackbar({ open: true, message: '申請内容を保存しました' });
    };

    const handleEditGroupCancel = () => {
        setEditGroupIndexAll(null);
        setEditGroupRows([]);
    };

    const handleResubmitGroup = (groupIdx) => {
        const newData = [...data];
        newData[groupIdx] = {
            ...newData[groupIdx],
            remarks: '',
            details: newData[groupIdx].details.map(row => ({ ...row, status: '申請中' })),
        };
        persistData(newData);
        setSnackbar({ open: true, message: '再申請しました' });
    };

    return (
        <Container maxWidth="lg" sx={{ textAlign: 'left' }}>
            <Box sx={{ my: 4 }}>
                <Box className="pageHeaderRow">
                    <Typography variant="h6" component="div">
                        申請済
                    </Typography>
                </Box>
                {data.length === 0 && (
                    <Typography color="text.secondary">申請済みの経費申請はありません。</Typography>
                )}
                {data.map((group, groupIdx) => {
                    const status = getExpenseApplicationStatus(group);
                    const isEditable = status === '申請中' || status === '非承認';
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
                                <Chip label={status} color={statusColor[status]} variant={status === '申請中' ? 'filled' : 'outlined'} />
                            </Box>
                            {status === '非承認' && group.remarks && (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    備考: {group.remarks}
                                </Alert>
                            )}
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
                                                <TableCell>
                                                    {editGroupIndexAll === groupIdx ? (
                                                        <TextField type="date" size="small" value={editGroupRows[rowIdx]?.date || ''} onChange={e => handleEditGroupRowChange(rowIdx, 'date', e.target.value)} InputLabelProps={{ shrink: true }} />
                                                    ) : (
                                                        row.date
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {editGroupIndexAll === groupIdx ? (
                                                        <TextField size="small" value={editGroupRows[rowIdx]?.description || ''} onChange={e => handleEditGroupRowChange(rowIdx, 'description', e.target.value)} />
                                                    ) : (
                                                        row.description
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {editGroupIndexAll === groupIdx ? (
                                                        <TextField fullWidth size="small" value={editGroupRows[rowIdx]?.destination || ''} onChange={e => handleEditGroupRowChange(rowIdx, 'destination', e.target.value)} />
                                                    ) : (
                                                        row.destination
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {editGroupIndexAll === groupIdx ? (
                                                        <TextField select size="small" value={editGroupRows[rowIdx]?.category || ''} onChange={e => handleEditGroupRowChange(rowIdx, 'category', e.target.value)}>
                                                            {EXPENSE_CATEGORIES.map(category => (
                                                                <MenuItem key={category} value={category}>{category}</MenuItem>
                                                            ))}
                                                        </TextField>
                                                    ) : (
                                                        row.category
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {editGroupIndexAll === groupIdx ? (
                                                        <TextField type="number" size="small" value={editGroupRows[rowIdx]?.amount || ''} onChange={e => handleEditGroupRowChange(rowIdx, 'amount', e.target.value)} />
                                                    ) : (
                                                        formatYen(row.amount)
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <Box className="formActionBar">
                                <Button variant="outlined" color="primary" onClick={() => handleEditGroup(groupIdx)} disabled={!isEditable || editGroupIndexAll === groupIdx}>
                                    変更
                                </Button>
                                <Button variant="outlined" color="error" onClick={() => handleCancelGroup(groupIdx)} disabled={status !== '申請中'}>
                                    取消
                                </Button>
                                {status === '非承認' && (
                                    <Button variant="contained" color="success" onClick={() => handleResubmitGroup(groupIdx)}>
                                        再申請
                                    </Button>
                                )}
                            </Box>
                            {editGroupIndexAll === groupIdx && (
                                <Box className="formActionBar">
                                    <Button className="backAction" variant="outlined" onClick={handleEditGroupCancel}>キャンセル</Button>
                                    <Button variant="contained" color="primary" onClick={handleEditGroupSave}>保存</Button>
                                </Box>
                            )}
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

export default SubmittedApplications;
