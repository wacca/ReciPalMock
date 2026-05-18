import { useState, useEffect } from 'react';
import { Container, Typography, Box, Button, Dialog, DialogContent, DialogTitle, DialogActions, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Snackbar, Alert } from '@mui/material';

function LeaveSubmitted() {
    const [submitted, setSubmitted] = useState([]);
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });

    useEffect(() => {
        const data = JSON.parse(localStorage.getItem('leaveApplications') || '[]');
        setSubmitted(data);
    }, []);

    const handleOpen = (row) => {
        setSelected(row);
        setOpen(true);
    };
    const handleClose = () => setOpen(false);

    // 申請済みの削除
    const handleDelete = (id) => {
        if (!window.confirm('この申請履歴を削除しますか？')) return;
        const newList = submitted.filter(d => d.id !== id);
        setSubmitted(newList);
        localStorage.setItem('leaveApplications', JSON.stringify(newList));
        setSnackbar({ open: true, message: '申請履歴を削除しました' });
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Box className="pageHeaderRow">
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    勤怠（休暇）申請済み一覧
                </Typography>
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
                                <TableCell>{row.reason}</TableCell>
                                <TableCell>{row.status || '申請中'}</TableCell>
                                <TableCell>
                                    <Box className="tableActionGroup">
                                        <Button size="small" variant="outlined" onClick={() => handleOpen(row)}>詳細</Button>
                                        <Button size="small" color="error" variant="outlined" onClick={() => handleDelete(row.id)}>削除</Button>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
                <DialogTitle>申請詳細</DialogTitle>
                <DialogContent>
                    {selected && (
                        <Box>
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

export default LeaveSubmitted;
