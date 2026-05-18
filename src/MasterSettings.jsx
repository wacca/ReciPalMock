import { useState, useEffect } from 'react';
import { Container, Typography, Box, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Snackbar, Alert, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const SAMPLE_DEPARTMENTS = [
    { name: '営業部', positions: [{ name: '部長' }, { name: '課長' }, { name: '一般社員' }] },
    { name: '開発部', positions: [{ name: '部長' }, { name: '主任' }, { name: '一般社員' }] },
    { name: '総務部', positions: [{ name: '部長' }, { name: '一般社員' }] }
];

const normalizeDepartments = (departments) => (
    departments.map((department, index) => ({
        name: department && typeof department.name === 'string' ? department.name : `部署${index + 1}`,
        positions: Array.isArray(department?.positions)
            ? department.positions
                .map(position => (typeof position === 'string' ? { name: position } : position))
                .filter(position => position?.name)
            : [],
    }))
);

const loadJsonArray = (key) => {
    try {
        const value = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
};

const saveDepartments = (departments) => {
    localStorage.setItem('departments', JSON.stringify(departments));
};

function MasterSettings() {
    const [departments, setDepartments] = useState([]);
    const [selectedDeptIdx, setSelectedDeptIdx] = useState(0);
    const [deptDialogOpen, setDeptDialogOpen] = useState(false);
    const [deptName, setDeptName] = useState('');
    const [deptEditIdx, setDeptEditIdx] = useState(null);
    const [posDialogOpen, setPosDialogOpen] = useState(false);
    const [posName, setPosName] = useState('');
    const [posEditIdx, setPosEditIdx] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        let dep = null;
        try {
            dep = JSON.parse(localStorage.getItem('departments') || 'null');
        } catch {
            dep = null;
        }
        if (!dep || !Array.isArray(dep) || dep.length === 0) {
            setDepartments(SAMPLE_DEPARTMENTS);
            saveDepartments(SAMPLE_DEPARTMENTS);
        } else {
            const fixed = normalizeDepartments(dep);
            setDepartments(fixed);
            saveDepartments(fixed);
        }
        setSelectedDeptIdx(0);
    }, []);

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const updateDepartmentReferences = (oldName, newName) => {
        const accounts = loadJsonArray('accounts');
        if (accounts.length > 0) {
            localStorage.setItem('accounts', JSON.stringify(accounts.map(account => (
                account.department === oldName ? { ...account, department: newName } : account
            ))));
        }

        ['approvalFlows', 'leaveApprovalFlows'].forEach(key => {
            const flows = loadJsonArray(key);
            if (flows.length > 0) {
                localStorage.setItem(key, JSON.stringify(flows.map(flow => (
                    flow.type === 'department' && flow.target === oldName ? { ...flow, target: newName } : flow
                ))));
            }
        });
    };

    const updatePositionReferences = (departmentName, oldName, newName) => {
        const accounts = loadJsonArray('accounts');
        if (accounts.length > 0) {
            localStorage.setItem('accounts', JSON.stringify(accounts.map(account => (
                account.department === departmentName && account.position === oldName ? { ...account, position: newName } : account
            ))));
        }
    };

    const isDepartmentInUse = (departmentName) => {
        const accounts = loadJsonArray('accounts');
        const flows = [...loadJsonArray('approvalFlows'), ...loadJsonArray('leaveApprovalFlows')];
        return accounts.some(account => account.department === departmentName) ||
            flows.some(flow => flow.type === 'department' && flow.target === departmentName);
    };

    const isPositionInUse = (departmentName, positionName) => {
        const accounts = loadJsonArray('accounts');
        return accounts.some(account => account.department === departmentName && account.position === positionName);
    };

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
        const trimmedName = deptName.trim();
        if (!trimmedName) {
            showSnackbar('部署名を入力してください', 'warning');
            return;
        }
        const duplicate = departments.some((department, idx) => department.name === trimmedName && idx !== deptEditIdx);
        if (duplicate) {
            showSnackbar('同じ部署名が既に存在します', 'warning');
            return;
        }
        let newDeps = [...departments];
        if (deptEditIdx !== null) {
            const oldName = newDeps[deptEditIdx].name;
            newDeps[deptEditIdx].name = trimmedName;
            if (oldName !== trimmedName) updateDepartmentReferences(oldName, trimmedName);
        } else {
            newDeps.push({ name: trimmedName, positions: [] });
            setSelectedDeptIdx(newDeps.length - 1);
        }
        setDepartments(newDeps);
        saveDepartments(newDeps);
        setDeptDialogOpen(false);
        setDeptName('');
        setDeptEditIdx(null);
        showSnackbar(deptEditIdx !== null ? '部署を保存しました' : '部署を追加しました');
    };
    const handleDeptDelete = (idx) => {
        const target = departments[idx];
        if (!target) return;
        if (isDepartmentInUse(target.name)) {
            showSnackbar('利用中の部署は削除できません。アカウントまたは申請フローを先に変更してください', 'warning');
            return;
        }
        if (!window.confirm(`部署「${target.name}」を削除しますか？`)) return;
        let newDeps = departments.filter((_, i) => i !== idx);
        setDepartments(newDeps);
        saveDepartments(newDeps);
        setSelectedDeptIdx(Math.min(selectedDeptIdx, newDeps.length - 1));
        showSnackbar('部署を削除しました');
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
        const trimmedName = posName.trim();
        if (!trimmedName) {
            showSnackbar('役職名を入力してください', 'warning');
            return;
        }
        const selectedDepartment = departments[selectedDeptIdx];
        if (!selectedDepartment) return;
        const duplicate = selectedDepartment.positions.some((position, idx) => position.name === trimmedName && idx !== posEditIdx);
        if (duplicate) {
            showSnackbar('同じ役職名が既に存在します', 'warning');
            return;
        }
        let newDeps = [...departments];
        if (posEditIdx !== null) {
            const oldName = newDeps[selectedDeptIdx].positions[posEditIdx].name;
            newDeps[selectedDeptIdx].positions[posEditIdx] = { name: trimmedName };
            if (oldName !== trimmedName) updatePositionReferences(newDeps[selectedDeptIdx].name, oldName, trimmedName);
        } else {
            newDeps[selectedDeptIdx].positions.push({ name: trimmedName });
        }
        setDepartments(newDeps);
        saveDepartments(newDeps);
        setPosDialogOpen(false);
        setPosName('');
        setPosEditIdx(null);
        showSnackbar(posEditIdx !== null ? '役職を保存しました' : '役職を追加しました');
    };
    const handlePosDelete = (idx) => {
        const selectedDepartment = departments[selectedDeptIdx];
        const target = selectedDepartment?.positions[idx];
        if (!target) return;
        if (isPositionInUse(selectedDepartment.name, target.name)) {
            showSnackbar('利用中の役職は削除できません。アカウントを先に変更してください', 'warning');
            return;
        }
        if (!window.confirm(`役職「${target.name}」を削除しますか？`)) return;
        let newDeps = [...departments];
        newDeps[selectedDeptIdx].positions = newDeps[selectedDeptIdx].positions.filter((_, i) => i !== idx);
        setDepartments(newDeps);
        saveDepartments(newDeps);
        showSnackbar('役職を削除しました');
    };

    const selectedDepartment = departments[selectedDeptIdx];
    const positionCount = departments.reduce((sum, department) => sum + department.positions.length, 0);

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Paper sx={{ p: 3, mb: 4 }}>
                <Box className="pageHeaderRow">
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            所属部署・役職マスタ
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            アカウント管理や申請フローで利用する部署・役職を管理します。
                        </Typography>
                    </Box>
                </Box>
                <Box className="expenseSummaryStrip">
                    <Box>
                        <Typography variant="caption" color="text.secondary">部署数</Typography>
                        <Typography variant="subtitle1">{departments.length}件</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">役職数</Typography>
                        <Typography variant="subtitle1">{positionCount}件</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">選択部署</Typography>
                        <Typography variant="subtitle1">{selectedDepartment?.name || '-'}</Typography>
                    </Box>
                </Box>
                <Box className="sectionHeaderRow">
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>部署</Typography>
                    <Box className="pageActionBar">
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => handleDeptDialogOpen()}>部署追加</Button>
                        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => handleDeptDialogOpen(selectedDeptIdx)} disabled={!selectedDepartment}>部署名変更</Button>
                        <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => handleDeptDelete(selectedDeptIdx)} disabled={departments.length <= 1 || !selectedDepartment}>部署削除</Button>
                    </Box>
                </Box>
                <Box className="inlineActionGroup" sx={{ mb: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 260 }}>
                        <InputLabel>部署を選択</InputLabel>
                        <Select
                            value={selectedDeptIdx}
                            label="部署を選択"
                            onChange={e => setSelectedDeptIdx(Number(e.target.value))}
                        >
                            {departments.map((dep, idx) => (
                                <MenuItem key={dep.name} value={idx}>{dep.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
                <Table size="small" sx={{ mb: 3 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell>部署</TableCell>
                            <TableCell>役職数</TableCell>
                            <TableCell>状態</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {departments.map((department, idx) => (
                            <TableRow key={department.name} hover onClick={() => setSelectedDeptIdx(idx)} sx={{ cursor: 'pointer' }}>
                                <TableCell>{department.name}</TableCell>
                                <TableCell>{department.positions.length}</TableCell>
                                <TableCell>
                                    {idx === selectedDeptIdx ? (
                                        <Chip size="small" label="選択中" color="primary" />
                                    ) : (
                                        <Chip size="small" label="未選択" variant="outlined" />
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Box className="sectionHeaderRow">
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>役職一覧</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {selectedDepartment?.name || '-'} に紐づく役職です。
                        </Typography>
                    </Box>
                    <Box className="pageActionBar">
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => handlePosDialogOpen()} disabled={!selectedDepartment}>役職追加</Button>
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
                        {(selectedDepartment && Array.isArray(selectedDepartment.positions) && selectedDepartment.positions.length > 0) ? (
                            selectedDepartment.positions.filter(pos => pos && typeof pos.name === 'string' && pos.name.trim() !== '').map((pos, idx) => (
                                <TableRow key={pos.name}>
                                    <TableCell>{selectedDepartment.name}</TableCell>
                                    <TableCell>{pos.name}</TableCell>
                                    <TableCell>
                                        <Box className="tableActionGroup">
                                            <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => handlePosDialogOpen(idx)}>編集</Button>
                                            <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => handlePosDelete(idx)}>削除</Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell>{selectedDepartment?.name || '-'}</TableCell><TableCell colSpan={2} style={{ color: '#aaa' }}>（役職なし）</TableCell></TableRow>
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
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default MasterSettings;


