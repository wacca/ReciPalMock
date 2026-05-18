import { useState, useEffect } from 'react';
import { Container, Typography, Box, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const SAMPLE_DEPARTMENTS = [
    { name: '営業部', positions: [{ name: '部長' }, { name: '課長' }, { name: '一般社員' }] },
    { name: '開発部', positions: [{ name: '部長' }, { name: '主任' }, { name: '一般社員' }] },
    { name: '総務部', positions: [{ name: '部長' }, { name: '一般社員' }] }
];

function MasterSettings() {
    const [departments, setDepartments] = useState([]);
    const [selectedDeptIdx, setSelectedDeptIdx] = useState(0);
    const [deptDialogOpen, setDeptDialogOpen] = useState(false);
    const [deptName, setDeptName] = useState('');
    const [deptEditIdx, setDeptEditIdx] = useState(null);
    const [posDialogOpen, setPosDialogOpen] = useState(false);
    const [posName, setPosName] = useState('');
    const [posEditIdx, setPosEditIdx] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });

    useEffect(() => {
        let dep = null;
        try {
            dep = JSON.parse(localStorage.getItem('departments') || 'null');
        } catch {
            dep = null;
        }
        if (!dep || !Array.isArray(dep) || dep.length === 0) {
            setDepartments(SAMPLE_DEPARTMENTS);
            localStorage.setItem('departments', JSON.stringify(SAMPLE_DEPARTMENTS));
        } else {
            // データ構造を厳密に補正（positionsを{name: string}形式に変換）
            const fixed = dep.map((d, i) => ({
                name: d && typeof d.name === 'string' ? d.name : `部署${i+1}`,
                positions: Array.isArray(d?.positions)
                    ? d.positions.map(p => typeof p === 'string' ? { name: p } : (p && typeof p.name === 'string' ? p : { name: '' }))
                    : []
            }));
            setDepartments(fixed);
            localStorage.setItem('departments', JSON.stringify(fixed));
        }
        setSelectedDeptIdx(0);
    }, []);

    // 部署追加・編集
    const handleDeptDialogOpen = (idx = null) => {
        setDeptEditIdx(idx);
        setDeptName(idx !== null ? departments[idx].name : '');
        setDeptDialogOpen(true);
    };
    const handleDeptDialogClose = () => {
        setDeptDialogOpen(false);
        setDeptName('');
        setDeptEditIdx(null);
    };
    const handleDeptSave = () => {
        if (!deptName.trim()) return;
        let newDeps = [...departments];
        if (deptEditIdx !== null) {
            newDeps[deptEditIdx].name = deptName.trim();
        } else {
            newDeps.push({ name: deptName.trim(), positions: [] });
        }
        setDepartments(newDeps);
        localStorage.setItem('departments', JSON.stringify(newDeps));
        setDeptDialogOpen(false);
        setDeptName('');
        setDeptEditIdx(null);
        setSnackbar({ open: true, message: deptEditIdx !== null ? '部署を保存しました' : '部署を追加しました' });
    };
    const handleDeptDelete = (idx) => {
        if (!window.confirm('この部署を削除しますか？')) return;
        let newDeps = departments.filter((_, i) => i !== idx);
        setDepartments(newDeps);
        localStorage.setItem('departments', JSON.stringify(newDeps));
        if (selectedDeptIdx === idx) setSelectedDeptIdx(0);
        setSnackbar({ open: true, message: '部署を削除しました' });
    };

    // 役職追加・編集
    const handlePosDialogOpen = (idx = null) => {
        setPosEditIdx(idx);
        setPosName(idx !== null ? departments[selectedDeptIdx].positions[idx]?.name || '' : '');
        setPosDialogOpen(true);
    };
    const handlePosDialogClose = () => {
        setPosDialogOpen(false);
        setPosName('');
        setPosEditIdx(null);
    };
    const handlePosSave = () => {
        if (!posName.trim()) return;
        let newDeps = [...departments];
        if (posEditIdx !== null) {
            newDeps[selectedDeptIdx].positions[posEditIdx] = { name: posName.trim() };
        } else {
            newDeps[selectedDeptIdx].positions.push({ name: posName.trim() });
        }
        setDepartments(newDeps);
        localStorage.setItem('departments', JSON.stringify(newDeps));
        setPosDialogOpen(false);
        setPosName('');
        setPosEditIdx(null);
        setSnackbar({ open: true, message: posEditIdx !== null ? '役職を保存しました' : '役職を追加しました' });
    };
    const handlePosDelete = (idx) => {
        if (!window.confirm('この役職を削除しますか？')) return;
        let newDeps = [...departments];
        newDeps[selectedDeptIdx].positions = newDeps[selectedDeptIdx].positions.filter((_, i) => i !== idx);
        setDepartments(newDeps);
        localStorage.setItem('departments', JSON.stringify(newDeps));
        setSnackbar({ open: true, message: '役職を削除しました' });
    };

    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <Paper sx={{ p: 3, mb: 4 }}>
                <Box className="pageHeaderRow">
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        所属部署・役職マスタ
                    </Typography>
                </Box>
                <Box className="inlineActionGroup" sx={{ mb: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>部署を選択</InputLabel>
                        <Select
                            value={selectedDeptIdx}
                            label="部署を選択"
                            onChange={e => setSelectedDeptIdx(Number(e.target.value))}
                        >
                            {departments.map((dep, idx) => (
                                <MenuItem key={idx} value={idx}>{dep.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <IconButton color="primary" onClick={() => handleDeptDialogOpen()}><AddIcon /></IconButton>
                    <IconButton color="primary" onClick={() => handleDeptDialogOpen(selectedDeptIdx)}><EditIcon /></IconButton>
                    <IconButton color="error" onClick={() => handleDeptDelete(selectedDeptIdx)} disabled={departments.length <= 1}><DeleteIcon /></IconButton>
                </Box>
                <Box className="sectionHeaderRow">
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>役職一覧</Typography>
                    <Box className="pageActionBar">
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => handlePosDialogOpen()}>役職追加</Button>
                    </Box>
                </Box>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>部署</TableCell>
                            <TableCell>役職</TableCell>
                            <TableCell>操作</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(departments[selectedDeptIdx] && Array.isArray(departments[selectedDeptIdx].positions) && departments[selectedDeptIdx].positions.length > 0) ? (
                            departments[selectedDeptIdx].positions.filter(pos => pos && typeof pos.name === 'string' && pos.name.trim() !== '').map((pos, idx) => (
                                <TableRow key={idx}>
                                    <TableCell>{departments[selectedDeptIdx].name}</TableCell>
                                    <TableCell>{pos.name}</TableCell>
                                    <TableCell>
                                        <Box className="tableActionGroup">
                                            <IconButton size="small" onClick={() => handlePosDialogOpen(idx)}><EditIcon fontSize="small" /></IconButton>
                                            <IconButton size="small" onClick={() => handlePosDelete(idx)}><DeleteIcon fontSize="small" /></IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell>{departments[selectedDeptIdx]?.name}</TableCell><TableCell colSpan={2} style={{ color: '#aaa' }}>（役職なし）</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </Paper>
            {/* 部署追加・編集ダイアログ */}
            <Dialog open={deptDialogOpen} onClose={handleDeptDialogClose} maxWidth="xs" fullWidth>
                <DialogTitle>{deptEditIdx !== null ? '部署名編集' : '部署追加'}</DialogTitle>
                <DialogContent>
                    <TextField
                        label="部署名"
                        value={deptName}
                        onChange={e => setDeptName(e.target.value)}
                        fullWidth
                        autoFocus
                    />
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={handleDeptDialogClose}>キャンセル</Button>
                    <Button variant="contained" onClick={handleDeptSave}>保存</Button>
                </DialogActions>
            </Dialog>
            {/* 役職追加・編集ダイアログ */}
            <Dialog open={posDialogOpen} onClose={handlePosDialogClose} maxWidth="xs" fullWidth>
                <DialogTitle>{posEditIdx !== null ? '役職編集' : '役職追加'}</DialogTitle>
                <DialogContent>
                    <TextField
                        label="役職名"
                        value={posName}
                        onChange={e => setPosName(e.target.value)}
                        fullWidth
                        autoFocus
                    />
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={handlePosDialogClose}>キャンセル</Button>
                    <Button variant="contained" onClick={handlePosSave}>保存</Button>
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

export default MasterSettings;


