import { useState, useEffect } from 'react';
import { Container, Typography, Box, Button, TextField, Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert, Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AdminConfirmDialog from './components/AdminConfirmDialog';
import {
    APPROVAL_ROLES,
    applyApplicantStep,
    buildFlow,
    createDefaultSteps,
    formatStep,
    getFlowTarget,
    loadFlowAccounts,
    loadFlowDepartments,
    validateFlow,
} from './approvalFlowHelpers';

const SAMPLE_FLOWS = [
    {
        type: 'user',
        target: '由仁場 技朗',
        steps: [
            { role: '申請者', name: '由仁場 技朗', email: 'univatech@univa.tech' },
            { role: '一次承認者', name: '油ニ 和平', email: 'univapay@univa.tech' },
            { role: '最終承認者', name: '由引 安人', email: 'ubiast@univa.tech' }
        ]
    },
    {
        type: 'department',
        target: '開発部',
        steps: [
            { role: '申請者', name: '', email: '' },
            { role: '一次承認者', name: '油ニ 和平', email: 'univapay@univa.tech' },
            { role: '経理', name: '由引 安人', email: 'ubiast@univa.tech' }
        ]
    }
];

function ApprovalFlowSettings() {
    const [accounts, setAccounts] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [flows, setFlows] = useState([]);
    const [open, setOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [editIdx, setEditIdx] = useState(null);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [addType, setAddType] = useState('user');
    const [addTarget, setAddTarget] = useState(null);
    const [addSteps, setAddSteps] = useState(createDefaultSteps());
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editType, setEditType] = useState('user');
    const [editTarget, setEditTarget] = useState(null);
    const [editSteps, setEditSteps] = useState(createDefaultSteps());
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        setAccounts(loadFlowAccounts());
        setDepartments(loadFlowDepartments());
        // サンプルデータ初期化
        const stored = JSON.parse(localStorage.getItem('approvalFlows') || '[]');
        if (!stored || stored.length === 0) {
            setFlows(SAMPLE_FLOWS);
            localStorage.setItem('approvalFlows', JSON.stringify(SAMPLE_FLOWS));
        } else {
            setFlows(stored);
        }
    }, []);

    const handleAddOpen = () => {
        setAddType('user');
        setAddTarget(null);
        setAddSteps(createDefaultSteps());
        setAddDialogOpen(true);
    };
    const handleAddClose = () => {
        setAddDialogOpen(false);
    };
    const showSnackbar = (message, severity = 'success') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpen(true);
    };
    const handleAddTypeChange = (value) => {
        setAddType(value);
        setAddTarget(null);
        setAddSteps(applyApplicantStep(createDefaultSteps(), value, null));
    };
    const handleAddTargetChange = (value) => {
        setAddTarget(value);
        setAddSteps(applyApplicantStep(addSteps, addType, value));
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
    const handleAddStepAccount = (idx, account) => {
        const newSteps = [...addSteps];
        newSteps[idx] = {
            ...newSteps[idx],
            name: account?.name || '',
            email: account?.email || account?.userId || '',
        };
        setAddSteps(newSteps);
    };
    const handleAddSave = () => {
        const target = getFlowTarget(addType, addTarget);
        const steps = applyApplicantStep(addSteps, addType, addTarget);
        const validationMessage = validateFlow({ flows, type: addType, target, steps });
        if (validationMessage) {
            showSnackbar(validationMessage, 'warning');
            return;
        }
        const newFlow = buildFlow(addType, target, steps);
        const newFlows = [...flows, newFlow];
        setFlows(newFlows);
        localStorage.setItem('approvalFlows', JSON.stringify(newFlows));
        setAddDialogOpen(false);
        showSnackbar('申請フローを登録しました');
    };
    const handleDeleteRequest = (idx) => {
        setDeleteTarget({ idx, flow: flows[idx] });
    };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        const newFlows = flows.filter((_, i) => i !== deleteTarget.idx);
        setFlows(newFlows);
        localStorage.setItem('approvalFlows', JSON.stringify(newFlows));
        setDeleteTarget(null);
        showSnackbar('申請フローを削除しました');
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
    const handleEditTypeChange = (value) => {
        setEditType(value);
        setEditTarget(null);
        setEditSteps(applyApplicantStep(createDefaultSteps(), value, null));
    };
    const handleEditTargetChange = (value) => {
        setEditTarget(value);
        setEditSteps(applyApplicantStep(editSteps, editType, value));
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
    const handleEditStepAccount = (idx, account) => {
        const newSteps = [...editSteps];
        newSteps[idx] = {
            ...newSteps[idx],
            name: account?.name || '',
            email: account?.email || account?.userId || '',
        };
        setEditSteps(newSteps);
    };
    const handleEditSave = () => {
        const target = getFlowTarget(editType, editTarget);
        const steps = applyApplicantStep(editSteps, editType, editTarget);
        const validationMessage = validateFlow({ flows, type: editType, target, steps, excludeIdx: editIdx });
        if (validationMessage) {
            showSnackbar(validationMessage, 'warning');
            return;
        }
        const newFlows = [...flows];
        newFlows[editIdx] = buildFlow(editType, target, steps);
        setFlows(newFlows);
        localStorage.setItem('approvalFlows', JSON.stringify(newFlows));
        setEditDialogOpen(false);
        showSnackbar('申請フローを保存しました');
    };

    const flowCounts = flows.reduce((counts, flow) => ({
        ...counts,
        [flow.type]: (counts[flow.type] || 0) + 1,
    }), {});

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper sx={{ p: 3, mb: 4 }}>
                <Box className="pageHeaderRow">
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            経費承認フロー設定
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            個人または部署ごとの承認経路を設定します。承認者は登録済みアカウントから選択します。
                        </Typography>
                    </Box>
                    <Box className="pageActionBar">
                        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleAddOpen}>新規追加</Button>
                    </Box>
                </Box>
                <Box className="expenseSummaryStrip">
                    <Box>
                        <Typography variant="caption" color="text.secondary">設定数</Typography>
                        <Typography variant="subtitle1">{flows.length}件</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">個人</Typography>
                        <Typography variant="subtitle1">{flowCounts.user || 0}件</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">部署</Typography>
                        <Typography variant="subtitle1">{flowCounts.department || 0}件</Typography>
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
                                <TableCell>
                                    <Chip size="small" label={flow.type === 'user' ? '個人' : '部署'} color={flow.type === 'user' ? 'primary' : 'secondary'} variant="outlined" />
                                </TableCell>
                                <TableCell>{flow.target}</TableCell>
                                <TableCell>
                                    {flow.steps.map(formatStep).join(' → ')}
                                </TableCell>
                                <TableCell>
                                    <Box className="tableActionGroup">
                                        <Tooltip title="編集">
                                            <IconButton aria-label={`${flow.target}の申請フローを編集`} onClick={() => handleEditOpen(idx)}><EditIcon /></IconButton>
                                        </Tooltip>
                                        <Tooltip title="削除">
                                            <IconButton aria-label={`${flow.target}の申請フローを削除`} color="error" onClick={() => handleDeleteRequest(idx)}><DeleteIcon /></IconButton>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>
            <Dialog open={addDialogOpen} onClose={handleAddClose} maxWidth="lg" fullWidth className="flowEditorDialog">
                <DialogTitle>申請フロー新規追加</DialogTitle>
                <DialogContent>
                    <Box className="flowEditorControls">
                        <FormControl fullWidth>
                            <InputLabel>種別</InputLabel>
                            <Select value={addType} label="種別" onChange={e => handleAddTypeChange(e.target.value)}>
                                <MenuItem value="user">個人</MenuItem>
                                <MenuItem value="department">部署</MenuItem>
                            </Select>
                        </FormControl>
                        {addType === 'user' ? (
                            <Autocomplete
                                options={accounts}
                                getOptionLabel={opt => opt.name ? `${opt.name}（${opt.userId}）` : ''}
                                value={addTarget}
                                onChange={(_, v) => handleAddTargetChange(v)}
                                renderInput={(params) => <TextField {...params} label="ユーザー選択" />}
                            />
                        ) : (
                            <FormControl fullWidth>
                                <InputLabel>部署選択</InputLabel>
                                <Select value={addTarget || ''} label="部署選択" onChange={e => handleAddTargetChange(e.target.value)}>
                                    {departments.map(dep => (
                                        <MenuItem key={dep} value={dep}>{dep}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Box>
                    <TableContainer className="flowStepTable">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>役割</TableCell>
                                    <TableCell>氏名</TableCell>
                                    <TableCell>メールアドレス</TableCell>
                                    <TableCell>操作</TableCell>
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
                                                    {APPROVAL_ROLES.map(role => (
                                                        <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </TableCell>
                                        <TableCell>
                                            {idx === 0 ? (
                                                <TextField size="small" value={step.name} placeholder="申請者" fullWidth disabled />
                                            ) : (
                                                <Autocomplete
                                                    options={accounts}
                                                    getOptionLabel={opt => opt.name ? `${opt.name}（${opt.userId || opt.email}）` : ''}
                                                    value={accounts.find(account => account.name === step.name) || null}
                                                    onChange={(_, account) => handleAddStepAccount(idx, account)}
                                                    renderInput={(params) => <TextField {...params} size="small" placeholder="承認者を選択" />}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                value={step.email}
                                                placeholder="メールアドレス"
                                                fullWidth
                                                disabled
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {idx > 1 && (
                                                <IconButton aria-label="承認者を削除" color="error" onClick={() => handleAddStepDelete(idx)} size="small">
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Box className="inlineActionGroup" sx={{ mt: 2 }}>
                        <Button variant="outlined" onClick={handleAddStepAdd}>承認者追加</Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" color="inherit" onClick={handleAddClose}>キャンセル</Button>
                    <Button variant="contained" onClick={handleAddSave}>登録</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="lg" fullWidth className="flowEditorDialog">
                <DialogTitle>申請フロー編集</DialogTitle>
                <DialogContent>
                    <Box className="flowEditorControls">
                        <FormControl fullWidth>
                            <InputLabel>種別</InputLabel>
                            <Select value={editType} label="種別" onChange={e => handleEditTypeChange(e.target.value)}>
                                <MenuItem value="user">個人</MenuItem>
                                <MenuItem value="department">部署</MenuItem>
                            </Select>
                        </FormControl>
                        {editType === 'user' ? (
                            <Autocomplete
                                options={accounts}
                                getOptionLabel={opt => opt.name ? `${opt.name}（${opt.userId}）` : ''}
                                value={editTarget}
                                onChange={(_, v) => handleEditTargetChange(v)}
                                renderInput={(params) => <TextField {...params} label="ユーザー選択" />}
                            />
                        ) : (
                            <FormControl fullWidth>
                                <InputLabel>部署選択</InputLabel>
                                <Select value={editTarget || ''} label="部署選択" onChange={e => handleEditTargetChange(e.target.value)}>
                                    {departments.map(dep => (
                                        <MenuItem key={dep} value={dep}>{dep}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Box>
                    <TableContainer className="flowStepTable">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>役割</TableCell>
                                    <TableCell>氏名</TableCell>
                                    <TableCell>メールアドレス</TableCell>
                                    <TableCell>操作</TableCell>
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
                                                    {APPROVAL_ROLES.map(role => (
                                                        <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </TableCell>
                                        <TableCell>
                                            {idx === 0 ? (
                                                <TextField size="small" value={step.name} placeholder="申請者" fullWidth disabled />
                                            ) : (
                                                <Autocomplete
                                                    options={accounts}
                                                    getOptionLabel={opt => opt.name ? `${opt.name}（${opt.userId || opt.email}）` : ''}
                                                    value={accounts.find(account => account.name === step.name) || null}
                                                    onChange={(_, account) => handleEditStepAccount(idx, account)}
                                                    renderInput={(params) => <TextField {...params} size="small" placeholder="承認者を選択" />}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                value={step.email}
                                                placeholder="メールアドレス"
                                                fullWidth
                                                disabled
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {idx > 1 && (
                                                <IconButton aria-label="承認者を削除" color="error" onClick={() => handleEditStepDelete(idx)} size="small">
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Box className="inlineActionGroup" sx={{ mt: 2 }}>
                        <Button variant="outlined" onClick={handleEditStepAdd}>承認者追加</Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button variant="outlined" color="inherit" onClick={handleEditClose}>キャンセル</Button>
                    <Button variant="contained" onClick={handleEditSave}>保存</Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={open} autoHideDuration={3000} onClose={() => setOpen(false)}>
                <Alert severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
            <AdminConfirmDialog
                open={Boolean(deleteTarget)}
                title="申請フローを削除しますか？"
                message={`${deleteTarget?.flow?.target || ''} の申請フローを削除します。`}
                confirmLabel="削除"
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
            />
        </Container>
    );
}

export default ApprovalFlowSettings;
