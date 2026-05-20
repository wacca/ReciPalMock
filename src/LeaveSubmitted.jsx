import { useState, useEffect, useMemo } from 'react';
import {
    Box, Button, Dialog, DialogContent, DialogTitle, DialogActions, Snackbar, Alert, IconButton, Tooltip, TextField, Stack, Typography,
    FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import { formatLeavePeriod, loadLeaveApplications, saveLeaveApplications } from './leaveApplicationStore';
import { getFiscalYearRange } from './dateRangeHelpers';
import AdminConfirmDialog from './components/AdminConfirmDialog';
import PageScaffold from './ui/PageScaffold.jsx';
import Section from './ui/Section.jsx';
import StatusChip from './ui/StatusChip.jsx';
import ApplicationCard from './ui/ApplicationCard.jsx';
import IntegrationStatusChip from './ui/IntegrationStatusChip.jsx';

const STATUS_OPTIONS = ['申請中', '承認済', '非承認', '取消'];

const toStatusKey = (s) => {
    if (s === '承認済') return 'approved';
    if (s === '非承認') return 'rejected';
    if (s === '取消') return 'cancelled';
    return 'pending';
};

function LeaveSubmitted({ userId }) {
    const [submitted, setSubmitted] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    const [cancelTargetId, setCancelTargetId] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editTargetId, setEditTargetId] = useState(null);
    const [editReason, setEditReason] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    const defaultRange = useMemo(() => getFiscalYearRange(), []);
    const [dateFrom, setDateFrom] = useState(defaultRange.from);
    const [dateTo, setDateTo] = useState(defaultRange.to);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const all = loadLeaveApplications();
        setSubmitted(userId ? all.filter((row) => row.applicantId === userId) : all);
    }, [userId]);

    const persist = (next) => {
        setSubmitted(next);
        if (userId) {
            const all = loadLeaveApplications();
            const others = all.filter((row) => row.applicantId !== userId);
            saveLeaveApplications([...next, ...others]);
        } else {
            saveLeaveApplications(next);
        }
    };

    const filtered = useMemo(() => (
        submitted.filter((row) => {
            const rowFrom = row.dateFrom || row.date || '';
            const rowTo = row.dateTo || rowFrom;
            // 期間が指定範囲とオーバーラップする申請をヒットさせる
            if (dateFrom && rowTo && rowTo < dateFrom) return false;
            if (dateTo && rowFrom && rowFrom > dateTo) return false;
            if (!rowFrom && (dateFrom || dateTo)) return false;
            if (statusFilter !== 'all' && (row.status || '申請中') !== statusFilter) return false;
            return true;
        })
    ), [submitted, dateFrom, dateTo, statusFilter]);

    const handleResetFilters = () => {
        setDateFrom(defaultRange.from);
        setDateTo(defaultRange.to);
        setStatusFilter('all');
    };

    const isDefaultRange = dateFrom === defaultRange.from && dateTo === defaultRange.to;
    const filtersActive = !isDefaultRange || statusFilter !== 'all';

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
        setSnackbar({ open: true, message: '勤怠申請の理由・備考を保存しました' });
    };
    const handleCancelConfirm = () => {
        if (!cancelTargetId) return;
        persist(submitted.map((r) => (r.id === cancelTargetId ? { ...r, status: '取消', remarks: '' } : r)));
        setCancelTargetId(null);
        setSnackbar({ open: true, message: '勤怠申請を取り消しました' });
    };
    const handleResubmit = (id) => {
        persist(submitted.map((r) => (r.id === id ? { ...r, status: '申請中', remarks: '', submittedAt: new Date().toISOString() } : r)));
        setSnackbar({ open: true, message: '勤怠申請を再申請しました' });
    };

    const counts = filtered.reduce((acc, row) => { const k = row.status || '申請中'; acc[k] = (acc[k] || 0) + 1; return acc; }, {});

    return (
        <PageScaffold
            eyebrow="申請"
            title="勤怠申請履歴"
            subtitle="自分が出した勤怠申請（休暇・時間休・遅刻・早退）の履歴です。期間・状態で絞り込み、申請中は取消、非承認は再申請できます。"
            actions={(
                <Button
                    variant="text"
                    color="inherit"
                    startIcon={<RestartAltRoundedIcon />}
                    onClick={handleResetFilters}
                    disabled={!filtersActive}
                >
                    条件をリセット
                </Button>
            )}
        >
            <Section padded sx={{ paddingBlock: 2 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                    <Box sx={{
                        display: 'grid',
                        gap: 1.5,
                        gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, minmax(160px, 1fr))' },
                        flex: 1,
                    }}>
                        <TextField
                            size="small"
                            type="date"
                            label="対象日（開始）"
                            InputLabelProps={{ shrink: true }}
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                        <TextField
                            size="small"
                            type="date"
                            label="対象日（終了）"
                            InputLabelProps={{ shrink: true }}
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                        <FormControl size="small">
                            <InputLabel>状態</InputLabel>
                            <Select label="状態" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <MenuItem value="all">すべて</MenuItem>
                                {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Box>
                    {isDefaultRange && statusFilter === 'all' && (
                        <Box sx={{ minWidth: 180 }}>
                            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                                今年度（{defaultRange.from} 〜 {defaultRange.to}）を表示中
                            </Typography>
                        </Box>
                    )}
                </Stack>
            </Section>

            <Section tone="sunken" elevation={0}>
                <Stack direction="row" spacing={4} flexWrap="wrap">
                    <Stat label="該当件数" value={filtered.length} tone="primary" suffix={`件 / 全 ${submitted.length} 件`} />
                    <Stat label="申請中" value={counts['申請中'] || 0} tone="iris" />
                    <Stat label="承認済" value={counts['承認済'] || 0} tone="leaf" />
                    <Stat label="非承認" value={counts['非承認'] || 0} tone="rose" />
                </Stack>
            </Section>

            {submitted.length === 0 ? (
                <Section padded sx={{ textAlign: 'center', paddingBlock: 6 }}>
                    <EventNoteRoundedIcon sx={{ fontSize: 40, color: 'var(--ink-muted)' }} />
                    <Typography variant="body2" sx={{ color: 'var(--ink-tertiary)', mt: 1 }}>申請履歴がありません。</Typography>
                </Section>
            ) : filtered.length === 0 ? (
                <Section padded sx={{ textAlign: 'center', paddingBlock: 6 }}>
                    <SearchOffRoundedIcon sx={{ fontSize: 40, color: 'var(--ink-muted)' }} />
                    <Typography variant="body2" sx={{ color: 'var(--ink-tertiary)', mt: 1 }}>
                        条件に一致する申請はありません。期間や状態を見直してください。
                    </Typography>
                </Section>
            ) : null}

            <Stack spacing={1.25}>
                {filtered.map((row) => {
                    const status = row.status || '申請中';
                    const sKey = toStatusKey(status);
                    const expanded = expandedId === row.id;
                    return (
                        <ApplicationCard
                            key={row.id}
                            statusKey={sKey}
                            onClick={() => setExpandedId(expanded ? null : row.id)}
                        >
                            <Box
                                sx={{
                                    paddingInline: { xs: 2, md: 3 },
                                    paddingLeft: { xs: 2.5, md: 3.5 },
                                    paddingBlock: 1.75,
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', md: 'minmax(190px, auto) 100px 1fr minmax(110px, auto)' },
                                    alignItems: 'center',
                                    gap: 2,
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    className="tabular-nums"
                                    sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
                                >
                                    {formatLeavePeriod(row, { withDays: false })}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'var(--ink-secondary)', whiteSpace: 'nowrap' }}>{row.leaveType}</Typography>
                                <Typography variant="body2" sx={{
                                    color: 'var(--ink-primary)',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                    {row.reason || '理由なし'}
                                </Typography>
                                <Stack
                                    direction="row"
                                    spacing={0.75}
                                    alignItems="center"
                                    flexWrap="wrap"
                                    sx={{ justifySelf: { xs: 'flex-start', md: 'flex-end' }, rowGap: 0.5 }}
                                >
                                    <StatusChip status={sKey} />
                                    {status === '承認済' && (
                                        <IntegrationStatusChip
                                            status={row.integrationStatus && row.integrationStatus !== 'not_applicable' ? row.integrationStatus : 'pending'}
                                            target="leave"
                                            size="sm"
                                        />
                                    )}
                                </Stack>
                            </Box>

                            {expanded && (
                                <Box sx={{ paddingInline: { xs: 2, md: 3 }, paddingBottom: 2.5, animation: 'recrovaFloatIn 200ms' }}>
                                    <Stack spacing={1.5}>
                                        <KV label="申請日時" value={row.submittedAt ? new Date(row.submittedAt).toLocaleString('ja-JP') : '-'} />
                                        <KV label="理由・備考" value={row.reason || '理由は記入されていません'} />
                                        {status === '承認済' && (
                                            <>
                                                <KV label="承認者" value={row.approvedBy || '-'} />
                                                <KV label="承認日時" value={row.approvedAt ? new Date(row.approvedAt).toLocaleString('ja-JP') : '-'} />
                                                {row.integrationStatus && row.integrationStatus !== 'not_applicable' && (
                                                    <KV
                                                        label="勤怠SaaS連携"
                                                        value={
                                                            row.integrationStatus === 'synced' && row.integrationSyncedAt
                                                                ? `連携済（${new Date(row.integrationSyncedAt).toLocaleString('ja-JP')}）`
                                                                : row.integrationStatus === 'error'
                                                                    ? `連携エラー${row.integrationError ? `: ${row.integrationError}` : ''}`
                                                                    : '連携待ち'
                                                        }
                                                    />
                                                )}
                                            </>
                                        )}
                                        {status === '非承認' && row.remarks && (
                                            <Alert severity="warning" sx={{ borderRadius: 'var(--radius-md)' }}>
                                                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>承認者備考</Typography>
                                                {row.remarks}
                                            </Alert>
                                        )}
                                        {status === '取消' && (
                                            <Alert severity="info" sx={{ borderRadius: 'var(--radius-md)' }}>
                                                この申請は取り消されています。再度申請が必要な場合は「勤怠申請」画面から新規作成してください。
                                            </Alert>
                                        )}
                                        {(status === '申請中' || status === '非承認') && (
                                            <Stack
                                                direction="row"
                                                spacing={0.5}
                                                justifyContent="flex-end"
                                                alignItems="center"
                                            >
                                                {status === '申請中' && (
                                                    <Tooltip title="申請を取消">
                                                        <IconButton
                                                            color="error"
                                                            size="small"
                                                            onClick={(e) => { e.stopPropagation(); setCancelTargetId(row.id); }}
                                                        >
                                                            <RemoveCircleOutlineRoundedIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {status === '非承認' && (
                                                    <>
                                                        <Tooltip title="理由を編集">
                                                            <IconButton
                                                                color="primary"
                                                                size="small"
                                                                onClick={(e) => { e.stopPropagation(); handleEditOpen(row); }}
                                                            >
                                                                <EditRoundedIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="再申請">
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => { e.stopPropagation(); handleResubmit(row.id); }}
                                                                sx={{ color: 'var(--accent-leaf)' }}
                                                            >
                                                                <ReplayRoundedIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </>
                                                )}
                                            </Stack>
                                        )}
                                    </Stack>
                                </Box>
                            )}
                        </ApplicationCard>
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
                title="勤怠申請を取り消しますか？"
                message="選択した勤怠申請を取消状態にします。"
                confirmLabel="取消"
                confirmColor="warning"
                onCancel={() => setCancelTargetId(null)}
                onConfirm={handleCancelConfirm}
            />
        </PageScaffold>
    );
}

const Stat = ({ label, value, tone = 'primary', suffix = '件' }) => {
    const tones = { primary: 'var(--accent-primary)', iris: 'var(--accent-iris)', leaf: 'var(--accent-leaf)', rose: 'var(--accent-rose)' };
    return (
        <Box>
            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', display: 'block', lineHeight: 1 }}>{label}</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 22, color: tones[tone], lineHeight: 1.1 }} className="tabular-nums">
                {value}<Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'var(--ink-tertiary)', fontSize: 12 }}>{suffix}</Typography>
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
