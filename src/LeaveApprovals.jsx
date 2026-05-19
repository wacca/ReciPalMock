import { useState, useEffect, useMemo } from 'react';
import {
    Box, Stack, Snackbar, Alert, TextField, FormControl, Select, MenuItem, Button, Typography, Tabs, Tab,
    InputLabel, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import { loadLeaveApplications, saveLeaveApplications } from './leaveApplicationStore';
import { getLastNMonths, inDateRange } from './dateRangeHelpers';
import PageScaffold from './ui/PageScaffold.jsx';
import Section from './ui/Section.jsx';
import StatusChip from './ui/StatusChip.jsx';
import ApplicationCard from './ui/ApplicationCard.jsx';
import IntegrationStatusChip from './ui/IntegrationStatusChip.jsx';

const approvers = [
    { value: 'user1', label: '油ニ 和平(univapay@univa.tech)' },
    { value: 'user2', label: '由引 安人(ubiast@univa.tech)' },
];

const HISTORY_STATUS_OPTIONS = ['承認済', '非承認'];

const toStatusKey = (s) => (
    s === '承認済' ? 'approved' : s === '非承認' ? 'rejected' : s === '取消' ? 'cancelled' : 'pending'
);

function LeaveApprovals() {
    const [data, setData] = useState([]);
    const [commentMap, setCommentMap] = useState({});
    const [selectedApprover, setSelectedApprover] = useState('user1');
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    const [showRejectFor, setShowRejectFor] = useState(null);
    const [tab, setTab] = useState('pending');

    const defaultRange = useMemo(() => getLastNMonths(3), []);
    const [historyFrom, setHistoryFrom] = useState(defaultRange.from);
    const [historyTo, setHistoryTo] = useState(defaultRange.to);
    const [historyStatus, setHistoryStatus] = useState('all');
    const [historyMineOnly, setHistoryMineOnly] = useState(true);

    useEffect(() => { setData(loadLeaveApplications()); }, []);

    const persist = (next) => { setData(next); saveLeaveApplications(next); };

    const currentApproverLabel = approvers.find((a) => a.value === selectedApprover)?.label || '';

    const handleStatus = (id, status) => {
        const comment = (commentMap[id] || '').trim();
        if (status === '非承認' && !comment) {
            setShowRejectFor(id);
            return;
        }
        const next = data.map((row) => (
            row.id === id ? {
                ...row,
                status,
                remarks: status === '非承認' ? comment : '',
                approvedBy: currentApproverLabel,
                approvedAt: new Date().toISOString(),
                integrationStatus: status === '承認済' ? 'pending' : 'not_applicable',
            } : row
        ));
        persist(next);
        setCommentMap({ ...commentMap, [id]: '' });
        setShowRejectFor(null);
        setSnackbar({ open: true, message: status === '承認済' ? '休暇申請を承認しました' : '休暇申請を非承認にしました' });
    };

    const approvalTargets = useMemo(() => (
        data.filter((row) => (row.status || '申請中') === '申請中')
    ), [data]);

    const historyRows = useMemo(() => (
        data
            .filter((row) => HISTORY_STATUS_OPTIONS.includes(row.status))
            .filter((row) => {
                if (historyStatus !== 'all' && row.status !== historyStatus) return false;
                const ref = (row.approvedAt || '').slice(0, 10) || row.date;
                if (!inDateRange(ref, historyFrom, historyTo)) return false;
                if (historyMineOnly && row.approvedBy !== currentApproverLabel) return false;
                return true;
            })
            .sort((a, b) => (b.approvedAt || b.date || '').localeCompare(a.approvedAt || a.date || ''))
    ), [data, historyStatus, historyFrom, historyTo, historyMineOnly, currentApproverLabel]);

    const handleResetHistory = () => {
        setHistoryFrom(defaultRange.from);
        setHistoryTo(defaultRange.to);
        setHistoryStatus('all');
        setHistoryMineOnly(true);
    };

    const isDefaultHistoryRange = historyFrom === defaultRange.from && historyTo === defaultRange.to;
    const historyFiltersActive = !isDefaultHistoryRange || historyStatus !== 'all' || !historyMineOnly;

    return (
        <PageScaffold
            eyebrow="承認"
            title="休暇承認"
            subtitle="申請中の承認、過去の承認履歴をタブで切り替えて確認できます。"
            actions={(
                <FormControl size="small" sx={{ minWidth: 260 }}>
                    <Select value={selectedApprover} onChange={(e) => setSelectedApprover(e.target.value)}>
                        {approvers.map((a) => <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>)}
                    </Select>
                </FormControl>
            )}
        >
            <Box sx={{ borderBottom: '1px solid var(--surface-border)' }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ '& .MuiTab-root': { fontWeight: 700, minHeight: 44 } }}>
                    <Tab
                        value="pending"
                        icon={<HowToRegRoundedIcon fontSize="small" />}
                        iconPosition="start"
                        label={`承認待ち (${approvalTargets.length})`}
                    />
                    <Tab
                        value="history"
                        icon={<HistoryRoundedIcon fontSize="small" />}
                        iconPosition="start"
                        label={`承認履歴 (${historyRows.length})`}
                    />
                </Tabs>
            </Box>

            {tab === 'pending' && (
                approvalTargets.length === 0 ? (
                    <Section padded sx={{ textAlign: 'center', paddingBlock: 6 }}>
                        <HowToRegRoundedIcon sx={{ fontSize: 40, color: 'var(--accent-leaf)' }} />
                        <Typography variant="body2" sx={{ color: 'var(--ink-tertiary)', mt: 1, fontWeight: 600 }}>承認待ちの休暇申請はありません。</Typography>
                    </Section>
                ) : (
                    <Stack spacing={1.25}>
                        {approvalTargets.map((row) => {
                            const comment = commentMap[row.id] || '';
                            const showReject = showRejectFor === row.id;
                            return (
                                <ApplicationCard key={row.id} statusKey="pending">
                                    <Box sx={{ paddingInline: { xs: 2, md: 3 }, paddingLeft: { xs: 2.5, md: 3.5 }, paddingBlock: 2 }}>
                                        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1.5}>
                                            <Box>
                                                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                        {row.leaveType} <Typography component="span" variant="body2" sx={{ color: 'var(--ink-tertiary)' }}>／ {row.date}</Typography>
                                                    </Typography>
                                                    <StatusChip status="pending" />
                                                </Stack>
                                                <Typography variant="body2" sx={{ color: 'var(--ink-secondary)', mt: 0.5, fontWeight: 600 }}>
                                                    {row.applicantName || '-'}
                                                    <Typography component="span" variant="caption" sx={{ color: 'var(--ink-tertiary)', ml: 1 }}>
                                                        {row.applicantDepartment || ''}
                                                    </Typography>
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'var(--ink-secondary)', mt: 0.5 }}>
                                                    {row.reason || '理由なし'}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                                                    申請: {row.submittedAt ? new Date(row.submittedAt).toLocaleString() : '-'}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }} sx={{ mt: 2 }}>
                                            <TextField
                                                label="承認者備考（非承認時は必須）"
                                                size="small"
                                                value={comment}
                                                onChange={(e) => setCommentMap({ ...commentMap, [row.id]: e.target.value })}
                                                sx={{ flex: 1 }}
                                                error={showReject && !comment.trim()}
                                                helperText={showReject && !comment.trim() ? '非承認には備考を入力してください' : ' '}
                                            />
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <Button variant="outlined" color="error" startIcon={<CancelRoundedIcon />} onClick={() => handleStatus(row.id, '非承認')}>
                                                    非承認
                                                </Button>
                                                <Button variant="contained" color="primary" startIcon={<CheckCircleRoundedIcon />} onClick={() => handleStatus(row.id, '承認済')}>
                                                    承認する
                                                </Button>
                                            </Stack>
                                        </Stack>
                                    </Box>
                                </ApplicationCard>
                            );
                        })}
                    </Stack>
                )
            )}

            {tab === 'history' && (
                <>
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
                                    label="承認日（開始）"
                                    InputLabelProps={{ shrink: true }}
                                    value={historyFrom}
                                    onChange={(e) => setHistoryFrom(e.target.value)}
                                />
                                <TextField
                                    size="small"
                                    type="date"
                                    label="承認日（終了）"
                                    InputLabelProps={{ shrink: true }}
                                    value={historyTo}
                                    onChange={(e) => setHistoryTo(e.target.value)}
                                />
                                <FormControl size="small">
                                    <InputLabel>状態</InputLabel>
                                    <Select label="状態" value={historyStatus} onChange={(e) => setHistoryStatus(e.target.value)}>
                                        <MenuItem value="all">すべて</MenuItem>
                                        {HISTORY_STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Box>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <ToggleButtonGroup
                                    exclusive
                                    size="small"
                                    value={historyMineOnly ? 'mine' : 'all'}
                                    onChange={(_, v) => { if (v) setHistoryMineOnly(v === 'mine'); }}
                                    sx={{
                                        background: 'var(--surface-raised)',
                                        borderRadius: 'var(--radius-pill)',
                                        padding: 0.5,
                                        boxShadow: 'var(--shadow-1)',
                                        '& .MuiToggleButton-root': {
                                            border: 0,
                                            borderRadius: 'var(--radius-pill) !important',
                                            paddingInline: 1.75,
                                            paddingBlock: 0.5,
                                            color: 'var(--ink-tertiary)',
                                            fontWeight: 700,
                                            fontSize: 12.5,
                                            '&.Mui-selected': {
                                                background: 'var(--accent-primary)',
                                                color: 'var(--surface-raised)',
                                                '&:hover': { background: 'var(--accent-primary)' },
                                            },
                                        },
                                    }}
                                >
                                    <ToggleButton value="mine">自分の承認分</ToggleButton>
                                    <ToggleButton value="all">すべての承認者</ToggleButton>
                                </ToggleButtonGroup>
                                <Button
                                    variant="text"
                                    color="inherit"
                                    size="small"
                                    startIcon={<RestartAltRoundedIcon />}
                                    onClick={handleResetHistory}
                                    disabled={!historyFiltersActive}
                                >
                                    リセット
                                </Button>
                            </Stack>
                        </Stack>
                    </Section>

                    {historyRows.length === 0 ? (
                        <Section padded sx={{ textAlign: 'center', paddingBlock: 6 }}>
                            <SearchOffRoundedIcon sx={{ fontSize: 40, color: 'var(--ink-muted)' }} />
                            <Typography variant="body2" sx={{ color: 'var(--ink-tertiary)', mt: 1 }}>
                                条件に一致する承認履歴はありません。
                            </Typography>
                        </Section>
                    ) : (
                        <Stack spacing={1.25}>
                            {historyRows.map((row) => {
                                const statusKey = toStatusKey(row.status);
                                return (
                                    <ApplicationCard key={row.id} statusKey={statusKey} hoverable={false}>
                                        <Box sx={{ paddingInline: { xs: 2, md: 3 }, paddingLeft: { xs: 2.5, md: 3.5 }, paddingBlock: 1.75 }}>
                                            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1.5}>
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                            {row.leaveType} <Typography component="span" variant="body2" sx={{ color: 'var(--ink-tertiary)' }}>／ {row.date}</Typography>
                                                        </Typography>
                                                        <StatusChip status={statusKey} size="sm" />
                                                        {row.status === '承認済' && (
                                                            <IntegrationStatusChip
                                                                status={row.integrationStatus && row.integrationStatus !== 'not_applicable' ? row.integrationStatus : 'pending'}
                                                                target="leave"
                                                                size="sm"
                                                            />
                                                        )}
                                                    </Stack>
                                                    <Typography variant="body2" sx={{ color: 'var(--ink-secondary)', mt: 0.5, fontWeight: 600 }}>
                                                        申請者: {row.applicantName || '-'}
                                                        <Typography component="span" variant="caption" sx={{ color: 'var(--ink-tertiary)', ml: 1 }}>
                                                            {row.applicantDepartment || ''}
                                                        </Typography>
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: 'var(--ink-secondary)', mt: 0.5 }}>
                                                        {row.reason || '理由なし'}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', display: 'block', mt: 0.25 }}>
                                                        承認: {row.approvedBy || '-'}
                                                        {row.approvedAt && ` ・ ${new Date(row.approvedAt).toLocaleString()}`}
                                                    </Typography>
                                                    {row.status === '非承認' && row.remarks && (
                                                        <Typography variant="caption" sx={{ color: 'var(--accent-rose)', display: 'block', mt: 0.25 }}>
                                                            備考: {row.remarks}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Stack>
                                        </Box>
                                    </ApplicationCard>
                                );
                            })}
                        </Stack>
                    )}
                </>
            )}

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ open: false, message: '' })}>
                <Alert severity="success" sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </PageScaffold>
    );
}

export default LeaveApprovals;
