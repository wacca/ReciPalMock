import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    Box, Stack, Snackbar, Alert, TextField, FormControl, Select, MenuItem, Button, Typography, Tabs, Tab,
    InputLabel, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import KeyboardCommandKeyRoundedIcon from '@mui/icons-material/KeyboardCommandKeyRounded';
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import { KeyHint } from '../../shared/ui/KeyHint.jsx';
import { formatLeavePeriod, loadLeaveApplications, saveLeaveApplications } from './leaveApplicationStore';
import { applyLeaveToAttendance } from '../attendance/attendanceStore';
import { getLastNMonths, inDateRange } from '../../shared/utils/dateRangeHelpers';
import PageScaffold from '../../shared/ui/PageScaffold.jsx';
import Section from '../../shared/ui/Section.jsx';
import StatusChip from '../../shared/ui/StatusChip.jsx';
import ApplicationCard from '../../shared/ui/ApplicationCard.jsx';
import IntegrationStatusChip from '../../shared/ui/IntegrationStatusChip.jsx';

const approvers = [
    { value: 'user1', label: '油ニ 和平(univapay@univa.tech)' },
    { value: 'user2', label: '由引 安人(ubiast@univa.tech)' },
];

const HISTORY_STATUS_OPTIONS = ['承認済', '差戻し'];

const toStatusKey = (s) => (
    s === '承認済' ? 'approved' : s === '差戻し' ? 'rejected' : s === '取消' ? 'cancelled' : 'pending'
);

const isTypingTarget = (el) => {
    if (!el) return false;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (el.isContentEditable) return true;
    return false;
};

function LeaveApprovals() {
    const [data, setData] = useState([]);
    const [commentMap, setCommentMap] = useState({});
    const [selectedApprover, setSelectedApprover] = useState('user1');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', undoSnapshot: null });
    const [showRejectFor, setShowRejectFor] = useState(null);
    const [tab, setTab] = useState('pending');
    const [focusedIdx, setFocusedIdx] = useState(0);
    const rowRefs = useRef({});
    const commentRefs = useRef({});

    const defaultRange = useMemo(() => getLastNMonths(3), []);
    const [historyFrom, setHistoryFrom] = useState(defaultRange.from);
    const [historyTo, setHistoryTo] = useState(defaultRange.to);
    const [historyStatus, setHistoryStatus] = useState('all');
    const [historyMineOnly, setHistoryMineOnly] = useState(true);

    useEffect(() => { setData(loadLeaveApplications()); }, []);

    const persist = (next) => { setData(next); saveLeaveApplications(next); };

    const currentApproverLabel = approvers.find((a) => a.value === selectedApprover)?.label || '';

    const handleStatus = (id, status) => {
        const target = data.find((row) => row.id === id);
        const comment = (commentMap[id] || '').trim();
        if (status === '差戻し' && !comment) {
            setShowRejectFor(id);
            setTimeout(() => {
                const node = commentRefs.current[id];
                node?.focus?.();
            }, 0);
            return;
        }
        const snapshot = data;
        const approvedRow = target ? {
            ...target,
            status,
            remarks: status === '差戻し' ? comment : '',
            approvedBy: currentApproverLabel,
            approvedAt: new Date().toISOString(),
            integrationStatus: status === '承認済' ? 'pending' : 'not_applicable',
        } : null;
        const next = data.map((row) => (row.id === id && approvedRow ? approvedRow : row));
        persist(next);
        setCommentMap({ ...commentMap, [id]: '' });
        setShowRejectFor(null);

        let message = status === '承認済' ? '勤怠申請を承認しました' : '勤怠申請を差戻しました';
        if (status === '承認済' && approvedRow) {
            const r = applyLeaveToAttendance(approvedRow);
            if (r.updated > 0) {
                const unitLabel = approvedRow.isHourly ? '時間休 1 件' : `${r.updated} 日分`;
                message = `勤怠申請を承認しました（勤怠に ${unitLabel} を反映）`;
            } else if (r.skippedWeekend > 0 && r.updated === 0) {
                message = '勤怠申請を承認しました（対象期間がすべて土日のため勤怠反映なし）';
            } else if (r.skippedClosed > 0) {
                message = `勤怠申請を承認しました（締め済の月 ${r.skippedClosed} 日分は勤怠反映スキップ）`;
            }
        }
        setSnackbar({ open: true, message, undoSnapshot: snapshot });
    };

    const handleUndo = () => {
        const snap = snackbar.undoSnapshot;
        if (!snap) return;
        persist(snap);
        setSnackbar({ open: false, message: '', undoSnapshot: null });
    };

    const approvalTargets = useMemo(() => (
        data.filter((row) => (row.status || '申請中') === '申請中')
    ), [data]);

    useEffect(() => {
        if (approvalTargets.length === 0) {
            setFocusedIdx(0);
            return;
        }
        setFocusedIdx((i) => Math.min(i, approvalTargets.length - 1));
    }, [approvalTargets.length]);

    const scrollFocusedIntoView = useCallback((idx) => {
        const target = approvalTargets[idx];
        if (!target) return;
        const node = rowRefs.current[target.id];
        node?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
    }, [approvalTargets]);

    useEffect(() => {
        if (tab !== 'pending') return;
        const handler = (e) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            if (isTypingTarget(e.target)) return;
            if (approvalTargets.length === 0) return;

            const key = e.key;
            if (key === 'j' || key === 'ArrowDown') {
                e.preventDefault();
                setFocusedIdx((i) => {
                    const next = Math.min(approvalTargets.length - 1, i + 1);
                    scrollFocusedIntoView(next);
                    return next;
                });
            } else if (key === 'k' || key === 'ArrowUp') {
                e.preventDefault();
                setFocusedIdx((i) => {
                    const next = Math.max(0, i - 1);
                    scrollFocusedIntoView(next);
                    return next;
                });
            } else if (key === 'a' || key === 'A') {
                e.preventDefault();
                const target = approvalTargets[focusedIdx];
                if (target) handleStatus(target.id, '承認済');
            } else if (key === 'r' || key === 'R') {
                e.preventDefault();
                const target = approvalTargets[focusedIdx];
                if (!target) return;
                const comment = (commentMap[target.id] || '').trim();
                if (!comment) {
                    setShowRejectFor(target.id);
                    const node = commentRefs.current[target.id];
                    node?.focus?.();
                    return;
                }
                handleStatus(target.id, '差戻し');
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [tab, approvalTargets, focusedIdx, commentMap, scrollFocusedIntoView]); // eslint-disable-line react-hooks/exhaustive-deps

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
            title="勤怠申請承認"
            subtitle="申請中の承認、過去の承認履歴をタブで切り替えて確認できます。承認すると勤怠に自動反映されます。"
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
                        <Typography variant="body2" sx={{ color: 'var(--ink-tertiary)', mt: 1, fontWeight: 600 }}>承認待ちの勤怠申請はありません。</Typography>
                    </Section>
                ) : (
                    <Stack spacing={1.25}>
                        <Box
                            role="note"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                flexWrap: 'wrap',
                                paddingInline: 1.5,
                                paddingBlock: 0.75,
                                borderRadius: 'var(--radius-pill)',
                                background: 'var(--surface-sunken)',
                                color: 'var(--ink-tertiary)',
                                fontSize: 12,
                                fontWeight: 600,
                                alignSelf: 'flex-start',
                            }}
                        >
                            <KeyboardCommandKeyRoundedIcon sx={{ fontSize: 14 }} />
                            キーボード操作:
                            <KeyHint keys={['J']} /> / <KeyHint keys={['K']} />
                            <Box component="span" sx={{ color: 'var(--ink-muted)' }}>移動</Box>
                            <KeyHint keys={['A']} />
                            <Box component="span" sx={{ color: 'var(--ink-muted)' }}>承認</Box>
                            <KeyHint keys={['R']} />
                            <Box component="span" sx={{ color: 'var(--ink-muted)' }}>差戻</Box>
                        </Box>
                        {approvalTargets.map((row, idx) => {
                            const comment = commentMap[row.id] || '';
                            const showReject = showRejectFor === row.id;
                            const isFocused = idx === focusedIdx;
                            return (
                                <Box
                                    key={row.id}
                                    ref={(el) => { rowRefs.current[row.id] = el; }}
                                    onClick={() => setFocusedIdx(idx)}
                                    sx={{
                                        borderRadius: 'var(--radius-lg)',
                                        outline: isFocused ? '2px solid var(--accent-primary)' : '2px solid transparent',
                                        outlineOffset: 2,
                                        transition: 'var(--motion-fast)',
                                    }}
                                >
                                <ApplicationCard statusKey="pending">
                                    <Box sx={{ paddingInline: { xs: 2, md: 3 }, paddingLeft: { xs: 2.5, md: 3.5 }, paddingBlock: 2 }}>
                                        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1.5}>
                                            <Box>
                                                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                        {row.leaveType} <Typography component="span" variant="body2" sx={{ color: 'var(--ink-tertiary)' }}>／ {formatLeavePeriod(row)}</Typography>
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
                                                label="承認者備考（差戻し時は必須）"
                                                size="small"
                                                value={comment}
                                                onChange={(e) => setCommentMap({ ...commentMap, [row.id]: e.target.value })}
                                                sx={{ flex: 1 }}
                                                error={showReject && !comment.trim()}
                                                helperText={showReject && !comment.trim() ? '差戻しには備考を入力してください' : null}
                                                inputRef={(el) => { commentRefs.current[row.id] = el; }}
                                            />
                                            <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center" flexShrink={0}>
                                                <Button variant="outlined" color="warning" startIcon={<AssignmentReturnRoundedIcon />} onClick={() => handleStatus(row.id, '差戻し')}>
                                                    差戻す
                                                </Button>
                                                <Button variant="contained" color="primary" startIcon={<CheckCircleRoundedIcon />} onClick={() => handleStatus(row.id, '承認済')}>
                                                    承認する
                                                </Button>
                                            </Stack>
                                        </Stack>
                                    </Box>
                                </ApplicationCard>
                                </Box>
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
                                                            {row.leaveType} <Typography component="span" variant="body2" sx={{ color: 'var(--ink-tertiary)' }}>／ {formatLeavePeriod(row)}</Typography>
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
                                                    {row.status === '差戻し' && row.remarks && (
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

            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={() => setSnackbar({ open: false, message: '', undoSnapshot: null })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity="success"
                    sx={{ width: '100%' }}
                    action={snackbar.undoSnapshot ? (
                        <Button
                            color="inherit"
                            size="small"
                            startIcon={<UndoRoundedIcon />}
                            onClick={handleUndo}
                            sx={{ fontWeight: 700 }}
                        >
                            元に戻す
                        </Button>
                    ) : null}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </PageScaffold>
    );
}

export default LeaveApprovals;
