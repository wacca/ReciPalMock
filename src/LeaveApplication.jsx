import { useState, useEffect } from 'react';
import {
    Box, TextField, Button, MenuItem, FormControl, InputLabel, Select, Snackbar, Alert, IconButton, Tooltip, Stack, Typography,
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import {
    LEAVE_TYPES,
    buildLeaveApplications,
    emptyLeaveRow,
    loadLeaveApplications,
    loadLeaveDrafts,
    normalizeLeaveRow,
    saveLeaveApplications,
    saveLeaveDrafts,
} from './leaveApplicationStore';
import AdminConfirmDialog from './components/AdminConfirmDialog';
import PageScaffold from './ui/PageScaffold.jsx';
import Section from './ui/Section.jsx';
import StatusChip from './ui/StatusChip.jsx';
import { KeyHint } from './ui/KeyHint.jsx';

const hasLeaveRowInput = (row = {}) =>
    row.leaveType !== emptyLeaveRow().leaveType ||
    ['date', 'reason'].some((field) => String(row[field] ?? '').trim() !== '');

function LeaveApplication({ userId }) {
    const location = useLocation();
    const [leaveList, setLeaveList] = useState([]);
    const [mode, setMode] = useState('list');
    const [editId, setEditId] = useState('new');
    const [leaveRows, setLeaveRows] = useState([emptyLeaveRow()]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [deleteRowTargetIndex, setDeleteRowTargetIndex] = useState(null);

    useEffect(() => {
        loadLeaveApplications();
        setLeaveList(loadLeaveDrafts());
    }, []);

    useEffect(() => {
        if (!location.state?.startNew) return;
        setEditId('new');
        setLeaveRows([emptyLeaveRow()]);
        setMode('edit');
    }, [location.state]);

    const resetForm = () => { setEditId('new'); setLeaveRows([emptyLeaveRow()]); };

    const handleEdit = (id) => {
        const draft = leaveList.find((d) => d.id === id);
        if (draft) {
            setEditId(id);
            setLeaveRows(draft.details?.length ? draft.details : [emptyLeaveRow()]);
            setMode('edit');
        }
    };

    const handleDeleteConfirm = () => {
        if (!deleteTargetId) return;
        const next = leaveList.filter((d) => d.id !== deleteTargetId);
        setLeaveList(next);
        saveLeaveDrafts(next);
        setDeleteTargetId(null);
        setSnackbar({ open: true, message: '下書きを削除しました' });
    };

    const handleRowChange = (i, field, value) => {
        const next = [...leaveRows];
        next[i] = { ...next[i], [field]: value };
        setLeaveRows(next);
    };

    const deleteRowAt = (i) => {
        const next = leaveRows.filter((_, x) => x !== i);
        setLeaveRows(next.length ? next : [emptyLeaveRow()]);
        setSnackbar({ open: true, message: '申請行を削除しました' });
    };
    const handleDeleteRow = (i) => {
        if (hasLeaveRowInput(leaveRows[i])) setDeleteRowTargetIndex(i);
        else deleteRowAt(i);
    };
    const handleDeleteRowConfirm = () => {
        if (deleteRowTargetIndex === null) return;
        deleteRowAt(deleteRowTargetIndex);
        setDeleteRowTargetIndex(null);
    };

    const handleSaveDraft = () => {
        const id = editId === 'new' ? `leave_${Date.now()}` : editId;
        const newDraft = { id, details: leaveRows.map(normalizeLeaveRow), status: '下書き', updated: new Date().toISOString() };
        const next = editId === 'new' ? [...leaveList, newDraft] : leaveList.map((d) => (d.id === id ? newDraft : d));
        setLeaveList(next);
        saveLeaveDrafts(next);
        setEditId(id);
        setMode('list');
        setSnackbar({ open: true, message: '下書きを保存しました' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const apps = buildLeaveApplications({ editId, rows: leaveRows, applicantId: userId });
        const prev = loadLeaveApplications();
        saveLeaveApplications([...apps, ...prev]);
        const next = leaveList.filter((d) => d.id !== editId);
        setLeaveList(next);
        saveLeaveDrafts(next);
        setSnackbar({ open: true, message: `${apps.length}件の休暇申請を送信しました` });
        resetForm();
        setMode('list');
    };

    const handleNew = () => { resetForm(); setMode('edit'); };

    const filledCount = leaveRows.filter(hasLeaveRowInput).length;

    if (mode === 'list') {
        return (
            <PageScaffold
                eyebrow="申請"
                title="休暇申請の下書き"
                subtitle="作成中の下書きを編集・送信できます。送信後は休暇履歴画面に反映されます。"
                actions={(
                    <Button variant="contained" color="primary" startIcon={<AddRoundedIcon />} onClick={handleNew}>
                        新規作成
                    </Button>
                )}
            >
                <Section padded>
                    {leaveList.length === 0 ? (
                        <Box sx={{ paddingBlock: 4, textAlign: 'center', color: 'var(--ink-tertiary)' }}>
                            <Typography variant="body2">下書きはありません。</Typography>
                            <Typography variant="caption">右上の「新規作成」から始めましょう。</Typography>
                        </Box>
                    ) : (
                        <Stack spacing={1.25}>
                            {leaveList.map((draft) => {
                                const first = draft.details?.[0] || emptyLeaveRow();
                                const summary = `${first.date || '-'} / ${first.leaveType}${draft.details?.length > 1 ? ` ほか${draft.details.length - 1}件` : ''}`;
                                return (
                                    <Box
                                        key={draft.id}
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: '1fr', md: '160px 80px 1fr auto' },
                                            alignItems: 'center',
                                            gap: 1.5,
                                            paddingInline: 2,
                                            paddingBlock: 1.5,
                                            borderRadius: 'var(--radius-md)',
                                            background: 'var(--surface-sunken)',
                                            transition: 'var(--motion-fast)',
                                            '&:hover': { background: 'var(--accent-primary-soft)' },
                                        }}
                                    >
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <StatusChip status="draft" size="sm" />
                                            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                                                {draft.updated ? new Date(draft.updated).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </Typography>
                                        </Stack>
                                        <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>{draft.details?.length || 0}件</Typography>
                                        <Typography variant="body2" sx={{ color: 'var(--ink-primary)' }}>{summary}</Typography>
                                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                            <Tooltip title="編集"><IconButton onClick={() => handleEdit(draft.id)}><EditRoundedIcon fontSize="small" /></IconButton></Tooltip>
                                            <Tooltip title="削除"><IconButton color="error" onClick={() => setDeleteTargetId(draft.id)}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton></Tooltip>
                                        </Stack>
                                    </Box>
                                );
                            })}
                        </Stack>
                    )}
                </Section>
                <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ open: false, message: '' })}>
                    <Alert severity="success" sx={{ width: '100%' }}>{snackbar.message}</Alert>
                </Snackbar>
                <AdminConfirmDialog
                    open={Boolean(deleteTargetId)}
                    title="下書きを削除しますか？"
                    message="選択した休暇申請の下書きを削除します。元に戻せません。"
                    confirmLabel="削除"
                    onCancel={() => setDeleteTargetId(null)}
                    onConfirm={handleDeleteConfirm}
                />
            </PageScaffold>
        );
    }

    return (
        <PageScaffold
            eyebrow="申請"
            title="休暇申請"
            subtitle="日付・申請種別・理由をシンプルに。複数件まとめて送信できます。"
            actions={(
                <>
                    <Button variant="text" startIcon={<ArrowBackRoundedIcon />} onClick={() => setMode('list')} sx={{ color: 'var(--ink-tertiary)' }}>
                        一覧に戻る
                    </Button>
                    <Button variant="outlined" color="primary" startIcon={<SaveRoundedIcon />} onClick={handleSaveDraft}>
                        下書き保存
                    </Button>
                    <Button form="leave-form" type="submit" variant="contained" color="primary" startIcon={<SendRoundedIcon />}>
                        送信
                    </Button>
                </>
            )}
        >
            <Box
                sx={{
                    position: 'sticky',
                    top: 60,
                    zIndex: 5,
                    paddingInline: 2,
                    paddingBlock: 1.25,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface-overlay)',
                    boxShadow: 'var(--shadow-1)',
                    backdropFilter: 'blur(8px)',
                }}
            >
                <Stack direction="row" alignItems="center" spacing={3} flexWrap="wrap">
                    <Stat label="申請件数" value={leaveRows.length} tone="primary" />
                    <Stat label="入力済み" value={filledCount} tone="leaf" />
                    <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', flex: 1 }}>
                        ＊送信は確認なしで進みます。日付と理由を確認してから送信してください。
                    </Typography>
                </Stack>
            </Box>

            <Box component="form" id="leave-form" onSubmit={handleSubmit}>
                <Stack spacing={1.5}>
                    {leaveRows.map((row, index) => (
                        <Section
                            key={index}
                            padded
                            sx={{
                                background: 'var(--surface-raised)',
                                animation: 'recrovaFloatIn 200ms cubic-bezier(.2,.8,.2,1)',
                            }}
                        >
                            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                                <Box
                                    sx={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 'var(--radius-pill)',
                                        background: 'var(--surface-sunken)',
                                        display: 'grid',
                                        placeItems: 'center',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: 'var(--ink-tertiary)',
                                        flexShrink: 0,
                                    }}
                                >
                                    {index + 1}
                                </Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
                                    {row.leaveType || '休暇申請'}
                                    <Typography component="span" variant="caption" sx={{ color: 'var(--ink-tertiary)', ml: 1 }}>
                                        {row.date || '日付未入力'}
                                    </Typography>
                                </Typography>
                                <Tooltip title="この行を削除">
                                    <IconButton color="error" onClick={() => handleDeleteRow(index)} size="small">
                                        <DeleteOutlineRoundedIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 200px) minmax(0, 200px) minmax(0, 1fr)' },
                                    gap: 1.5,
                                }}
                            >
                                <FormControl fullWidth>
                                    <InputLabel>申請種別</InputLabel>
                                    <Select value={row.leaveType} label="申請種別" onChange={(e) => handleRowChange(index, 'leaveType', e.target.value)} required>
                                        {LEAVE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <TextField
                                    label="日付"
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    value={row.date}
                                    onChange={(e) => handleRowChange(index, 'date', e.target.value)}
                                    required
                                    fullWidth
                                />
                                <TextField
                                    label="理由・備考"
                                    multiline
                                    minRows={1}
                                    maxRows={4}
                                    value={row.reason}
                                    onChange={(e) => handleRowChange(index, 'reason', e.target.value)}
                                    fullWidth
                                />
                            </Box>
                        </Section>
                    ))}
                </Stack>

                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    sx={{ mt: 2 }}
                >
                    <Button
                        variant="outlined"
                        startIcon={<AddRoundedIcon />}
                        onClick={() => setLeaveRows([...leaveRows, emptyLeaveRow()])}
                        sx={{ borderStyle: 'dashed', flex: { xs: 'auto', sm: 1 }, paddingBlock: 1.2, color: 'var(--ink-tertiary)' }}
                    >
                        申請行を追加
                    </Button>
                    <Box sx={{ flex: { xs: 'auto', sm: '0 0 auto' } }}>
                        <KeyHint keys={['Tab']} />
                        <Typography variant="caption" sx={{ color: 'var(--ink-muted)', ml: 1 }}>で次の入力へ</Typography>
                    </Box>
                </Stack>
            </Box>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ open: false, message: '' })}>
                <Alert severity="success" sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
            <AdminConfirmDialog
                open={deleteRowTargetIndex !== null}
                title="申請行を削除しますか？"
                message={`#${deleteRowTargetIndex + 1} の申請行を削除します。入力内容も失われます。`}
                confirmLabel="削除"
                onCancel={() => setDeleteRowTargetIndex(null)}
                onConfirm={handleDeleteRowConfirm}
            />
        </PageScaffold>
    );
}

const Stat = ({ label, value, tone = 'primary' }) => {
    const tones = { primary: 'var(--accent-primary)', leaf: 'var(--accent-leaf)' };
    return (
        <Box>
            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', display: 'block', lineHeight: 1 }}>{label}</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 22, color: tones[tone], lineHeight: 1.1 }} className="tabular-nums">
                {value}<Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'var(--ink-tertiary)', fontSize: 12, fontWeight: 600 }}>件</Typography>
            </Typography>
        </Box>
    );
};

export default LeaveApplication;
