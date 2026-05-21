import { useState, useEffect } from 'react';
import {
    Box, Button, TextField, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, IconButton,
    Select, MenuItem, FormControl, InputLabel, Snackbar, Alert, Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions,
    Stack, Typography, Tooltip,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import AdminConfirmDialog from '../../shared/components/AdminConfirmDialog';
import PageScaffold from '../../shared/ui/PageScaffold.jsx';
import Section from '../../shared/ui/Section.jsx';
import {
    APPROVAL_ROLES, applyApplicantStep, buildFlow, createDefaultSteps, getFlowTarget,
    loadFlowAccounts, loadFlowDepartments, validateFlow,
} from './approvalFlowHelpers';

const SAMPLE_FLOWS = [
    { type: 'user', target: '由仁場 技朗', steps: [
        { role: '申請者', name: '由仁場 技朗', email: 'univatech@univa.tech' },
        { role: '一次承認者', name: '油ニ 和平', email: 'univapay@univa.tech' },
        { role: '最終承認者', name: '由引 安人', email: 'ubiast@univa.tech' },
    ] },
    { type: 'department', target: '開発部', steps: [
        { role: '申請者', name: '', email: '' },
        { role: '一次承認者', name: '油ニ 和平', email: 'univapay@univa.tech' },
        { role: '経理', name: '由引 安人', email: 'ubiast@univa.tech' },
    ] },
];

const STORAGE_KEY = 'approvalFlows';
const PAGE = {
    eyebrow: '管理 ・ フロー',
    title: '経費 承認フロー設定',
    subtitle: '個人または部署ごとの承認経路を設定します。承認者は登録済みアカウントから選択します。',
};

function ApprovalFlowSettings() {
    return <FlowSettingsScreen storageKey={STORAGE_KEY} page={PAGE} sampleFlows={SAMPLE_FLOWS} />;
}

export function FlowSettingsScreen({ storageKey, page, sampleFlows }) {
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
        const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (!stored || stored.length === 0) {
            setFlows(sampleFlows);
            localStorage.setItem(storageKey, JSON.stringify(sampleFlows));
        } else {
            setFlows(stored);
        }
    }, [storageKey, sampleFlows]);

    const showSnackbar = (message, severity = 'success') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpen(true);
    };

    const handleAddOpen = () => { setAddType('user'); setAddTarget(null); setAddSteps(createDefaultSteps()); setAddDialogOpen(true); };
    const handleAddTypeChange = (v) => { setAddType(v); setAddTarget(null); setAddSteps(applyApplicantStep(createDefaultSteps(), v, null)); };
    const handleAddTargetChange = (v) => { setAddTarget(v); setAddSteps(applyApplicantStep(addSteps, addType, v)); };
    const handleAddStepRole = (idx, value) => { const next = [...addSteps]; next[idx].role = value; setAddSteps(next); };
    const handleAddStepAdd = () => setAddSteps([...addSteps, { role: '一次承認者', name: '', email: '' }]);
    const handleAddStepDelete = (idx) => { if (addSteps.length <= 2) return; setAddSteps(addSteps.filter((_, i) => i !== idx)); };
    const handleAddStepAccount = (idx, acc) => {
        const next = [...addSteps];
        next[idx] = { ...next[idx], name: acc?.name || '', email: acc?.email || acc?.userId || '' };
        setAddSteps(next);
    };
    const handleAddSave = () => {
        const target = getFlowTarget(addType, addTarget);
        const steps = applyApplicantStep(addSteps, addType, addTarget);
        const msg = validateFlow({ flows, type: addType, target, steps });
        if (msg) { showSnackbar(msg, 'warning'); return; }
        const next = [...flows, buildFlow(addType, target, steps)];
        setFlows(next);
        localStorage.setItem(storageKey, JSON.stringify(next));
        setAddDialogOpen(false);
        showSnackbar('申請フローを登録しました');
    };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        const next = flows.filter((_, i) => i !== deleteTarget.idx);
        setFlows(next);
        localStorage.setItem(storageKey, JSON.stringify(next));
        setDeleteTarget(null);
        showSnackbar('申請フローを削除しました');
    };

    const handleEditOpen = (idx) => {
        setEditIdx(idx);
        const flow = flows[idx];
        setEditType(flow.type);
        setEditTarget(flow.type === 'user' ? accounts.find((a) => a.name === flow.target) : flow.target);
        setEditSteps(flow.steps.map((s) => ({ ...s })));
        setEditDialogOpen(true);
    };
    const handleEditClose = () => { setEditDialogOpen(false); setEditIdx(null); };
    const handleEditTypeChange = (v) => { setEditType(v); setEditTarget(null); setEditSteps(applyApplicantStep(createDefaultSteps(), v, null)); };
    const handleEditTargetChange = (v) => { setEditTarget(v); setEditSteps(applyApplicantStep(editSteps, editType, v)); };
    const handleEditStepRole = (idx, value) => { const next = [...editSteps]; next[idx].role = value; setEditSteps(next); };
    const handleEditStepAdd = () => setEditSteps([...editSteps, { role: '一次承認者', name: '', email: '' }]);
    const handleEditStepDelete = (idx) => { if (editSteps.length <= 2) return; setEditSteps(editSteps.filter((_, i) => i !== idx)); };
    const handleEditStepAccount = (idx, acc) => {
        const next = [...editSteps];
        next[idx] = { ...next[idx], name: acc?.name || '', email: acc?.email || acc?.userId || '' };
        setEditSteps(next);
    };
    const handleEditSave = () => {
        const target = getFlowTarget(editType, editTarget);
        const steps = applyApplicantStep(editSteps, editType, editTarget);
        const msg = validateFlow({ flows, type: editType, target, steps, excludeIdx: editIdx });
        if (msg) { showSnackbar(msg, 'warning'); return; }
        const next = [...flows];
        next[editIdx] = buildFlow(editType, target, steps);
        setFlows(next);
        localStorage.setItem(storageKey, JSON.stringify(next));
        setEditDialogOpen(false);
        showSnackbar('申請フローを保存しました');
    };

    const flowCounts = flows.reduce((c, f) => ({ ...c, [f.type]: (c[f.type] || 0) + 1 }), {});

    return (
        <PageScaffold
            eyebrow={page.eyebrow}
            title={page.title}
            subtitle={page.subtitle}
            actions={<Button variant="contained" color="primary" startIcon={<AddRoundedIcon />} onClick={handleAddOpen}>新規追加</Button>}
        >
            <Section tone="sunken" elevation={0}>
                <Stack direction="row" spacing={4} flexWrap="wrap">
                    <Stat label="設定数" value={flows.length} tone="primary" />
                    <Stat label="個人フロー" value={flowCounts.user || 0} tone="primary" />
                    <Stat label="部署フロー" value={flowCounts.department || 0} tone="iris" />
                </Stack>
            </Section>

            <Stack spacing={1.25}>
                {flows.length === 0 && (
                    <Section padded sx={{ textAlign: 'center', paddingBlock: 6, color: 'var(--ink-tertiary)' }}>
                        <Typography variant="body2">承認フローがまだ登録されていません。</Typography>
                    </Section>
                )}
                {flows.map((flow, idx) => {
                    const isUser = flow.type === 'user';
                    return (
                        <Section key={`${flow.type}-${flow.target}-${idx}`} padded>
                            <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
                                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 200 }}>
                                    <Box
                                        sx={{
                                            width: 36, height: 36,
                                            borderRadius: 'var(--radius-md)',
                                            background: isUser ? 'var(--accent-primary-soft)' : 'var(--accent-iris-soft)',
                                            color: isUser ? 'var(--accent-primary)' : 'var(--accent-iris)',
                                            display: 'grid', placeItems: 'center', flexShrink: 0,
                                        }}
                                    >
                                        {isUser ? <PersonRoundedIcon fontSize="small" /> : <GroupsRoundedIcon fontSize="small" />}
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                                            {isUser ? '個人フロー' : '部署フロー'}
                                        </Typography>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{flow.target}</Typography>
                                    </Box>
                                </Stack>
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={0.75}
                                    sx={{ flex: 1, overflowX: 'auto', minWidth: 0, paddingBlock: 0.5 }}
                                >
                                    {flow.steps.map((step, i) => (
                                        <Stack key={`${step.role}-${i}`} direction="row" alignItems="center" spacing={0.5}>
                                            <Box
                                                sx={{
                                                    paddingInline: 1.5,
                                                    paddingBlock: 0.75,
                                                    borderRadius: 'var(--radius-pill)',
                                                    background: i === 0 ? 'var(--accent-primary-soft)' : 'var(--surface-sunken)',
                                                    color: i === 0 ? 'var(--accent-primary-ink)' : 'var(--ink-primary)',
                                                    whiteSpace: 'nowrap',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1, display: 'block' }}>{step.role}</Typography>
                                                <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', lineHeight: 1.1, display: 'block' }}>
                                                    {step.name || '未設定'}
                                                </Typography>
                                            </Box>
                                            {i < flow.steps.length - 1 && (
                                                <ArrowForwardRoundedIcon sx={{ fontSize: 14, color: 'var(--ink-muted)', flexShrink: 0 }} />
                                            )}
                                        </Stack>
                                    ))}
                                </Stack>
                                <Stack direction="row" spacing={0.5}>
                                    <Tooltip title="編集"><IconButton onClick={() => handleEditOpen(idx)}><EditRoundedIcon fontSize="small" /></IconButton></Tooltip>
                                    <Tooltip title="削除"><IconButton color="error" onClick={() => setDeleteTarget({ idx, flow })}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton></Tooltip>
                                </Stack>
                            </Stack>
                        </Section>
                    );
                })}
            </Stack>

            <FlowEditorDialog
                open={addDialogOpen}
                title="申請フロー 新規追加"
                accounts={accounts}
                departments={departments}
                type={addType}
                target={addTarget}
                steps={addSteps}
                onTypeChange={handleAddTypeChange}
                onTargetChange={handleAddTargetChange}
                onStepRole={handleAddStepRole}
                onStepAccount={handleAddStepAccount}
                onStepAdd={handleAddStepAdd}
                onStepDelete={handleAddStepDelete}
                onClose={() => setAddDialogOpen(false)}
                onSave={handleAddSave}
                saveLabel="登録"
            />
            <FlowEditorDialog
                open={editDialogOpen}
                title="申請フロー 編集"
                accounts={accounts}
                departments={departments}
                type={editType}
                target={editTarget}
                steps={editSteps}
                onTypeChange={handleEditTypeChange}
                onTargetChange={handleEditTargetChange}
                onStepRole={handleEditStepRole}
                onStepAccount={handleEditStepAccount}
                onStepAdd={handleEditStepAdd}
                onStepDelete={handleEditStepDelete}
                onClose={handleEditClose}
                onSave={handleEditSave}
                saveLabel="保存"
            />

            <Snackbar open={open} autoHideDuration={3000} onClose={() => setOpen(false)}>
                <Alert severity={snackbarSeverity} sx={{ width: '100%' }}>{snackbarMessage}</Alert>
            </Snackbar>
            <AdminConfirmDialog
                open={Boolean(deleteTarget)}
                title="申請フローを削除しますか？"
                message={`${deleteTarget?.flow?.target || ''} の申請フローを削除します。元に戻せません。`}
                confirmLabel="削除"
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
            />
        </PageScaffold>
    );
}

const FlowEditorDialog = ({
    open, title, accounts, departments, type, target, steps,
    onTypeChange, onTargetChange, onStepRole, onStepAccount, onStepAdd, onStepDelete,
    onClose, onSave, saveLabel,
}) => (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
            <Box className="flowEditorControls" sx={{ mb: 2 }}>
                <FormControl fullWidth>
                    <InputLabel>種別</InputLabel>
                    <Select value={type} label="種別" onChange={(e) => onTypeChange(e.target.value)}>
                        <MenuItem value="user">個人</MenuItem>
                        <MenuItem value="department">部署</MenuItem>
                    </Select>
                </FormControl>
                {type === 'user' ? (
                    <Autocomplete
                        options={accounts}
                        getOptionLabel={(o) => (o.name ? `${o.name}（${o.userId}）` : '')}
                        value={target}
                        onChange={(_, v) => onTargetChange(v)}
                        renderInput={(params) => <TextField {...params} label="ユーザー選択" />}
                    />
                ) : (
                    <FormControl fullWidth>
                        <InputLabel>部署選択</InputLabel>
                        <Select value={target || ''} label="部署選択" onChange={(e) => onTargetChange(e.target.value)}>
                            {departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                        </Select>
                    </FormControl>
                )}
            </Box>
            <TableContainer className="flowStepTable">
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ width: 200 }}>役割</TableCell>
                            <TableCell sx={{ width: 320 }}>氏名</TableCell>
                            <TableCell>メールアドレス</TableCell>
                            <TableCell sx={{ width: 74 }} align="center">操作</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {steps.map((step, idx) => (
                            <TableRow key={idx}>
                                <TableCell>
                                    <FormControl size="small" fullWidth>
                                        <InputLabel>役割</InputLabel>
                                        <Select value={step.role} label="役割" onChange={(e) => onStepRole(idx, e.target.value)} disabled={idx === 0}>
                                            {APPROVAL_ROLES.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </TableCell>
                                <TableCell>
                                    {idx === 0 ? (
                                        <TextField size="small" value={step.name} placeholder="申請者" fullWidth disabled />
                                    ) : (
                                        <Autocomplete
                                            options={accounts}
                                            getOptionLabel={(o) => (o.name ? `${o.name}（${o.userId || o.email}）` : '')}
                                            value={accounts.find((a) => a.name === step.name) || null}
                                            onChange={(_, account) => onStepAccount(idx, account)}
                                            renderInput={(params) => <TextField {...params} size="small" placeholder="承認者を選択" />}
                                        />
                                    )}
                                </TableCell>
                                <TableCell>
                                    <TextField size="small" value={step.email} placeholder="メールアドレス" fullWidth disabled />
                                </TableCell>
                                <TableCell align="center">
                                    {idx > 1 && (
                                        <IconButton aria-label="承認者を削除" color="error" onClick={() => onStepDelete(idx)} size="small">
                                            <DeleteOutlineRoundedIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box sx={{ mt: 2 }}>
                <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={onStepAdd} sx={{ borderStyle: 'dashed' }}>
                    承認ステップを追加
                </Button>
            </Box>
        </DialogContent>
        <DialogActions>
            <Button variant="text" color="inherit" startIcon={<CancelRoundedIcon />} onClick={onClose}>キャンセル</Button>
            <Button variant="contained" startIcon={<SaveRoundedIcon />} onClick={onSave}>{saveLabel}</Button>
        </DialogActions>
    </Dialog>
);

const Stat = ({ label, value, tone = 'primary' }) => {
    const tones = { primary: 'var(--accent-primary)', iris: 'var(--accent-iris)' };
    return (
        <Box>
            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>{label}</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 22, color: tones[tone] }} className="tabular-nums">
                {value}<Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'var(--ink-tertiary)', fontSize: 12 }}>件</Typography>
            </Typography>
        </Box>
    );
};

export default ApprovalFlowSettings;
