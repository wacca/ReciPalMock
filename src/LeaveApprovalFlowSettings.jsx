import { useState, useEffect } from 'react';
import { Container, Typography, Box, Button, TextField, Paper, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert, Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const ROLES = [
    { value: '申請者', label: '申請者' },
    { value: '一次承認者', label: '一次承認者' },
    { value: '二次承認者', label: '二次承認者' },
    { value: '最終承認者', label: '最終承認者' },
    { value: '経理', label: '経理' }
];

const SAMPLE_FLOWS = [
    {
        type: 'user',
        target: '由仁場 技朗',
        steps: [
            { role: '申請者', name: '由仁場 技朗', email: 'univatech@univa.tech' },
            { role: '一次承認者', name: '油ニ 和平', email: 'univapay@univa.tech' },
            { role: '最終承認者', name: '由引 安人', email: 'ubiast@univa.tech' }
        ]
    }
];

function LeaveApprovalFlowSettings() {
    const [accounts, setAccounts] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [flows, setFlows] = useState([]);
    const [open, setOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [editIdx, setEditIdx] = useState(null);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [addType, setAddType] = useState('user');
    const [addTarget, setAddTarget] = useState(null);
    const [addSteps, setAddSteps] = useState([
        { role: '申請者', name: '', email: '' },
        { role: '一次承認者', name: '', email: '' }
    ]);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editType, setEditType] = useState('user');
    const [editTarget, setEditTarget] = useState(null);
    const [editSteps, setEditSteps] = useState([
        { role: '申請者', name: '', email: '' },
        { role: '一次承認者', name: '', email: '' }
    ]);

    useEffect(() => {
        setAccounts(JSON.parse(localStorage.getItem('accounts') || '[]'));
        setDepartments(JSON.parse(localStorage.getItem('departments') || '[]'));
        const stored = JSON.parse(localStorage.getItem('leaveApprovalFlows') || '[]');
        if (!stored || stored.length === 0) {
            setFlows(SAMPLE_FLOWS);
            localStorage.setItem('leaveApprovalFlows', JSON.stringify(SAMPLE_FLOWS));
        } else {
            setFlows(stored);
        }
    }, []);

    const handleAddOpen = () => {
        setAddType('user');
        setAddTarget(null);
        setAddSteps([
            { role: '申請者', name: '', email: '' },
            { role: '一次承認者', name: '', email: '' }
        ]);
        setAddDialogOpen(true);
    };
    const handleAddClose = () => setAddDialogOpen(false);
    const handleAddStepChange = (idx, field, value) => {
        const newSteps = [...addSteps];
        newSteps[idx][field] = value;
        setAddSteps(newSteps);
    };
    const handleAddStepRole = (idx, value) => {
        const newSteps = [...addSteps];
        newSteps[idx].role = value;
        setAddSteps(newSteps);
    };
    const handleAddStepAdd = () => {
        setAddSteps([...addSteps, { role: '一次承認者', name: '', email: '' }]);
    };
    const handleAddStepDelete = (idx) => {
        if (addSteps.length <= 2) return;
        setAddSteps(addSteps.filter((_, i) => i !== idx));
    };
    const handleAddSave = () => {
        if (!addTarget) return;
        const newFlow = {
            type: addType,
            target: addType === 'user' ? addTarget.name : addTarget,
            steps: addSteps
        };
        const newFlows = [...flows, newFlow];
        setFlows(newFlows);
        localStorage.setItem('leaveApprovalFlows', JSON.stringify(newFlows));
        setAddDialogOpen(false);
        setSnackbarMessage('有給承認フローを登録しました');
        setOpen(true);
    };
    const handleDelete = (idx) => {
        if (!window.confirm('この有給承認フローを削除しますか？')) return;
        const newFlows = flows.filter((_, i) => i !== idx);
        setFlows(newFlows);
        localStorage.setItem('leaveApprovalFlows', JSON.stringify(newFlows));
        setSnackbarMessage('有給承認フローを削除しました');
        setOpen(true);
    };
    const handleEditOpen = (idx) => {
        setEditIdx(idx);
        const flow = flows[idx];
        setEditType(flow.type);
        setEditTarget(flow.type === 'user' ? accounts.find(a => a.name === flow.target) : flow.target);
        setEditSteps(flow.steps.map(s => ({ ...s })));
        setEditDialogOpen(true);
    };
    const handleEditClose = () => {
        setEditDialogOpen(false);
        setEditIdx(null);
    };
    const handleEditStepChange = (idx, field, value) => {
        const newSteps = [...editSteps];
        newSteps[idx][field] = value;
        setEditSteps(newSteps);
    };
    const handleEditStepRole = (idx, value) => {
        const newSteps = [...editSteps];
        newSteps[idx].role = value;
        setEditSteps(newSteps);
    };
    const handleEditStepAdd = () => {
        setEditSteps([...editSteps, { role: '一次承認者', name: '', email: '' }]);
    };
    const handleEditStepDelete = (idx) => {
        if (editSteps.length <= 2) return;
        setEditSteps(editSteps.filter((_, i) => i !== idx));
    };
    const handleEditSave = () => {
        if (!editTarget) return;
        const newFlows = [...flows];
        newFlows[editIdx] = {
            type: editType,
            target: editType === 'user' ? editTarget.name : editTarget,
            steps: editSteps
        };
        setFlows(newFlows);
        localStorage.setItem('leaveApprovalFlows', JSON.stringify(newFlows));
        setEditDialogOpen(false);
        setSnackbarMessage('有給承認フローを保存しました');
        setOpen(true);
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper sx={{ p: 3, mb: 4 }}>
                <Box className="pageHeaderRow">
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        有給承認フロー設定
                    </Typography>
                    <Box className="pageActionBar">
                        <Button variant="contained" color="primary" onClick={handleAddOpen}>新規追加</Button>
                    </Box>
                </Box>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>種別</TableCell>
                            <TableCell>対象</TableCell>
                            <TableCell>フロー</TableCell>
                            <TableCell>操作</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {flows.map((flow, idx) => (
                            <TableRow key={idx}>
                                <TableCell>{flow.type === 'user' ? '個人' : '部署'}</TableCell>
                                <TableCell>{flow.target}</TableCell>
                                <TableCell>
                                    {flow.steps.map(s => `${s.role}:${s.name}(${s.email})`).join(' → ')}
                                </TableCell>
                                <TableCell>
                                    <Box className="tableActionGroup">
                                        <IconButton onClick={() => handleEditOpen(idx)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(idx)}><DeleteIcon /></IconButton>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>
            {/* 新規追加ダイアログ */}
            <Dialog open={addDialogOpen} onClose={handleAddClose} maxWidth="sm" fullWidth>
                <DialogTitle>有給承認フロー新規追加</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <FormControl sx={{ minWidth: 120 }}>
                            <InputLabel>種別</InputLabel>
                            <Select value={addType} label="種別" onChange={e => setAddType(e.target.value)}>
                                <MenuItem value="user">個人</MenuItem>
                                <MenuItem value="department">部署</MenuItem>
                            </Select>
                        </FormControl>
                        {addType === 'user' ? (
                            <Autocomplete
                                options={accounts}
                                getOptionLabel={opt => opt.name ? `${opt.name}（${opt.userId}）` : ''}
                                value={addTarget}
                                onChange={(_, v) => setAddTarget(v)}
                                renderInput={(params) => <TextField {...params} label="ユーザー選択" sx={{ width: 250 }} />}
                            />
                        ) : (
                            <FormControl sx={{ minWidth: 200 }}>
                                <InputLabel>部署選択</InputLabel>
                                <Select value={addTarget || ''} label="部署選択" onChange={e => setAddTarget(e.target.value)}>
                                    {departments.map(dep => (
                                        <MenuItem key={dep} value={dep}>{dep}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Box>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ width: 140 }}>役割</TableCell>
                                <TableCell sx={{ width: 180 }}>氏名</TableCell>
                                <TableCell sx={{ width: 220 }}>メールアドレス</TableCell>
                                <TableCell sx={{ width: 60 }}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {addSteps.map((step, idx) => (
                                <TableRow key={idx}>
                                    <TableCell>
                                        <FormControl size="small" fullWidth>
                                            <InputLabel>役割</InputLabel>
                                            <Select
                                                value={step.role}
                                                label="役割"
                                                onChange={e => handleAddStepRole(idx, e.target.value)}
                                                disabled={idx === 0}
                                            >
                                                {ROLES.map(role => (
                                                    <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            value={step.name}
                                            onChange={e => handleAddStepChange(idx, 'name', e.target.value)}
                                            placeholder="氏名"
                                            fullWidth
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            value={step.email}
                                            onChange={e => handleAddStepChange(idx, 'email', e.target.value)}
                                            placeholder="メールアドレス"
                                            fullWidth
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {idx > 1 && (
                                            <IconButton onClick={() => handleAddStepDelete(idx)} size="small">
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Box className="inlineActionGroup" sx={{ mt: 2 }}>
                        <Button variant="outlined" onClick={handleAddStepAdd}>承認者追加</Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={handleAddClose}>キャンセル</Button>
                    <Button variant="contained" onClick={handleAddSave}>登録</Button>
                </DialogActions>
            </Dialog>
            {/* 編集ダイアログ */}
            <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
                <DialogTitle>有給承認フロー編集</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <FormControl sx={{ minWidth: 120 }}>
                            <InputLabel>種別</InputLabel>
                            <Select value={editType} label="種別" onChange={e => setEditType(e.target.value)}>
                                <MenuItem value="user">個人</MenuItem>
                                <MenuItem value="department">部署</MenuItem>
                            </Select>
                        </FormControl>
                        {editType === 'user' ? (
                            <Autocomplete
                                options={accounts}
                                getOptionLabel={opt => opt.name ? `${opt.name}（${opt.userId}）` : ''}
                                value={editTarget}
                                onChange={(_, v) => setEditTarget(v)}
                                renderInput={(params) => <TextField {...params} label="ユーザー選択" sx={{ width: 250 }} />}
                            />
                        ) : (
                            <FormControl sx={{ minWidth: 200 }}>
                                <InputLabel>部署選択</InputLabel>
                                <Select value={editTarget || ''} label="部署選択" onChange={e => setEditTarget(e.target.value)}>
                                    {departments.map(dep => (
                                        <MenuItem key={dep} value={dep}>{dep}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Box>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ width: 140 }}>役割</TableCell>
                                <TableCell sx={{ width: 180 }}>氏名</TableCell>
                                <TableCell sx={{ width: 220 }}>メールアドレス</TableCell>
                                <TableCell sx={{ width: 60 }}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {editSteps.map((step, idx) => (
                                <TableRow key={idx}>
                                    <TableCell>
                                        <FormControl size="small" fullWidth>
                                            <InputLabel>役割</InputLabel>
                                            <Select
                                                value={step.role}
                                                label="役割"
                                                onChange={e => handleEditStepRole(idx, e.target.value)}
                                                disabled={idx === 0}
                                            >
                                                {ROLES.map(role => (
                                                    <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            value={step.name}
                                            onChange={e => handleEditStepChange(idx, 'name', e.target.value)}
                                            placeholder="氏名"
                                            fullWidth
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            value={step.email}
                                            onChange={e => handleEditStepChange(idx, 'email', e.target.value)}
                                            placeholder="メールアドレス"
                                            fullWidth
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {idx > 1 && (
                                            <IconButton onClick={() => handleEditStepDelete(idx)} size="small">
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Box className="inlineActionGroup" sx={{ mt: 2 }}>
                        <Button variant="outlined" onClick={handleEditStepAdd}>承認者追加</Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" onClick={handleEditClose}>キャンセル</Button>
                    <Button variant="contained" onClick={handleEditSave}>保存</Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={open} autoHideDuration={2000} onClose={() => setOpen(false)}>
                <Alert severity="success" sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default LeaveApprovalFlowSettings;
