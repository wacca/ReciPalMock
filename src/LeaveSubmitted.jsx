import { useState, useEffect } from 'react';
import {
    Box, Button, Dialog, DialogContent, DialogTitle, DialogActions, Snackbar, Alert, IconButton, Tooltip, TextField, Stack, Typography,
} from '@mui/material';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import { loadLeaveApplications, saveLeaveApplications } from './leaveApplicationStore';
import AdminConfirmDialog from './components/AdminConfirmDialog';
import PageScaffold from './ui/PageScaffold.jsx';
import Section from './ui/Section.jsx';
import StatusChip, { statusBarColor } from './ui/StatusChip.jsx';

const toStatusKey = (s) => {
    if (s === '承認済') return 'approved';
    if (s === '非承認') return 'rejected';
    if (s === '取消') return 'cancelled';
    return 'pending';
};

function LeaveSubmitted() {
    const [submitted, setSubmitted] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    const [cancelTargetId, setCancelTargetId] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editTargetId, setEditTargetId] = useState(null);
    const [editReason, setEditReason] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => { setSubmitted(loadLeaveApplications()); }, []);

    const persist = (next) => { setSubmitted(next); saveLeaveApplications(next); };

    const handleEditOpen = (row) => {
        setEditTargetId(row.id);
        setEditReason(row.reason || '');
        setEditDialogOpen(true);
    };
    const handleEditClose = () => { setEditDialogOpen(false); setEditTargetId(null); setEditReason(''); };
    const handleEditSave = () => {
        if (!editTargetId) return;
        persist(submitted.map((r) => (r.id === editTargetId ? { ...r, reason: editReason } : r)));
        handleEditClose();
        setSnackbar({ open: true, message: '休暇申請の理由・備考を保存しました' });
    };
    const handleCancelConfirm = () => {
        if (!cancelTargetId) return;
        persist(submitted.map((r) => (r.id === cancelTargetId ? { ...r, status: '取消', remarks: '' } : r)));
        setCancelTargetId(null);
        setSnackbar({ open: true, message: '休暇申請を取り消しました' });
    };
    const handleResubmit = (id) => {
        persist(submitted.map((r) => (r.id === id ? { ...r, status: '申請中', remarks: '', submittedAt: new Date().toISOString() } : r)));
        setSnackbar({ open: true, message: '休暇申請を再申請しました' });
    };

    const counts = submitted.reduce((acc, row) => { const k = row.status || '申請中'; acc[k] = (acc[k] || 0) + 1; return acc; }, {});

    return (
        <PageScaffold
            eyebrow="申請"
            title="休暇申請済 一覧"
            subtitle="一覧で確認します。申請中は取消、非承認は再申請できます。"
        >
            <Section tone="sunken" elevation={0}>
                <Stack direction="row" spacing={4} flexWrap="wrap">
                    <Stat label="申請数" value={submitted.length} tone="primary" />
                    <Stat label="申請中" value={counts['申請中'] || 0} tone="iris" />
                    <Stat label="承認済" value={counts['承認済'] || 0} tone="leaf" />
                    <Stat label="非承認" value={counts['非承認'] || 0} tone="rose" />
                </Stack>
            </Section>

            {submitted.length === 0 && (
                <Section padded sx={{ textAlign: 'center', paddingBlock: 6 }}>
                    <EventNoteRoundedIcon sx={{ fontSize: 40, color: 'var(--ink-muted)' }} />
                    <Typography variant="body2" sx={{ color: 'var(--ink-tertiary)', mt: 1 }}>申請履歴がありません。</Typography>
                </Section>
            )}

            <Stack spacing={1.25}>
                {submitted.map((row) => {
                    const status = row.status || '申請中';
                    const sKey = toStatusKey(status);
                    const expanded = expandedId === row.id;
                    return (
                        <Box
                            key={row.id}
                            sx={{
                                position: 'relative',
                                borderRadius: 'var(--radius-lg)',
                                background: 'var(--surface-raised)',
                                boxShadow: 'var(--shadow-1)',
                                overflow: 'hidden',
                                transition: 'var(--motion-fast)',
                                '&:hover': { boxShadow: 'var(--shadow-2)' },
                            }}
                        >
                            <Box aria-hidden sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: statusBarColor(sKey) }} />
                            <Box
                                onClick={() => setExpandedId(expanded ? null : row.id)}
                                sx={{
                                    cursor: 'pointer',
                                    paddingInline: { xs: 2, md: 3 },
                                    paddingLeft: { xs: 2.5, md: 3.5 },
                                    paddingBlock: 1.75,
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', md: '140px 140px 1fr 110px' },
                                    alignItems: 'center',
                                    gap: 2,
                                }}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.date || '-'}</Typography>
                                <Typography variant="body2" sx={{ color: 'var(--ink-secondary)' }}>{row.leaveType}</Typography>
                                <Typography variant="body2" sx={{
                                    color: 'var(--ink-primary)',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                    {row.reason || '理由なし'}
                                </Typography>
                                <Box sx={{ justifySelf: { xs: 'flex-start', md: 'flex-end' } }}>
                                    <StatusChip status={sKey} />
                                </Box>
                            </Box>

                            {expanded && (
                                <Box sx={{ paddingInline: { xs: 2, md: 3 }, paddingBottom: 2.5, animation: 'recrovaFloatIn 200ms' }}>
                                    <Stack spacing={1.5}>
                                        <KV label="申請日時" value={row.submittedAt ? new Date(row.submittedAt).toLocaleString() : '-'} />
                                        <KV label="理由・備考" value={row.reason || '-'} />
                                        {status === '非承認' && row.remarks && (
                                            <Alert severity="warning" sx={{ borderRadius: 'var(--radius-md)' }}>
                                                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>承認者備考</Typography>
                                                {row.remarks}
                                            </Alert>
                                        )}
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <Tooltip title="取消">
                                                <span>
                                                    <IconButton color="error" onClick={(e) => { e.stopPropagation(); setCancelTargetId(row.id); }} disabled={status !== '申請中'}>
                                                        <CancelRoundedIcon fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                            {status === '非承認' && (
                                                <>
                                                    <Tooltip title="編集">
                                                        <IconButton color="primary" onClick={(e) => { e.stopPropagation(); handleEditOpen(row); }}>
                                                            <EditRoundedIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="再申請">
                                                        <IconButton sx={{ color: 'var(--accent-leaf)' }} onClick={(e) => { e.stopPropagation(); handleResubmit(row.id); }}>
                                                            <ReplayRoundedIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}
                                        </Stack>
                                    </Stack>
                                </Box>
                            )}
                        </Box>
                    );
                })}
            </Stack>

            <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
                <DialogTitle>理由・備考を編集</DialogTitle>
                <DialogContent>
                    <TextField autoFocus fullWidth multiline minRows={3} label="理由・備考" value={editReason} onChange={(e) => setEditReason(e.target.value)} sx={{ mt: 1 }} />
                </DialogContent>
                <DialogActions>
                    <Button variant="text" color="inherit" startIcon={<CloseRoundedIcon />} onClick={handleEditClose}>キャンセル</Button>
                    <Button variant="contained" startIcon={<SaveRoundedIcon />} onClick={handleEditSave}>保存</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ open: false, message: '' })}>
                <Alert severity="success" sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
            <AdminConfirmDialog
                open={Boolean(cancelTargetId)}
                title="休暇申請を取り消しますか？"
                message="選択した休暇申請を取消状態にします。"
                confirmLabel="取消"
                confirmColor="warning"
                onCancel={() => setCancelTargetId(null)}
                onConfirm={handleCancelConfirm}
            />
        </PageScaffold>
    );
}

const Stat = ({ label, value, tone = 'primary' }) => {
    const tones = { primary: 'var(--accent-primary)', iris: 'var(--accent-iris)', leaf: 'var(--accent-leaf)', rose: 'var(--accent-rose)' };
    return (
        <Box>
            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', display: 'block', lineHeight: 1 }}>{label}</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 22, color: tones[tone], lineHeight: 1.1 }} className="tabular-nums">
                {value}<Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'var(--ink-tertiary)', fontSize: 12 }}>件</Typography>
            </Typography>
        </Box>
    );
};

const KV = ({ label, value }) => (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.25, sm: 2 }}>
        <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', minWidth: 100, fontWeight: 700 }}>{label}</Typography>
        <Typography variant="body2" sx={{ color: 'var(--ink-primary)', whiteSpace: 'pre-wrap' }}>{value}</Typography>
    </Stack>
);

export default LeaveSubmitted;
