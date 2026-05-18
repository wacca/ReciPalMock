import { useState, useEffect } from 'react';
import { Container, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

function LeaveApprovals() {
    const [data, setData] = useState([]);
    const [commentMap, setCommentMap] = useState({});
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        // モックデータ取得
        const mock = JSON.parse(localStorage.getItem('leaveApplications') || '[]');
        setData(mock);
    }, []);

    const handleStatus = (idx, status) => {
        const newData = [...data];
        newData[idx].status = status;
        setData(newData);
        localStorage.setItem('leaveApplications', JSON.stringify(newData));
        setCommentMap({ ...commentMap, [newData[idx].id]: '' });
    };
    const handleOpen = (row) => {
        setSelected(row);
        setOpen(true);
    };
    const handleClose = () => setOpen(false);

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                勤怠（休暇）承認
            </Typography>
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
                        {data.length === 0 && (
                            <TableRow><TableCell colSpan={6}>承認待ち申請はありません</TableCell></TableRow>
                        )}
                        {data.map((row, idx) => (
                            <TableRow key={row.id || idx}>
                                <TableCell>{row.submittedAt ? new Date(row.submittedAt).toLocaleString() : '-'}</TableCell>
                                <TableCell>{row.leaveType}</TableCell>
                                <TableCell>{row.date}</TableCell>
                                <TableCell>{row.reason}</TableCell>
                                <TableCell>{row.status || '申請中'}</TableCell>
                                <TableCell>
                                    <Button size="small" variant="outlined" onClick={() => handleOpen(row)}>詳細</Button>
                                    <Button size="small" color="primary" variant="contained" sx={{ ml: 1 }} onClick={() => handleStatus(idx, '承認済')}>承認</Button>
                                    <Button size="small" color="error" variant="contained" sx={{ ml: 1 }} onClick={() => handleStatus(idx, '非承認')}>非承認</Button>
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
                    <Button onClick={handleClose}>閉じる</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default LeaveApprovals;

