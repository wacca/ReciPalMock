import { useState, useEffect } from 'react';
import { Container, Typography, Box, Button, Dialog, DialogContent, DialogTitle, DialogActions, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Snackbar, Alert, Chip, IconButton, Tooltip, TextField } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import ReplayIcon from '@mui/icons-material/Replay';
import SaveIcon from '@mui/icons-material/Save';
import {
    loadLeaveApplications,
    saveLeaveApplications,
} from './leaveApplicationStore';
import AdminConfirmDialog from './components/AdminConfirmDialog';

const statusColor = {
    申請中: 'primary',
    承認済: 'success',
    非承認: 'error',
    取消: 'default',
};

function LeaveSubmitted() {
    const [submitted, setSubmitted] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    const [cancelTargetId, setCancelTargetId] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editTargetId, setEditTargetId] = useState(null);
    const [editReason, setEditReason] = useState('');

    useEffect(() => {
        setSubmitted(loadLeaveApplications());
    }, []);

    const persistSubmitted = (newList) => {
        setSubmitted(newList);
        saveLeaveApplications(newList);
    };

    const handleEditOpen = (row) => {
        setEditTargetId(row.id);
        setEditReason(row.reason || '');
        setEditDialogOpen(true);
    };

    const handleEditClose = () => {
        setEditDialogOpen(false);
        setEditTargetId(null);
        setEditReason('');
    };

    const handleEditSave = () => {
        if (!editTargetId) return;
        const newList = submitted.map(row => (
            row.id === editTargetId ? { ...row, reason: editReason } : row
        ));
        persistSubmitted(newList);
        handleEditClose();
        setSnackbar({ open: true, message: '休暇申請の理由・備考を保存しました' });
    };

    const handleCancel = (id) => {
        setCancelTargetId(id);
    };

    const handleCancelConfirm = () => {
        if (!cancelTargetId) return;
        const newList = submitted.map(row => (
            row.id === cancelTargetId ? { ...row, status: '取消', remarks: '' } : row
        ));
        persistSubmitted(newList);
        setCancelTargetId(null);
        setSnackbar({ open: true, message: '休暇申請を取り消しました' });
    };

    const handleResubmit = (id) => {
        const newList = submitted.map(row => (
            row.id === id ? { ...row, status: '申請中', remarks: '', submittedAt: new Date().toISOString() } : row
        ));
        persistSubmitted(newList);
        setSnackbar({ open: true, message: '休暇申請を再申請しました' });
    };

    const statusCounts = submitted.reduce((counts, row) => {
        const status = row.status || '申請中';
        return { ...counts, [status]: (counts[status] || 0) + 1 };
    }, {});

    return (
        <Container maxWidth="lg" sx={{ textAlign: 'left' }}>
            <Box sx={{ my: 4 }}>
                <Box className="pageHeaderRow">
                    <Typography variant="h6" component="div">
                        休暇申請済一覧
                    </Typography>
                </Box>
                <Box className="applicationGroup">
                    <Box className="sectionHeaderRow">
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                申請履歴
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                休暇申請を一覧で確認します。申請中は取消、非承認は再申請できます。
                            </Typography>
                        </Box>
                    </Box>
                    <Box className="expenseSummaryStrip">
                        <Box>
                            <Typography variant="caption" color="text.secondary">申請数</Typography>
                            <Typography variant="subtitle1">{submitted.length}件</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">申請中</Typography>
                            <Typography variant="subtitle1">{statusCounts['申請中'] || 0}件</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">承認済</Typography>
                            <Typography variant="subtitle1">{statusCounts['承認済'] || 0}件</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">非承認</Typography>
                            <Typography variant="subtitle1">{statusCounts['非承認'] || 0}件</Typography>
                        </Box>
                    </Box>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>申請日</TableCell>
                                    <TableCell>申請種別</TableCell>
                                    <TableCell>日付</TableCell>
                                    <TableCell>理由・備考</TableCell>
                                    <TableCell>承認者備考</TableCell>
                                    <TableCell>状態</TableCell>
                                    <TableCell>操作</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {submitted.length === 0 && (
                                    <TableRow><TableCell colSpan={7}>申請履歴がありません</TableCell></TableRow>
                                )}
                                {submitted.map((row, idx) => (
                                    <TableRow key={row.id || idx}>
                                        <TableCell>{row.submittedAt ? new Date(row.submittedAt).toLocaleString() : '-'}</TableCell>
                                        <TableCell>{row.leaveType}</TableCell>
                                        <TableCell>{row.date}</TableCell>
                                        <TableCell>{row.reason || '-'}</TableCell>
                                        <TableCell>{(row.status || '申請中') === '非承認' ? row.remarks || '-' : '-'}</TableCell>
                                        <TableCell>
                                            <Chip size="small" label={row.status || '申請中'} color={statusColor[row.status || '申請中']} variant={(row.status || '申請中') === '申請中' ? 'filled' : 'outlined'} />
                                        </TableCell>
                                        <TableCell>
                                            <Box className="tableActionGroup">
                                                <Tooltip title="取消">
                                                    <span>
                                                        <IconButton aria-label="休暇申請を取消" color="error" onClick={() => handleCancel(row.id)} disabled={(row.status || '申請中') !== '申請中'}>
                                                            <CancelIcon />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                {(row.status || '申請中') === '非承認' && (
                                                    <>
                                                        <Tooltip title="編集">
                                                            <IconButton aria-label="休暇申請の理由・備考を編集" color="primary" onClick={() => handleEditOpen(row)}>
                                                                <EditIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="再申請">
                                                            <IconButton aria-label="休暇申請を再申請" color="success" onClick={() => handleResubmit(row.id)}>
                                                                <ReplayIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Box>
            <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
                <DialogTitle>理由・備考を編集</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        multiline
                        minRows={3}
                        label="理由・備考"
                        value={editReason}
                        onChange={event => setEditReason(event.target.value)}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" color="inherit" startIcon={<CloseIcon />} onClick={handleEditClose}>
                        キャンセル
                    </Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleEditSave}>
                        保存
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity="success" sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
            <AdminConfirmDialog
                open={Boolean(cancelTargetId)}
                title="休暇申請を取り消しますか？"
                message="選択した休暇申請を取消状態にします。"
                confirmLabel="取消"
                confirmColor="warning"
                onCancel={() => setCancelTargetId(null)}
                onConfirm={handleCancelConfirm}
            />
        </Container>
    );
}

export default LeaveSubmitted;
