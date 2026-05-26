import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    Box, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, MenuItem, Select, FormControl,
    TextField, Snackbar, Alert, Button, Typography, Tabs, Tab, InputLabel, ToggleButton, ToggleButtonGroup,
    CircularProgress, Collapse,
} from '@mui/material';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import KeyboardCommandKeyRoundedIcon from '@mui/icons-material/KeyboardCommandKeyRounded';
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import { KeyHint } from '../../shared/ui/KeyHint.jsx';
import {
    formatYen,
    getApplicationPaymentMethods,
    getExpenseApplicationStatus,
    getExpenseApplicationTotal,
    loadExpenseApplications,
    saveExpenseApplications,
} from './expenseApplicationStore';
import { getLastNMonths, inDateRange } from '../../shared/utils/dateRangeHelpers';
import PageScaffold from '../../shared/ui/PageScaffold.jsx';
import Section from '../../shared/ui/Section.jsx';
import StatusChip from '../../shared/ui/StatusChip.jsx';
import ApplicationCard from '../../shared/ui/ApplicationCard.jsx';
import IntegrationStatusChip from '../../shared/ui/IntegrationStatusChip.jsx';
import UnapproveDialog from '../../shared/components/UnapproveDialog.jsx';
import ApplicationHistoryTimeline from '../../shared/components/ApplicationHistoryTimeline.jsx';
import ReceiptPreviewDialog, { ReceiptThumbnail } from '../../shared/components/ReceiptPreviewDialog.jsx';
import {
    HISTORY_EVENTS, appendHistory, createHistoryEntry,
} from '../../shared/utils/applicationHistory';

const approvers = [
    { value: 'user1', label: '由引 安人(ubiast@univa.tech)' },
    { value: 'user2', label: '油ニ 和平(univapay@univa.tech)' },
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

// サーバ往復のモック時間。本実装では API 呼び出しに置換する。
const MOCK_SERVER_MS = 500;
// ApplicationCard 側の fade(80) + collapse(200)。残りカードがこの時間で滑らかに詰まる。
const COLLAPSE_TOTAL_MS = 280;

function Approvals() {
    const [data, setData] = useState([]);
    const [commentMap, setCommentMap] = useState({});
    const [selectedApprover, setSelectedApprover] = useState('user1');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', undoSnapshot: null, severity: 'success' });
    const [showRejectFor, setShowRejectFor] = useState(null);
    const [tab, setTab] = useState('pending');
    const [focusedIdx, setFocusedIdx] = useState(0);
    const [pendingMap, setPendingMap] = useState({});   // サーバレスポンス待ち（ボタン spinner）
    const [decidingMap, setDecidingMap] = useState({}); // 確定後の collapse 中（カード退場アニメ）
    const [unapproveTargetId, setUnapproveTargetId] = useState(null);
    const [expandedHistoryId, setExpandedHistoryId] = useState(null);
    const [expandedDetailsId, setExpandedDetailsId] = useState(null); // 履歴タブで明細を展開している申請ID
    const [receiptPreview, setReceiptPreview] = useState(null); // { src, name, mimeType } | null
    const rowRefs = useRef({});
    const commentRefs = useRef({});

    const defaultRange = useMemo(() => getLastNMonths(3), []);
    const [historyFrom, setHistoryFrom] = useState(defaultRange.from);
    const [historyTo, setHistoryTo] = useState(defaultRange.to);
    const [historyStatus, setHistoryStatus] = useState('all');
    const [historyMineOnly, setHistoryMineOnly] = useState(true);

    useEffect(() => { setData(loadExpenseApplications()); }, []);

    const persist = (next) => { setData(next); saveExpenseApplications(next); };

    const currentApproverLabel = approvers.find((a) => a.value === selectedApprover)?.label || '';

    const handleStatus = (groupId, newStatus) => {
        const target = data.find((g) => g.applicationId === groupId);
        if (!target) return;
        if (pendingMap[groupId] || decidingMap[groupId]) return; // 多重発火防止
        const comment = (commentMap[target.applicationId] || '').trim();
        if (newStatus === '差戻し' && !comment) {
            setShowRejectFor(target.applicationId);
            // 差戻し時はコメント欄にフォーカスを移して気付かせる
            setTimeout(() => {
                const node = commentRefs.current[target.applicationId];
                node?.focus?.();
            }, 0);
            return;
        }
        const snapshot = data;
        const decideKey = newStatus === '承認済' ? 'approved' : 'rejected';
        // Phase 1: サーバ往復中はボタン spinner、カードは静止。
        setPendingMap((m) => ({ ...m, [groupId]: decideKey }));

        setTimeout(() => {
            // Phase 2: レスポンス到達。Snackbar を出してカードの退場アニメ開始。
            setPendingMap((m) => {
                const { [groupId]: _, ...rest } = m;
                return rest;
            });
            setDecidingMap((m) => ({ ...m, [groupId]: decideKey }));
            setSnackbar({
                open: true,
                message: newStatus === '承認済' ? '申請を承認しました' : '申請を差戻しました',
                undoSnapshot: snapshot,
                severity: 'success',
            });

            setTimeout(() => {
                // Phase 3: 退場アニメ完了。データを確定してカードをリストから除去。
                persist(data.map((g) => {
                    if (g.applicationId !== groupId) return g;
                    const historyEntry = createHistoryEntry({
                        eventType: newStatus === '承認済' ? HISTORY_EVENTS.APPROVE : HISTORY_EVENTS.REJECT,
                        actorLabel: currentApproverLabel,
                        fromStatus: '申請中',
                        toStatus: newStatus,
                        comment: newStatus === '差戻し' ? comment : '',
                    });
                    return {
                        ...g,
                        remarks: newStatus === '差戻し' ? comment : '',
                        approvedBy: currentApproverLabel,
                        approvedAt: new Date().toISOString(),
                        integrationStatus: newStatus === '承認済' ? 'pending' : 'not_applicable',
                        details: g.details.map((r) => ({ ...r, status: newStatus })),
                        history: appendHistory(g.history, historyEntry),
                    };
                }));
                setCommentMap((cm) => ({ ...cm, [groupId]: '' }));
                setShowRejectFor(null);
                setDecidingMap((m) => {
                    const { [groupId]: _, ...rest } = m;
                    return rest;
                });
            }, COLLAPSE_TOTAL_MS);
        }, MOCK_SERVER_MS);
    };

    const handleUndo = () => {
        const snap = snackbar.undoSnapshot;
        if (!snap) return;
        persist(snap);
        setSnackbar({ open: false, message: '', undoSnapshot: null, severity: 'success' });
    };

    const unapproveTarget = useMemo(() => (
        data.find((g) => g.applicationId === unapproveTargetId) || null
    ), [data, unapproveTargetId]);

    const canUnapprove = (group) => {
        if (!group) return false;
        if (getExpenseApplicationStatus(group) !== '承認済') return false;
        // 連携済（外部 SaaS 送信済）の場合は取消不可。pending / error / not_applicable のみ可
        if (group.integrationStatus === 'synced') return false;
        return true;
    };

    const handleUnapproveConfirm = (reason) => {
        if (!unapproveTarget) return;
        const targetId = unapproveTarget.applicationId;
        const snapshot = data;
        const historyEntry = createHistoryEntry({
            eventType: HISTORY_EVENTS.UNAPPROVE,
            actorLabel: currentApproverLabel,
            fromStatus: '承認済',
            toStatus: '申請中',
            comment: reason,
        });
        persist(data.map((g) => (
            g.applicationId === targetId
                ? {
                    ...g,
                    approvedBy: '',
                    approvedAt: '',
                    integrationStatus: 'not_applicable',
                    details: g.details.map((r) => ({ ...r, status: '申請中' })),
                    history: appendHistory(g.history, historyEntry),
                }
                : g
        )));
        setUnapproveTargetId(null);
        setSnackbar({
            open: true,
            message: '承認を取り消しました。申請は再度「承認待ち」に戻りました。',
            undoSnapshot: snapshot,
            severity: 'info',
        });
    };

    const approvalTargets = useMemo(() => (
        data.filter((a) => getExpenseApplicationStatus(a) === '申請中')
    ), [data]);

    // approvalTargets が変わったら focus index を範囲内にクランプ
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
        const node = rowRefs.current[target.applicationId];
        node?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
    }, [approvalTargets]);

    useEffect(() => {
        if (tab !== 'pending') return;
        const handler = (e) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            if (isTypingTarget(e.target)) return;
            if (approvalTargets.length === 0) return;
            // 領収書プレビュー表示中は J/K/A/R を発火させない（背面の承認操作を防ぐ）
            if (receiptPreview) return;

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
                if (target) handleStatus(target.applicationId, '承認済');
            } else if (key === 'r' || key === 'R') {
                e.preventDefault();
                const target = approvalTargets[focusedIdx];
                if (!target) return;
                const comment = (commentMap[target.applicationId] || '').trim();
                if (!comment) {
                    setShowRejectFor(target.applicationId);
                    const node = commentRefs.current[target.applicationId];
                    node?.focus?.();
                    return;
                }
                handleStatus(target.applicationId, '差戻し');
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [tab, approvalTargets, focusedIdx, commentMap, scrollFocusedIntoView, receiptPreview]); // eslint-disable-line react-hooks/exhaustive-deps

    const historyRows = useMemo(() => (
        data
            .map((g) => ({ ...g, _status: getExpenseApplicationStatus(g) }))
            .filter((g) => HISTORY_STATUS_OPTIONS.includes(g._status))
            .filter((g) => {
                if (historyStatus !== 'all' && g._status !== historyStatus) return false;
                const ref = (g.approvedAt || '').slice(0, 10) || g.applicationDate;
                if (!inDateRange(ref, historyFrom, historyTo)) return false;
                if (historyMineOnly && g.approvedBy !== currentApproverLabel) return false;
                return true;
            })
            .sort((a, b) => (b.approvedAt || b.applicationDate || '').localeCompare(a.approvedAt || a.applicationDate || ''))
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
            title="経費承認"
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
                        icon={<FactCheckRoundedIcon fontSize="small" />}
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
                        <FactCheckRoundedIcon sx={{ fontSize: 40, color: 'var(--accent-leaf)' }} />
                        <Typography variant="body2" sx={{ color: 'var(--ink-tertiary)', mt: 1, fontWeight: 600 }}>承認待ちの経費申請はありません。</Typography>
                        <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>お疲れさまです。</Typography>
                    </Section>
                ) : (
                    <Stack spacing={1.5}>
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
                        {approvalTargets.map((group, idx) => {
                            const comment = commentMap[group.applicationId] || '';
                            const total = getExpenseApplicationTotal(group);
                            const showReject = showRejectFor === group.applicationId;
                            const isFocused = idx === focusedIdx;
                            return (
                                <ApplicationCard
                                    key={group.applicationId}
                                    ref={(el) => { rowRefs.current[group.applicationId] = el; }}
                                    statusKey="pending"
                                    decidingAs={decidingMap[group.applicationId] || null}
                                    focused={isFocused}
                                    onClick={() => setFocusedIdx(idx)}
                                >
                                    <Box sx={{ paddingInline: { xs: 2, md: 3 }, paddingLeft: { xs: 2.5, md: 3.5 }, paddingBlock: 2 }}>
                                        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1.5}>
                                            <Box>
                                                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'var(--ink-primary)' }}>
                                                        {group.applicationId}
                                                    </Typography>
                                                    <StatusChip status="pending" />
                                                </Stack>
                                                <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', display: 'block' }}>
                                                    申請日 {group.applicationDate} ・ {getApplicationPaymentMethods(group).join(' / ') || '-'}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'var(--ink-secondary)', mt: 0.5, fontWeight: 600 }}>
                                                    {group.applicantName || '-'}
                                                    <Typography component="span" variant="caption" sx={{ color: 'var(--ink-tertiary)', ml: 1 }}>
                                                        {group.applicantDepartment || ''}
                                                    </Typography>
                                                </Typography>
                                            </Box>
                                            <Typography sx={{ fontWeight: 800, fontSize: 22, color: 'var(--accent-iris)' }} className="tabular-nums">
                                                {formatYen(total)}
                                            </Typography>
                                        </Stack>
                                        <TableContainer sx={{ mt: 2, borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)' }}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{ width: 130 }}>日付</TableCell>
                                                        <TableCell sx={{ width: 220 }}>内容</TableCell>
                                                        <TableCell>用途・行き先</TableCell>
                                                        <TableCell sx={{ width: 160 }}>費目</TableCell>
                                                        <TableCell sx={{ width: 150 }}>支払方法</TableCell>
                                                        <TableCell sx={{ width: 70 }} align="center">領収書</TableCell>
                                                        <TableCell sx={{ width: 140 }} align="right">金額</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {group.details.map((row, idx) => (
                                                        <TableRow key={`${group.applicationId}_${idx}`}>
                                                            <TableCell>{row.date}</TableCell>
                                                            <TableCell sx={{ fontWeight: 500 }}>{row.description}</TableCell>
                                                            <TableCell>{row.destination}</TableCell>
                                                            <TableCell>{row.category}</TableCell>
                                                            <TableCell sx={{ color: 'var(--ink-secondary)' }}>{row.paymentMethod || '-'}</TableCell>
                                                            <TableCell align="center" sx={{ paddingBlock: 0.75 }}>
                                                                <Box sx={{ display: 'inline-flex' }}>
                                                                    <ReceiptThumbnail
                                                                        src={row.receiptPreview}
                                                                        name={row.receiptName}
                                                                        mimeType={row.receiptMimeType}
                                                                        size={36}
                                                                        onClick={row.receiptPreview ? () => setReceiptPreview({
                                                                            src: row.receiptPreview,
                                                                            name: row.receiptName,
                                                                            mimeType: row.receiptMimeType,
                                                                        }) : undefined}
                                                                    />
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell align="right" className="tabular-nums" sx={{ fontWeight: 600 }}>{formatYen(row.amount)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                        <Stack
                                            direction={{ xs: 'column', md: 'row' }}
                                            spacing={1.5}
                                            alignItems={{ xs: 'stretch', md: 'center' }}
                                            sx={{ mt: 2 }}
                                        >
                                            <TextField
                                                label="承認者備考（差戻し時は必須）"
                                                size="small"
                                                value={comment}
                                                onChange={(e) => setCommentMap({ ...commentMap, [group.applicationId]: e.target.value })}
                                                sx={{ flex: 1 }}
                                                error={showReject && !comment.trim()}
                                                helperText={showReject && !comment.trim() ? '差戻しには備考を入力してください' : null}
                                                inputRef={(el) => { commentRefs.current[group.applicationId] = el; }}
                                            />
                                            <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center" flexShrink={0}>
                                                {(() => {
                                                    const pending = pendingMap[group.applicationId] || decidingMap[group.applicationId];
                                                    const isBusy = Boolean(pending);
                                                    return (
                                                        <>
                                                            <Button
                                                                variant="outlined"
                                                                color="warning"
                                                                startIcon={pending === 'rejected'
                                                                    ? <CircularProgress size={16} color="inherit" />
                                                                    : <AssignmentReturnRoundedIcon />}
                                                                onClick={() => handleStatus(group.applicationId, '差戻し')}
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
                                                                onClick={() => handleStatus(group.applicationId, '承認済')}
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
                            <SearchOffRoundedIcon sx={{ fontSize: 40, color: 'var(--ink-tertiary)' }} />
                            <Typography variant="body2" sx={{ color: 'var(--ink-tertiary)', mt: 1 }}>
                                条件に一致する承認履歴はありません。
                            </Typography>
                        </Section>
                    ) : (
                        <Stack spacing={1.25}>
                            {historyRows.map((group) => {
                                const total = getExpenseApplicationTotal(group);
                                const statusKey = toStatusKey(group._status);
                                const isExpanded = expandedHistoryId === group.applicationId;
                                const isDetailsExpanded = expandedDetailsId === group.applicationId;
                                const detailCount = (group.details || []).length;
                                const receiptCount = (group.details || []).filter((d) => d.receiptPreview).length;
                                const historyCount = (group.history || []).length;
                                const isMine = group.approvedBy === currentApproverLabel;
                                const unapproveEnabled = group._status === '承認済' && canUnapprove(group) && isMine;
                                return (
                                    <ApplicationCard key={group.applicationId} statusKey={statusKey} hoverable={false}>
                                        <Box sx={{ paddingInline: { xs: 2, md: 3 }, paddingLeft: { xs: 2.5, md: 3.5 }, paddingBlock: 1.75 }}>
                                            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1.5}>
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'var(--ink-primary)' }}>
                                                            {group.applicationId}
                                                        </Typography>
                                                        <StatusChip status={statusKey} size="sm" />
                                                        {group._status === '承認済' && (
                                                            <IntegrationStatusChip
                                                                status={group.integrationStatus && group.integrationStatus !== 'not_applicable' ? group.integrationStatus : 'pending'}
                                                                target="expense"
                                                                size="sm"
                                                            />
                                                        )}
                                                    </Stack>
                                                    <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', display: 'block' }}>
                                                        申請日 {group.applicationDate} ・ {getApplicationPaymentMethods(group).join(' / ') || '-'}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: 'var(--ink-secondary)', mt: 0.5, fontWeight: 600 }}>
                                                        申請者: {group.applicantName || '-'}
                                                        <Typography component="span" variant="caption" sx={{ color: 'var(--ink-tertiary)', ml: 1 }}>
                                                            {group.applicantDepartment || ''}
                                                        </Typography>
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', display: 'block', mt: 0.25 }}>
                                                        承認: {group.approvedBy || '-'}
                                                        {group.approvedAt && ` ・ ${new Date(group.approvedAt).toLocaleString()}`}
                                                    </Typography>
                                                    {group._status === '差戻し' && group.remarks && (
                                                        <Typography variant="caption" sx={{ color: 'var(--accent-rose)', display: 'block', mt: 0.25 }}>
                                                            備考: {group.remarks}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <Typography sx={{ fontWeight: 700, fontSize: 20, color: 'var(--accent-iris)' }} className="tabular-nums">
                                                        {formatYen(total)}
                                                    </Typography>
                                                </Stack>
                                            </Stack>
                                            <Stack direction="row" spacing={1} sx={{ mt: 1.25 }} alignItems="center" flexWrap="wrap">
                                                <Button
                                                    size="small"
                                                    variant="text"
                                                    color="inherit"
                                                    startIcon={isDetailsExpanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                                                    onClick={() => setExpandedDetailsId(isDetailsExpanded ? null : group.applicationId)}
                                                    sx={{ color: 'var(--ink-tertiary)' }}
                                                >
                                                    明細{detailCount > 0 ? ` (${detailCount})` : ''}
                                                    {receiptCount > 0 && (
                                                        <Typography
                                                            component="span"
                                                            variant="caption"
                                                            sx={{ ml: 0.5, color: 'var(--accent-iris)', fontWeight: 700 }}
                                                        >
                                                            領収書 {receiptCount}
                                                        </Typography>
                                                    )}
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="text"
                                                    color="inherit"
                                                    startIcon={isExpanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                                                    onClick={() => setExpandedHistoryId(isExpanded ? null : group.applicationId)}
                                                    sx={{ color: 'var(--ink-tertiary)' }}
                                                >
                                                    操作履歴{historyCount > 0 ? ` (${historyCount})` : ''}
                                                </Button>
                                                <Box sx={{ flex: 1 }} />
                                                {group._status === '承認済' && (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="warning"
                                                        startIcon={<UndoRoundedIcon />}
                                                        onClick={() => setUnapproveTargetId(group.applicationId)}
                                                        disabled={!unapproveEnabled}
                                                        title={
                                                            !isMine ? '自分が承認した申請のみ取消できます'
                                                            : group.integrationStatus === 'synced' ? '外部連携済のため取消できません'
                                                            : ''
                                                        }
                                                    >
                                                        承認を取り消す
                                                    </Button>
                                                )}
                                            </Stack>
                                            <Collapse in={isDetailsExpanded} unmountOnExit>
                                                <TableContainer sx={{ mt: 1.5, borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)' }}>
                                                    <Table size="small">
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell sx={{ width: 110 }}>日付</TableCell>
                                                                <TableCell sx={{ width: 200 }}>内容</TableCell>
                                                                <TableCell>用途・行き先</TableCell>
                                                                <TableCell sx={{ width: 140 }}>費目</TableCell>
                                                                <TableCell sx={{ width: 130 }}>支払方法</TableCell>
                                                                <TableCell sx={{ width: 70 }} align="center">領収書</TableCell>
                                                                <TableCell sx={{ width: 120 }} align="right">金額</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {group.details.map((row, idx) => (
                                                                <TableRow key={`${group.applicationId}_h_${idx}`}>
                                                                    <TableCell>{row.date}</TableCell>
                                                                    <TableCell sx={{ fontWeight: 500 }}>{row.description}</TableCell>
                                                                    <TableCell>{row.destination}</TableCell>
                                                                    <TableCell>{row.category}</TableCell>
                                                                    <TableCell sx={{ color: 'var(--ink-secondary)' }}>{row.paymentMethod || '-'}</TableCell>
                                                                    <TableCell align="center" sx={{ paddingBlock: 0.75 }}>
                                                                        <Box sx={{ display: 'inline-flex' }}>
                                                                            <ReceiptThumbnail
                                                                                src={row.receiptPreview}
                                                                                name={row.receiptName}
                                                                                mimeType={row.receiptMimeType}
                                                                                size={36}
                                                                                onClick={row.receiptPreview ? () => setReceiptPreview({
                                                                                    src: row.receiptPreview,
                                                                                    name: row.receiptName,
                                                                                    mimeType: row.receiptMimeType,
                                                                                }) : undefined}
                                                                            />
                                                                        </Box>
                                                                    </TableCell>
                                                                    <TableCell align="right" className="tabular-nums" sx={{ fontWeight: 600 }}>{formatYen(row.amount)}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </Collapse>
                                            <Collapse in={isExpanded} unmountOnExit>
                                                <Box sx={{ mt: 1.5, paddingInline: 1.5, paddingBlock: 1.5, borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)' }}>
                                                    <ApplicationHistoryTimeline history={group.history} />
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

            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={() => setSnackbar({ open: false, message: '', undoSnapshot: null, severity: 'success' })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar.severity || 'success'}
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

            <UnapproveDialog
                open={Boolean(unapproveTarget)}
                title="承認を取り消しますか？"
                description={unapproveTarget
                    ? `${unapproveTarget.applicationId} の承認を取り消し、「承認待ち」に戻します。`
                    : ''}
                onCancel={() => setUnapproveTargetId(null)}
                onConfirm={handleUnapproveConfirm}
            />

            <ReceiptPreviewDialog
                open={Boolean(receiptPreview)}
                src={receiptPreview?.src}
                name={receiptPreview?.name}
                mimeType={receiptPreview?.mimeType}
                onClose={() => setReceiptPreview(null)}
            />
        </PageScaffold>
    );
}

export default Approvals;
