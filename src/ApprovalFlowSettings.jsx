import { useState } from 'react';
import { Container, Typography, Box, Button, TextField, Paper, Table, TableHead, TableRow, TableCell, TableBody, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

function ApprovalFlowSettings() {
    const [steps, setSteps] = useState([
        { id: 1, name: '申請者', email: '', role: '申請者' },
        { id: 2, name: '', email: '', role: '承認者' },
    ]);
    const [nextId, setNextId] = useState(3);

    const handleChange = (idx, field, value) => {
        const newSteps = [...steps];
        newSteps[idx][field] = value;
        setSteps(newSteps);
    };

    const handleAddStep = () => {
        setSteps([...steps, { id: nextId, name: '', email: '', role: '承認者' }]);
        setNextId(nextId + 1);
    };

    const handleDeleteStep = (idx) => {
        if (steps.length <= 2) return; // 最低2ステップは必要
        setSteps(steps.filter((_, i) => i !== idx));
    };

    const handleSave = () => {
        // 保存処理（API連携等）
        alert('申請フローを保存しました');
    };

    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    申請フロー設定
                </Typography>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ width: 120 }}>役割</TableCell>
                            <TableCell sx={{ width: 180 }}>氏名</TableCell>
                            <TableCell sx={{ width: 220 }}>メールアドレス</TableCell>
                            <TableCell sx={{ width: 60 }}></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {steps.map((step, idx) => (
                            <TableRow key={step.id}>
                                <TableCell>{step.role}</TableCell>
                                <TableCell>
                                    <TextField
                                        size="small"
                                        value={step.name}
                                        onChange={e => handleChange(idx, 'name', e.target.value)}
                                        placeholder="氏名"
                                        fullWidth
                                    />
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        size="small"
                                        value={step.email}
                                        onChange={e => handleChange(idx, 'email', e.target.value)}
                                        placeholder="メールアドレス"
                                        fullWidth
                                    />
                                </TableCell>
                                <TableCell>
                                    {step.role !== '申請者' && (
                                        <IconButton onClick={() => handleDeleteStep(idx)} size="small">
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button variant="outlined" onClick={handleAddStep}>承認者追加</Button>
                    <Button variant="contained" color="primary" onClick={handleSave}>保存</Button>
                </Box>
            </Paper>
        </Container>
    );
}

export default ApprovalFlowSettings;

