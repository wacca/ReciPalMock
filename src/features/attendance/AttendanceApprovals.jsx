import { useState, useEffect, useMemo } from 'react';
import {
    Box, Stack, Snackbar, Alert, TextField, FormControl, Select, MenuItem, Button, Typography, Tabs, Tab,
    InputLabel, ToggleButton, ToggleButtonGroup, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Collapse,
} from '@mui/material';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import {
    loadAttendanceTimesheets, saveAttendanceTimesheets, upsertAttendance, getAttendanceIntegrationStatus,
} from './attendanceStore';
import { getLastNMonths } from '../../shared/utils/dateRangeHelpers';
import PageScaffold from '../../shared/ui/PageScaffold.jsx';
import Section from '../../shared/ui/Section.jsx';
import StatusChip from '../../shared/ui/StatusChip.jsx';
import ApplicationCard from '../../shared/ui/ApplicationCard.jsx';
import IntegrationStatusChip from '../../shared/ui/IntegrationStatusChip.jsx';
import UnapproveDialog from '../../shared/components/UnapproveDialog.jsx';
import ApplicationHistoryTimeline from '../../shared/components/ApplicationHistoryTimeline.jsx';
import {
    HISTORY_EVENTS, appendHistory, createHistoryEntry,
} from '../../shared/utils/applicationHistory';

const approvers = [
    { value: 'user1', label: '油ニ 和平(univapay@univa.tech)' },
    { value: 'user2', label: '由引 安人(ubiast@univa.tech)' },
];

const HISTORY_STATUS_OPTIONS = ['承認済', '差戻し'];

const toStatusKey = (s) => (
    s === '承認済' ? 'approved' : s === '差戻し' ? 'rejected' : s === '取消' ? 'cancelled' : 'pending'
);

const pad2 = (v) => String(v).padStart(2, '0');
const parseTime = (v) => {
    if (!v) return null;
    const [h, m] = v.split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
};
const formatDuration = (m) => {
    if (m === null || m === undefined || !Number.isFinite(m)) return '-';
    const sign = m < 0 ? '-' : '';
    const a = Math.abs(m);
    return `${sign}${Math.floor(a / 60)}:${pad2(a % 60)}`;
};
const getBreak = (g) => (g > 8 * 60 ? 60 : g > 6 * 60 ? 45 : 0);
const dayTotalMinutes = (entry) => {
    if (!entry || entry.type !== '出勤') return 0;
    const ci = parseTime(entry.clockIn);
    const co = parseTime(entry.clockOut);
    if (ci === null || co === null) return 0;
    const end = co < ci ? co + 24 * 60 : co;
    const gross = end - ci;
    return Math.max(0, gross - getBreak(gross));
};
const computeSummary = (entries) => {
    const list = Object.values(entries || {});
    const count = (t) => list.filter((e) => e.type === t).length;
    const totalMinutes = list.reduce((s, e) => s + dayTotalMinutes(e), 0);
    return {
        workDays: count('出勤'),
        absenceDays: count('欠勤'),
        paidLeaveDays: count('有給'),
        substituteLeaveDays: count('振替休日'),
        totalWork: totalMinutes,
    };
};

const inDateRange = (date, from, to) => {
    if (!date) return !from && !to;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
};

const MOCK_SERVER_MS = 500;
const COLLAPSE_TOTAL_MS = 280;

function AttendanceApprovals() {
    const [records, setRecords] = useState([]);
    const [commentMap, setCommentMap] = useState({});
    const [selectedApprover, setSelectedApprover] = useState('user1');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [showRejectFor, setShowRejectFor] = useState(null);
    const [tab, setTab] = useState('pending');
    const [pendingMap, setPendingMap] = useState({});
    const [decidingMap, setDecidingMap] = useState({});
    const [unapproveTargetId, setUnapproveTargetId] = useState(null);
    const [expandedHistoryId, setExpandedHistoryId] = useState(null);

    const defaultRange = useMemo(() => getLastNMonths(3), []);
    const [historyFrom, setHistoryFrom] = useState(defaultRange.from);
    const [historyTo, setHistoryTo] = useState(defaultRange.to);
    const [historyStatus, setHistoryStatus] = useState('all');
    const [historyMineOnly, setHistoryMineOnly] = useState(true);

    useEffect(() => { setRecords(loadAttendanceTimesheets()); }, []);

    const persist = (next) => { setRecords(next); saveAttendanceTimesheets(next); };

    const currentApproverLabel = approvers.find((a) => a.value === selectedApprover)?.label || '';

    const handleStatus = (id, newStatus) => {
        const target = records.find((r) => r.id === id);
        if (!target) return;
        if (pendingMap[id] || decidingMap[id]) return;
        const comment = (commentMap[id] || '').trim();
        if (newStatus === '差戻し' && !comment) {
            setShowRejectFor(id);
            return;
        }
        const decideKey = newStatus === '承認済' ? 'approved' : 'rejected';
        // Phase 1: サーバ往復中 spinner
        setPendingMap((m) => ({ ...m, [id]: decideKey }));

        setTimeout(() => {
            // Phase 2: レスポンス到達 → Snackbar + 退場アニメ
            setPendingMap((m) => {
                const { [id]: _, ...rest } = m;
                return rest;
            });
            setDecidingMap((m) => ({ ...m, [id]: decideKey }));
            setSnackbar({ open: true, message: newStatus === '承認済' ? '勤怠を承認しました' : '勤怠を差戻しました', severity: 'success' });

            setTimeout(() => {
                // Phase 3: 退場完了 → persist
                const historyEntry = createHistoryEntry({
                    eventType: newStatus === '承認済' ? HISTORY_EVENTS.APPROVE : HISTORY_EVENTS.REJECT,
                    actorLabel: currentApproverLabel,
                    fromStatus: '申請中',
                    toStatus: newStatus,
                    comment: newStatus === '差戻し' ? comment : '',
                });
                const updated = {
                    ...target,
                    approvalStatus: newStatus,
                    approvedBy: currentApproverLabel,
                    approvedAt: new Date().toISOString(),
                    remarks: newStatus === '差戻し' ? comment : '',
                    integrationStatus: newStatus === '承認済' ? 'pending' : 'not_applicable',
                    history: appendHistory(target.history, historyEntry),
                };
                persist(upsertAttendance(records, updated));
                setCommentMap((cm) => ({ ...cm, [id]: '' }));
                setShowRejectFor(null);
                setDecidingMap((m) => {
                    const { [id]: _, ...rest } = m;
                    return rest;
                });
            }, COLLAPSE_TOTAL_MS);
        }, MOCK_SERVER_MS);
    };

    const unapproveTarget = useMemo(() => (
        records.find((r) => r.id === unapproveTargetId) || null
    ), [records, unapproveTargetId]);

    const canUnapprove = (rec) => {
        if (!rec) return false;
        if (rec.approvalStatus !== '承認済') return false;
        if (rec.closingStatus === 'closed') return false;       // 締め済は不可
        if (rec.integrationStatus === 'synced') return false;   // 給与 SaaS 連携済は不可
        return true;
    };

    const handleUnapproveConfirm = (reason) => {
        if (!unapproveTarget) return;
        const targetId = unapproveTarget.id;
        const historyEntry = createHistoryEntry({
            eventType: HISTORY_EVENTS.UNAPPROVE,
            actorLabel: currentApproverLabel,
            fromStatus: '承認済',
            toStatus: '申請中',
            comment: reason,
        });
        const updated = {
            ...unapproveTarget,
            approvalStatus: '申請中',
            approvedBy: '',
            approvedAt: '',
            remarks: '',
            integrationStatus: 'not_applicable',
            history: appendHistory(unapproveTarget.history, historyEntry),
        };
        persist(upsertAttendance(records, updated));
        setUnapproveTargetId(null);
        setSnackbar({
            open: true,
            message: '勤怠の承認を取り消しました。',
            severity: 'info',
        });
        // 取り消し対象のカードが履歴タブにいなくなるので展開状態もクリア
        if (expandedHistoryId === targetId) setExpandedHistoryId(null);
    };

    const approvalTargets = useMemo(() => (
        records.filter((r) => r.approvalStatus === '申請中').sort((a, b) => (a.submittedAt || '').localeCompare(b.submittedAt || ''))
    ), [records]);

    const historyRows = useMemo(() => (
        records
            .filter((r) => HISTORY_STATUS_OPTIONS.includes(r.approvalStatus))
            .filter((r) => {
                if (historyStatus !== 'all' && r.approvalStatus !== historyStatus) return false;
                const ref = (r.approvedAt || '').slice(0, 10);
                if (!inDateRange(ref, historyFrom, historyTo)) return false;
                if (historyMineOnly && r.approvedBy !== currentApproverLabel) return false;
                return true;
            })
            .sort((a, b) => (b.approvedAt || '').localeCompare(a.approvedAt || ''))
    ), [records, historyStatus, historyFrom, historyTo, historyMineOnly, currentApproverLabel]);

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
            title="勤怠承認"
            subtitle="部下の月次勤怠を承認/差戻しできます。承認結果は給与 SaaS への連携対象になります。"
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
                    <Tab value="pending" icon={<HowToRegRoundedIcon fontSize="small" />} iconPosition="start" label={`承認待ち (${approvalTargets.length})`} />
                    <Tab value="history" icon={<HistoryRoundedIcon fontSize="small" />} iconPosition="start" label={`承認履歴 (${historyRows.length})`} />
                </Tabs>
            </Box>

            {tab === 'pending' && (
                approvalTargets.length === 0 ? (
                    <Section padded sx={{ textAlign: 'center', paddingBlock: 6 }}>
                        <HowToRegRoundedIcon sx={{ fontSize: 40, color: 'var(--accent-leaf)' }} />
                        <Typography variant="body2" sx={{ color: 'var(--ink-tertiary)', mt: 1, fontWeight: 600 }}>承認待ちの勤怠申請はありません。</Typography>
                    </Section>
                ) : (
                    <Stack spacing={1.5}>
                        {approvalTargets.map((rec) => {
                            const summary = computeSummary(rec.entries);
                            const comment = commentMap[rec.id] || '';
                            const showReject = showRejectFor === rec.id;
                            return (
                                <ApplicationCard key={rec.id} statusKey="pending" decidingAs={decidingMap[rec.id] || null}>
                                    <Box sx={{ paddingInline: { xs: 2, md: 3 }, paddingLeft: { xs: 2.5, md: 3.5 }, paddingBlock: 2 }}>
                                        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1.5}>
                                            <Box>
                                                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                                        {rec.year}年{rec.month}月
                                                    </Typography>
                                                    <StatusChip status="pending" />
                                                </Stack>
                                                <Typography variant="body2" sx={{ color: 'var(--ink-secondary)', mt: 0.5, fontWeight: 600 }}>
                                                    {rec.userName}
                                                    <Typography component="span" variant="caption" sx={{ color: 'var(--ink-tertiary)', ml: 1 }}>
                                                        {rec.department}
                                                    </Typography>
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                                                    申請: {rec.submittedAt ? new Date(rec.submittedAt).toLocaleString() : '-'}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                        <TableContainer sx={{ mt: 1.5, borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)' }}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>出勤日数</TableCell>
                                                        <TableCell>欠勤日数</TableCell>
                                                        <TableCell>有給</TableCell>
                                                        <TableCell>振替休日</TableCell>
                                                        <TableCell align="right">総就業時間</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell className="tabular-nums">{summary.workDays}日</TableCell>
                                                        <TableCell className="tabular-nums">{summary.absenceDays}日</TableCell>
                                                        <TableCell className="tabular-nums">{summary.paidLeaveDays}日</TableCell>
                                                        <TableCell className="tabular-nums">{summary.substituteLeaveDays}日</TableCell>
                                                        <TableCell className="tabular-nums" align="right" sx={{ fontWeight: 700 }}>{formatDuration(summary.totalWork)}</TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }} sx={{ mt: 2 }}>
                                            <TextField
                                                label="承認者備考（差戻し時は必須）"
                                                size="small"
                                                value={comment}
                                                onChange={(e) => setCommentMap({ ...commentMap, [rec.id]: e.target.value })}
                                                sx={{ flex: 1 }}
                                                error={showReject && !comment.trim()}
                                                helperText={showReject && !comment.trim() ? '差戻しには備考を入力してください' : null}
                                            />
                                            <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center" flexShrink={0}>
                                                {(() => {
                                                    const pending = pendingMap[rec.id] || decidingMap[rec.id];
                                                    const isBusy = Boolean(pending);
                                                    return (
                                                        <>
                                                            <Button
                                                                variant="outlined"
                                                                color="warning"
                                                                startIcon={pending === 'rejected'
                                                                    ? <CircularProgress size={16} color="inherit" />
                                                                    : <AssignmentReturnRoundedIcon />}
                                                                onClick={() => handleStatus(rec.id, '差戻し')}
                                                                disabled={isBusy}
                                                            >
                                                                差戻す
                                                            </Button>
                                                            <Button
                                                                variant="contained"
                                                                color="primary"
                                                                startIcon={pending === 'approved'
                                                                    ? <CircularProgress size={16} color="inherit" />
                                                                    : <CheckCircleRoundedIcon />}
                                                                onClick={() => handleStatus(rec.id, '承認済')}
                                                                disabled={isBusy}
                                                            >
                                                                承認する
                                                            </Button>
                                                        </>
                                                    );
                                                })()}
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
                                <TextField size="small" type="date" label="承認日（開始）" InputLabelProps={{ shrink: true }} value={historyFrom} onChange={(e) => setHistoryFrom(e.target.value)} />
                                <TextField size="small" type="date" label="承認日（終了）" InputLabelProps={{ shrink: true }} value={historyTo} onChange={(e) => setHistoryTo(e.target.value)} />
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
                                <Button variant="text" color="inherit" size="small" startIcon={<RestartAltRoundedIcon />} onClick={handleResetHistory} disabled={!historyFiltersActive}>
                                    リセット
                                </Button>
                            </Stack>
                        </Stack>
                    </Section>

                    {historyRows.length === 0 ? (
                        <Section padded sx={{ textAlign: 'center', paddingBlock: 6 }}>
                            <SearchOffRoundedIcon sx={{ fontSize: 40, color: 'var(--ink-tertiary)' }} />
                            <Typography variant="body2" sx={{ color: 'var(--ink-tertiary)', mt: 1 }}>
                                条件に一致する承認履歴はありません。
                            </Typography>
                        </Section>
                    ) : (
                        <Stack spacing={1.25}>
                            {historyRows.map((rec) => {
                                const summary = computeSummary(rec.entries);
                                const statusKey = toStatusKey(rec.approvalStatus);
                                const integration = getAttendanceIntegrationStatus(rec);
                                const isExpanded = expandedHistoryId === rec.id;
                                const historyCount = (rec.history || []).length;
                                const isMine = rec.approvedBy === currentApproverLabel;
                                const unapproveEnabled = rec.approvalStatus === '承認済' && canUnapprove(rec) && isMine;
                                const disabledReason = !isMine ? '自分が承認した勤怠のみ取消できます'
                                    : rec.closingStatus === 'closed' ? '締め済の月は取消できません'
                                    : rec.integrationStatus === 'synced' ? '給与 SaaS 連携済のため取消できません'
                                    : '';
                                return (
                                    <ApplicationCard key={rec.id} statusKey={statusKey} hoverable={false}>
                                        <Box sx={{ paddingInline: { xs: 2, md: 3 }, paddingLeft: { xs: 2.5, md: 3.5 }, paddingBlock: 1.75 }}>
                                            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1.5}>
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                            {rec.year}年{rec.month}月
                                                        </Typography>
                                                        <StatusChip status={statusKey} size="sm" />
                                                        {rec.approvalStatus === '承認済' && (
                                                            <IntegrationStatusChip status={integration} target="attendance" size="sm" />
                                                        )}
                                                        {rec.closingStatus === 'closed' && (
                                                            <IntegrationStatusChip status="closed" size="sm" />
                                                        )}
                                                    </Stack>
                                                    <Typography variant="body2" sx={{ color: 'var(--ink-secondary)', mt: 0.5, fontWeight: 600 }}>
                                                        申請者: {rec.userName}
                                                        <Typography component="span" variant="caption" sx={{ color: 'var(--ink-tertiary)', ml: 1 }}>
                                                            {rec.department}
                                                        </Typography>
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', display: 'block', mt: 0.25 }}>
                                                        承認: {rec.approvedBy || '-'}
                                                        {rec.approvedAt && ` ・ ${new Date(rec.approvedAt).toLocaleString()}`}
                                                    </Typography>
                                                    {rec.approvalStatus === '差戻し' && rec.remarks && (
                                                        <Typography variant="caption" sx={{ color: 'var(--accent-rose)', display: 'block', mt: 0.25 }}>
                                                            備考: {rec.remarks}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <Stack direction="row" spacing={3} alignItems="center">
                                                    <Box sx={{ textAlign: 'right' }}>
                                                        <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', display: 'block' }}>出勤</Typography>
                                                        <Typography sx={{ fontWeight: 800, fontSize: 18, color: 'var(--ink-primary)' }} className="tabular-nums">{summary.workDays}日</Typography>
                                                    </Box>
                                                    <Box sx={{ textAlign: 'right' }}>
                                                        <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', display: 'block' }}>総就業</Typography>
                                                        <Typography sx={{ fontWeight: 800, fontSize: 18, color: 'var(--accent-iris)' }} className="tabular-nums">{formatDuration(summary.totalWork)}</Typography>
                                                    </Box>
                                                </Stack>
                                            </Stack>
                                            <Stack direction="row" spacing={1} sx={{ mt: 1.25 }} alignItems="center" flexWrap="wrap">
                                                <Button
                                                    size="small"
                                                    variant="text"
                                                    color="inherit"
                                                    startIcon={isExpanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                                                    onClick={() => setExpandedHistoryId(isExpanded ? null : rec.id)}
                                                    sx={{ color: 'var(--ink-tertiary)' }}
                                                >
                                                    操作履歴{historyCount > 0 ? ` (${historyCount})` : ''}
                                                </Button>
                                                <Box sx={{ flex: 1 }} />
                                                {rec.approvalStatus === '承認済' && (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="warning"
                                                        startIcon={<UndoRoundedIcon />}
                                                        onClick={() => setUnapproveTargetId(rec.id)}
                                                        disabled={!unapproveEnabled}
                                                        title={disabledReason}
                                                    >
                                                        承認を取り消す
                                                    </Button>
                                                )}
                                            </Stack>
                                            <Collapse in={isExpanded} unmountOnExit>
                                                <Box sx={{ mt: 1.5, paddingInline: 1.5, paddingBlock: 1.5, borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)' }}>
                                                    <ApplicationHistoryTimeline history={rec.history} />
                                                </Box>
                                            </Collapse>
                                        </Box>
                                    </ApplicationCard>
                                );
                            })}
                        </Stack>
                    )}
                </>
            )}

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ open: false, message: '', severity: 'success' })}>
                <Alert severity={snackbar.severity || 'success'} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>

            <UnapproveDialog
                open={Boolean(unapproveTarget)}
                title="勤怠承認を取り消しますか？"
                description={unapproveTarget
                    ? `${unapproveTarget.userName} さんの ${unapproveTarget.year}年${unapproveTarget.month}月 の勤怠承認を取り消し、「承認待ち」に戻します。`
                    : ''}
                onCancel={() => setUnapproveTargetId(null)}
                onConfirm={handleUnapproveConfirm}
            />
        </PageScaffold>
    );
}

export default AttendanceApprovals;
