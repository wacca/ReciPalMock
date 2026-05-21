import { useState, useEffect, useMemo } from 'react';
import {
    Box, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, MenuItem, Select, FormControl,
    TextField, Snackbar, Alert, Button, Typography, Tabs, Tab, InputLabel, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
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

const approvers = [
    { value: 'user1', label: '由引 安人(ubiast@univa.tech)' },
    { value: 'user2', label: '油ニ 和平(univapay@univa.tech)' },
];

const HISTORY_STATUS_OPTIONS = ['承認済', '差戻し'];

const toStatusKey = (s) => (
    s === '承認済' ? 'approved' : s === '差戻し' ? 'rejected' : s === '取消' ? 'cancelled' : 'pending'
);

function Approvals() {
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

    useEffect(() => { setData(loadExpenseApplications()); }, []);

    const persist = (next) => { setData(next); saveExpenseApplications(next); };

    const currentApproverLabel = approvers.find((a) => a.value === selectedApprover)?.label || '';

    const handleStatus = (groupId, newStatus) => {
        const target = data.find((g) => g.applicationId === groupId);
        if (!target) return;
        const comment = (commentMap[target.applicationId] || '').trim();
        if (newStatus === '差戻し' && !comment) {
            setShowRejectFor(target.applicationId);
            return;
        }
        persist(data.map((g) => (
            g.applicationId === groupId
                ? {
                    ...g,
                    remarks: newStatus === '差戻し' ? comment : '',
                    approvedBy: currentApproverLabel,
                    approvedAt: new Date().toISOString(),
                    integrationStatus: newStatus === '承認済' ? 'pending' : 'not_applicable',
                    details: g.details.map((r) => ({ ...r, status: newStatus })),
                }
                : g
        )));
        setCommentMap({ ...commentMap, [target.applicationId]: '' });
        setShowRejectFor(null);
        setSnackbar({ open: true, message: newStatus === '承認済' ? '申請を承認しました' : '申請を差戻しました' });
    };

    const approvalTargets = useMemo(() => (
        data.filter((a) => getExpenseApplicationStatus(a) === '申請中')
    ), [data]);

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
                        {approvalTargets.map((group) => {
                            const comment = commentMap[group.applicationId] || '';
                            const total = getExpenseApplicationTotal(group);
                            const showReject = showRejectFor === group.applicationId;
                            return (
                                <ApplicationCard key={group.applicationId} statusKey="pending">
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
                                            />
                                            <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center" flexShrink={0}>
                                                <Button
                                                    variant="outlined"
                                                    color="warning"
                                                    startIcon={<AssignmentReturnRoundedIcon />}
                                                    onClick={() => handleStatus(group.applicationId, '差戻し')}
                                                >
                                                    差戻す
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    startIcon={<CheckCircleRoundedIcon />}
                                                    onClick={() => handleStatus(group.applicationId, '承認済')}
                                                >
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
                            {historyRows.map((group) => {
                                const total = getExpenseApplicationTotal(group);
                                const statusKey = toStatusKey(group._status);
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
                                                <Typography sx={{ fontWeight: 700, fontSize: 20, color: 'var(--accent-iris)' }} className="tabular-nums">
                                                    {formatYen(total)}
                                                </Typography>
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

export default Approvals;
