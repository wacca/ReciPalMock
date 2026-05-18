import { useState, useEffect } from 'react';
import { Container, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Snackbar, Alert, Chip, MenuItem, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import ReplayIcon from '@mui/icons-material/Replay';
import SaveIcon from '@mui/icons-material/Save';
import {
    EXPENSE_CATEGORIES,
    formatYen,
    getExpenseApplicationStatus,
    getExpenseApplicationTotal,
    loadExpenseApplications,
    saveExpenseApplications,
} from './expenseApplicationStore';
import AdminConfirmDialog from './components/AdminConfirmDialog';

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
    const [cancelTargetIndex, setCancelTargetIndex] = useState(null);

    useEffect(() => {
        setData(loadExpenseApplications());
    }, []);

    const persistData = (newData) => {
        setData(newData);
        saveExpenseApplications(newData);
    };

    const handleCancelGroup = (groupIdx) => {
        setCancelTargetIndex(groupIdx);
    };

    const handleCancelGroupConfirm = () => {
        if (cancelTargetIndex === null) return;
        const newData = [...data];
        newData[cancelTargetIndex] = {
            ...newData[cancelTargetIndex],
            details: newData[cancelTargetIndex].details.map(row => ({ ...row, status: '取消' })),
        };
        persistData(newData);
        setCancelTargetIndex(null);
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
        if (editGroupIndexAll === null) return;
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
                        経費申請済一覧
                    </Typography>
                </Box>
                {data.length === 0 && (
                    <Typography color="text.secondary">申請済みの経費申請はありません。</Typography>
                )}
                {data.map((group, groupIdx) => {
                    const status = getExpenseApplicationStatus(group);
                    const isEditable = status === '非承認';
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
                                    承認者備考: {group.remarks}
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
                            <Box className="formActionBar rowActionBar">
                                <Tooltip title="変更">
                                    <span>
                                        <IconButton aria-label="経費申請を変更" color="primary" onClick={() => handleEditGroup(groupIdx)} disabled={!isEditable}>
                                            <EditIcon />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                                <Tooltip title="取消">
                                    <span>
                                        <IconButton aria-label="経費申請を取消" color="error" onClick={() => handleCancelGroup(groupIdx)} disabled={status !== '申請中'}>
                                            <CancelIcon />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                                {status === '非承認' && (
                                    <Tooltip title="再申請">
                                        <IconButton aria-label="経費申請を再申請" color="success" onClick={() => handleResubmitGroup(groupIdx)}>
                                            <ReplayIcon />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Box>
                        </Box>
                    );
                })}
            </Box>
            <Dialog open={editGroupIndexAll !== null} onClose={handleEditGroupCancel} maxWidth="lg" fullWidth className="expenseEditorDialog">
                <DialogTitle>経費申請を変更</DialogTitle>
                <DialogContent>
                    <TableContainer className="expenseEditDialogTable">
                        <Table size="small">
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
                                {editGroupRows.map((row, rowIdx) => (
                                    <TableRow key={`edit_${rowIdx}`}>
                                        <TableCell>
                                            <TextField type="date" size="small" value={row.date || ''} onChange={e => handleEditGroupRowChange(rowIdx, 'date', e.target.value)} InputLabelProps={{ shrink: true }} />
                                        </TableCell>
                                        <TableCell>
                                            <TextField size="small" value={row.description || ''} onChange={e => handleEditGroupRowChange(rowIdx, 'description', e.target.value)} />
                                        </TableCell>
                                        <TableCell>
                                            <TextField fullWidth size="small" value={row.destination || ''} onChange={e => handleEditGroupRowChange(rowIdx, 'destination', e.target.value)} />
                                        </TableCell>
                                        <TableCell>
                                            <TextField select size="small" value={row.category || ''} onChange={e => handleEditGroupRowChange(rowIdx, 'category', e.target.value)}>
                                                {EXPENSE_CATEGORIES.map(category => (
                                                    <MenuItem key={category} value={category}>{category}</MenuItem>
                                                ))}
                                            </TextField>
                                        </TableCell>
                                        <TableCell>
                                            <TextField type="number" size="small" value={row.amount || ''} onChange={e => handleEditGroupRowChange(rowIdx, 'amount', e.target.value)} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" color="inherit" startIcon={<CancelIcon />} onClick={handleEditGroupCancel}>キャンセル</Button>
                    <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleEditGroupSave}>保存</Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity="success" sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
            <AdminConfirmDialog
                open={cancelTargetIndex !== null}
                title="経費申請を取り消しますか？"
                message={cancelTargetIndex !== null ? `申請ID: ${data[cancelTargetIndex]?.applicationId || '-'} を取消状態にします。` : ''}
                confirmLabel="取消"
                confirmColor="warning"
                onCancel={() => setCancelTargetIndex(null)}
                onConfirm={handleCancelGroupConfirm}
            />
        </Container>
    );
}

export default SubmittedApplications;
