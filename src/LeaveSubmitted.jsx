import { useState, useEffect } from 'react';
import { Container, Typography, Box, Button, Dialog, DialogContent, DialogTitle, DialogActions, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Snackbar, Alert, Chip } from '@mui/material';
import {
    loadLeaveApplications,
    saveLeaveApplications,
} from './leaveApplicationStore';

const statusColor = {
    申請中: 'primary',
    承認済: 'success',
    非承認: 'error',
    取消: 'default',
};

function LeaveSubmitted() {
    const [submitted, setSubmitted] = useState([]);
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });

    useEffect(() => {
        setSubmitted(loadLeaveApplications());
    }, []);

    const persistSubmitted = (newList) => {
        setSubmitted(newList);
        saveLeaveApplications(newList);
    };

    const handleOpen = (row) => {
        setSelected(row);
        setOpen(true);
    };
    const handleClose = () => setOpen(false);

    const handleCancel = (id) => {
        if (!window.confirm('この休暇申請を取り消しますか？')) return;
        const newList = submitted.map(row => (
            row.id === id ? { ...row, status: '取消', remarks: '' } : row
        ));
        persistSubmitted(newList);
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
                        勤怠（休暇）申請済み一覧
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
                                    <TableCell>状態</TableCell>
                                    <TableCell>操作</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {submitted.length === 0 && (
                                    <TableRow><TableCell colSpan={6}>申請履歴がありません</TableCell></TableRow>
                                )}
                                {submitted.map((row, idx) => (
                                    <TableRow key={row.id || idx}>
                                        <TableCell>{row.submittedAt ? new Date(row.submittedAt).toLocaleString() : '-'}</TableCell>
                                        <TableCell>{row.leaveType}</TableCell>
                                        <TableCell>{row.date}</TableCell>
                                        <TableCell>{row.remarks ? `${row.reason} / ${row.remarks}` : row.reason}</TableCell>
                                        <TableCell>
                                            <Chip size="small" label={row.status || '申請中'} color={statusColor[row.status || '申請中']} variant={(row.status || '申請中') === '申請中' ? 'filled' : 'outlined'} />
                                        </TableCell>
                                        <TableCell>
                                            <Box className="tableActionGroup">
                                                <Button size="small" variant="outlined" onClick={() => handleOpen(row)}>詳細</Button>
                                                <Button size="small" color="error" variant="outlined" onClick={() => handleCancel(row.id)} disabled={(row.status || '申請中') !== '申請中'}>取消</Button>
                                                {(row.status || '申請中') === '非承認' && (
                                                    <Button size="small" color="success" variant="contained" onClick={() => handleResubmit(row.id)}>再申請</Button>
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
            <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
                <DialogTitle>申請詳細</DialogTitle>
                <DialogContent>
                    {selected && (
                        <Box className="detailStack">
                            <Typography>申請種別: {selected.leaveType}</Typography>
                            <Typography>日付: {selected.date}</Typography>
                            <Typography>理由・備考: {selected.reason || '-'}</Typography>
                            {selected.remarks && <Typography>承認者備考: {selected.remarks}</Typography>}
                            <Typography>状態: {selected.status || '申請中'}</Typography>
                            {selected.approvedBy && <Typography>処理者: {selected.approvedBy}</Typography>}
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

export default LeaveSubmitted;
