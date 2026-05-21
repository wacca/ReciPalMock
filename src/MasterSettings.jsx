import { useState, useEffect } from 'react';
import {
    Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem,
    Snackbar, Alert, IconButton, Tooltip, Stack, Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import AdminConfirmDialog from './components/AdminConfirmDialog';
import PageScaffold from './ui/PageScaffold.jsx';
import Section from './ui/Section.jsx';

const SAMPLE_DEPARTMENTS = [
    { name: '営業部', positions: [{ name: '部長' }, { name: '課長' }, { name: '一般社員' }] },
    { name: '開発部', positions: [{ name: '部長' }, { name: '主任' }, { name: '一般社員' }] },
    { name: '総務部', positions: [{ name: '部長' }, { name: '一般社員' }] },
];

const normalizeDepartments = (departments) =>
    departments.map((department, index) => ({
        name: department && typeof department.name === 'string' ? department.name : `部署${index + 1}`,
        positions: Array.isArray(department?.positions)
            ? department.positions.map((p) => (typeof p === 'string' ? { name: p } : p)).filter((p) => p?.name)
            : [],
    }));

const loadJsonArray = (key) => {
    try {
        const v = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(v) ? v : [];
    } catch {
        return [];
    }
};

const saveDepartments = (departments) => localStorage.setItem('departments', JSON.stringify(departments));

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
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        let dep = null;
        try { dep = JSON.parse(localStorage.getItem('departments') || 'null'); } catch { /* ignore */ }
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

    const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

    const updateDepartmentReferences = (oldName, newName) => {
        const accounts = loadJsonArray('accounts');
        if (accounts.length > 0) {
            localStorage.setItem('accounts', JSON.stringify(accounts.map((a) => (a.department === oldName ? { ...a, department: newName } : a))));
        }
        ['approvalFlows', 'leaveApprovalFlows'].forEach((key) => {
            const flows = loadJsonArray(key);
            if (flows.length > 0) {
                localStorage.setItem(key, JSON.stringify(flows.map((f) => (f.type === 'department' && f.target === oldName ? { ...f, target: newName } : f))));
            }
        });
    };

    const updatePositionReferences = (departmentName, oldName, newName) => {
        const accounts = loadJsonArray('accounts');
        if (accounts.length > 0) {
            localStorage.setItem('accounts', JSON.stringify(accounts.map((a) => (a.department === departmentName && a.position === oldName ? { ...a, position: newName } : a))));
        }
    };

    const isDepartmentInUse = (name) => {
        const accounts = loadJsonArray('accounts');
        const flows = [...loadJsonArray('approvalFlows'), ...loadJsonArray('leaveApprovalFlows')];
        return accounts.some((a) => a.department === name) || flows.some((f) => f.type === 'department' && f.target === name);
    };

    const isPositionInUse = (departmentName, positionName) => {
        const accounts = loadJsonArray('accounts');
        return accounts.some((a) => a.department === departmentName && a.position === positionName);
    };

    const handleDeptDialogOpen = (idx = null) => { setDeptEditIdx(idx); setDeptName(idx !== null ? departments[idx].name : ''); setDeptDialogOpen(true); };
    const handleDeptDialogClose = () => { setDeptDialogOpen(false); setDeptName(''); setDeptEditIdx(null); };
    const handleDeptSave = () => {
        const trimmed = deptName.trim();
        if (!trimmed) { showSnackbar('部署名を入力してください', 'warning'); return; }
        if (departments.some((d, i) => d.name === trimmed && i !== deptEditIdx)) { showSnackbar('同じ部署名が既に存在します', 'warning'); return; }
        const next = [...departments];
        if (deptEditIdx !== null) {
            const oldName = next[deptEditIdx].name;
            next[deptEditIdx].name = trimmed;
            if (oldName !== trimmed) updateDepartmentReferences(oldName, trimmed);
        } else {
            next.push({ name: trimmed, positions: [] });
            setSelectedDeptIdx(next.length - 1);
        }
        setDepartments(next);
        saveDepartments(next);
        handleDeptDialogClose();
        showSnackbar(deptEditIdx !== null ? '部署を保存しました' : '部署を追加しました');
    };
    const handleDeptDeleteRequest = (idx) => {
        const target = departments[idx];
        if (!target) return;
        if (isDepartmentInUse(target.name)) {
            showSnackbar('利用中の部署は削除できません。アカウント・フローを先に変更してください', 'warning');
            return;
        }
        setDeleteTarget({ type: 'department', idx, name: target.name });
    };
    const handleDeptDeleteConfirm = (idx) => {
        const next = departments.filter((_, i) => i !== idx);
        setDepartments(next);
        saveDepartments(next);
        setSelectedDeptIdx(Math.min(selectedDeptIdx, next.length - 1));
        setDeleteTarget(null);
        showSnackbar('部署を削除しました');
    };

    const handlePosDialogOpen = (idx = null) => { setPosEditIdx(idx); setPosName(idx !== null ? departments[selectedDeptIdx].positions[idx]?.name || '' : ''); setPosDialogOpen(true); };
    const handlePosDialogClose = () => { setPosDialogOpen(false); setPosName(''); setPosEditIdx(null); };
    const handlePosSave = () => {
        const trimmed = posName.trim();
        if (!trimmed) { showSnackbar('役職名を入力してください', 'warning'); return; }
        const dep = departments[selectedDeptIdx];
        if (!dep) return;
        if (dep.positions.some((p, i) => p.name === trimmed && i !== posEditIdx)) { showSnackbar('同じ役職名が既に存在します', 'warning'); return; }
        const next = [...departments];
        if (posEditIdx !== null) {
            const oldName = next[selectedDeptIdx].positions[posEditIdx].name;
            next[selectedDeptIdx].positions[posEditIdx] = { name: trimmed };
            if (oldName !== trimmed) updatePositionReferences(next[selectedDeptIdx].name, oldName, trimmed);
        } else {
            next[selectedDeptIdx].positions.push({ name: trimmed });
        }
        setDepartments(next);
        saveDepartments(next);
        handlePosDialogClose();
        showSnackbar(posEditIdx !== null ? '役職を保存しました' : '役職を追加しました');
    };
    const handlePosDeleteRequest = (idx) => {
        const dep = departments[selectedDeptIdx];
        const target = dep?.positions[idx];
        if (!target) return;
        if (isPositionInUse(dep.name, target.name)) {
            showSnackbar('利用中の役職は削除できません。アカウントを先に変更してください', 'warning');
            return;
        }
        setDeleteTarget({ type: 'position', idx, departmentIdx: selectedDeptIdx, departmentName: dep.name, name: target.name });
    };
    const handlePosDeleteConfirm = (target) => {
        const next = [...departments];
        next[target.departmentIdx].positions = next[target.departmentIdx].positions.filter((_, i) => i !== target.idx);
        setDepartments(next);
        saveDepartments(next);
        setDeleteTarget(null);
        showSnackbar('役職を削除しました');
    };
    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        if (deleteTarget.type === 'department') handleDeptDeleteConfirm(deleteTarget.idx);
        else handlePosDeleteConfirm(deleteTarget);
    };

    const selectedDepartment = departments[selectedDeptIdx];
    const positionCount = departments.reduce((s, d) => s + d.positions.length, 0);

    return (
        <PageScaffold
            eyebrow="管理"
            title="所属部署・役職マスタ"
            subtitle="アカウント管理や申請フローで利用する部署・役職を一元管理します。"
            actions={(
                <Button variant="contained" color="primary" startIcon={<AddRoundedIcon />} onClick={() => handleDeptDialogOpen()}>
                    部署を追加
                </Button>
            )}
        >
            <Section tone="sunken" elevation={0}>
                <Stack direction="row" spacing={4} flexWrap="wrap">
                    <Stat label="部署数" value={`${departments.length}件`} tone="primary" />
                    <Stat label="役職数" value={`${positionCount}件`} tone="iris" />
                    <Stat label="選択部署" value={selectedDepartment?.name || '-'} tone="slate" textual />
                </Stack>
            </Section>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 260px) minmax(0, 1fr)', lg: 'minmax(0, 320px) minmax(0, 1fr)' },
                    gap: 2.5,
                    alignItems: 'flex-start',
                }}
            >
                <Section
                    title="部署一覧"
                    subtitle={`${departments.length}件の部署`}
                    actions={(
                        <Stack direction="row" spacing={0.5}>
                            <Tooltip title="部署名を編集">
                                <IconButton onClick={() => handleDeptDialogOpen(selectedDeptIdx)} disabled={!selectedDepartment} size="small"><EditRoundedIcon fontSize="small" /></IconButton>
                            </Tooltip>
                            <Tooltip title="部署を削除">
                                <IconButton color="error" onClick={() => handleDeptDeleteRequest(selectedDeptIdx)} disabled={departments.length <= 1 || !selectedDepartment} size="small"><DeleteRoundedIcon fontSize="small" /></IconButton>
                            </Tooltip>
                        </Stack>
                    )}
                >
                    <FormControl size="small" fullWidth sx={{ mb: 1.5, display: { md: 'none' } }}>
                        <InputLabel>部署を選択</InputLabel>
                        <Select value={selectedDeptIdx} label="部署を選択" onChange={(e) => setSelectedDeptIdx(Number(e.target.value))}>
                            {departments.map((d, idx) => <MenuItem key={d.name} value={idx}>{d.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <Stack spacing={0.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
                        {departments.map((dep, idx) => {
                            const active = idx === selectedDeptIdx;
                            return (
                                <Box
                                    key={dep.name}
                                    component="button"
                                    onClick={() => setSelectedDeptIdx(idx)}
                                    sx={{
                                        all: 'unset',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 1,
                                        paddingInline: 1.5,
                                        paddingBlock: 1.1,
                                        borderRadius: 'var(--radius-md)',
                                        background: active ? 'var(--accent-primary-soft)' : 'transparent',
                                        color: active ? 'var(--accent-primary-ink)' : 'var(--ink-primary)',
                                        fontWeight: active ? 700 : 500,
                                        transition: 'var(--motion-fast)',
                                        '&:hover': { background: active ? 'var(--accent-primary-soft)' : 'var(--surface-sunken)' },
                                    }}
                                >
                                    <Box>
                                        <Typography sx={{ fontWeight: 'inherit', fontSize: 14 }}>{dep.name}</Typography>
                                        <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>{dep.positions.length} 役職</Typography>
                                    </Box>
                                    {active && (
                                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)' }} />
                                    )}
                                </Box>
                            );
                        })}
                    </Stack>
                </Section>

                <Section
                    title={`${selectedDepartment?.name || '-'} の役職`}
                    subtitle="役職を追加・編集できます。利用中の役職は削除できません。"
                    actions={(
                        <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={() => handlePosDialogOpen()} disabled={!selectedDepartment}>
                            役職を追加
                        </Button>
                    )}
                >
                    {selectedDepartment && Array.isArray(selectedDepartment.positions) && selectedDepartment.positions.length > 0 ? (
                        <Stack spacing={1}>
                            {selectedDepartment.positions
                                .filter((p) => p && typeof p.name === 'string' && p.name.trim() !== '')
                                .map((p, idx) => (
                                    <Stack
                                        key={p.name}
                                        direction="row"
                                        alignItems="center"
                                        spacing={1}
                                        sx={{
                                            paddingInline: 1.5,
                                            paddingBlock: 1.1,
                                            background: 'var(--surface-sunken)',
                                            borderRadius: 'var(--radius-md)',
                                            transition: 'var(--motion-fast)',
                                            '&:hover': { background: 'var(--accent-primary-soft)' },
                                        }}
                                    >
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography sx={{ fontWeight: 600, color: 'var(--ink-primary)' }}>{p.name}</Typography>
                                            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>{selectedDepartment.name} 配下</Typography>
                                        </Box>
                                        <Tooltip title="編集"><IconButton size="small" onClick={() => handlePosDialogOpen(idx)}><EditRoundedIcon fontSize="small" /></IconButton></Tooltip>
                                        <Tooltip title="削除"><IconButton size="small" color="error" onClick={() => handlePosDeleteRequest(idx)}><DeleteRoundedIcon fontSize="small" /></IconButton></Tooltip>
                                    </Stack>
                                ))}
                        </Stack>
                    ) : (
                        <Box sx={{ paddingInline: 1.5, paddingBlock: 3, color: 'var(--ink-tertiary)', textAlign: 'center' }}>
                            <Typography variant="body2">役職がまだ登録されていません。</Typography>
                        </Box>
                    )}
                </Section>
            </Box>

            <Dialog open={deptDialogOpen} onClose={handleDeptDialogClose} maxWidth="xs" fullWidth>
                <DialogTitle>{deptEditIdx !== null ? '部署名編集' : '部署追加'}</DialogTitle>
                <DialogContent>
                    <TextField label="部署名" value={deptName} onChange={(e) => setDeptName(e.target.value)} fullWidth autoFocus sx={{ mt: 1 }} />
                </DialogContent>
                <DialogActions>
                    <Button variant="text" color="inherit" startIcon={<CancelRoundedIcon />} onClick={handleDeptDialogClose}>キャンセル</Button>
                    <Button variant="contained" startIcon={<SaveRoundedIcon />} onClick={handleDeptSave}>保存</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={posDialogOpen} onClose={handlePosDialogClose} maxWidth="xs" fullWidth>
                <DialogTitle>{posEditIdx !== null ? '役職編集' : '役職追加'}</DialogTitle>
                <DialogContent>
                    <TextField label="役職名" value={posName} onChange={(e) => setPosName(e.target.value)} fullWidth autoFocus sx={{ mt: 1 }} />
                </DialogContent>
                <DialogActions>
                    <Button variant="text" color="inherit" startIcon={<CancelRoundedIcon />} onClick={handlePosDialogClose}>キャンセル</Button>
                    <Button variant="contained" startIcon={<SaveRoundedIcon />} onClick={handlePosSave}>保存</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
            <AdminConfirmDialog
                open={Boolean(deleteTarget)}
                title={`${deleteTarget?.type === 'department' ? '部署' : '役職'}を削除しますか？`}
                message={
                    deleteTarget?.type === 'department'
                        ? `部署「${deleteTarget?.name || ''}」を削除します。`
                        : `${deleteTarget?.departmentName || ''} の役職「${deleteTarget?.name || ''}」を削除します。`
                }
                confirmLabel="削除"
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
            />
        </PageScaffold>
    );
}

const Stat = ({ label, value, tone = 'primary', textual = false }) => {
    const tones = {
        primary: 'var(--accent-primary)',
        iris: 'var(--accent-iris)',
        leaf: 'var(--accent-leaf)',
        slate: 'var(--ink-primary)',
    };
    return (
        <Box>
            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>{label}</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: textual ? 18 : 22, color: tones[tone], lineHeight: 1.2 }}>
                {value}
            </Typography>
        </Box>
    );
};

export default MasterSettings;
