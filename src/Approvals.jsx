import { useState, useEffect } from 'react';
import {
    Box, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, MenuItem, Select, FormControl,
    TextField, Snackbar, Alert, Button, Typography,
} from '@mui/material';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import {
    formatYen,
    getExpenseApplicationStatus,
    getExpenseApplicationTotal,
    loadExpenseApplications,
    saveExpenseApplications,
} from './expenseApplicationStore';
import PageScaffold from './ui/PageScaffold.jsx';
import Section from './ui/Section.jsx';
import StatusChip, { statusBarColor } from './ui/StatusChip.jsx';

const approvers = [
    { value: 'user1', label: '由引 安人(ubiast@univa.tech)' },
    { value: 'user2', label: '油ニ 和平(univapay@univa.tech)' },
];

function Approvals() {
    const [data, setData] = useState([]);
    const [commentMap, setCommentMap] = useState({});
    const [selectedApprover, setSelectedApprover] = useState('user1');
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    const [showRejectFor, setShowRejectFor] = useState(null);

    useEffect(() => { setData(loadExpenseApplications()); }, []);

    const persist = (next) => { setData(next); saveExpenseApplications(next); };

    const handleStatus = (groupIdx, newStatus) => {
        const target = data[groupIdx];
        const comment = (commentMap[target.applicationId] || '').trim();
        if (newStatus === '非承認' && !comment) {
            setShowRejectFor(target.applicationId);
            return;
        }
        const next = [...data];
        next[groupIdx] = {
            ...target,
            remarks: newStatus === '非承認' ? comment : '',
            approvedBy: approvers.find((a) => a.value === selectedApprover)?.label,
            approvedAt: new Date().toISOString(),
            details: target.details.map((r) => ({ ...r, status: newStatus })),
        };
        persist(next);
        setCommentMap({ ...commentMap, [target.applicationId]: '' });
        setShowRejectFor(null);
        setSnackbar({ open: true, message: newStatus === '承認済' ? '申請を承認しました' : '申請を非承認にしました' });
    };

    const approvalTargets = data.filter((a) => getExpenseApplicationStatus(a) === '申請中');

    return (
        <PageScaffold
            eyebrow="承認"
            title="経費承認"
            subtitle="申請中の経費のみ表示します。承認結果は申請済画面にも反映されます。"
            actions={(
                <FormControl size="small" sx={{ minWidth: 260 }}>
                    <Select value={selectedApprover} onChange={(e) => setSelectedApprover(e.target.value)}>
                        {approvers.map((a) => <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>)}
                    </Select>
                </FormControl>
            )}
        >
            {approvalTargets.length === 0 ? (
                <Section padded sx={{ textAlign: 'center', paddingBlock: 6 }}>
                    <FactCheckRoundedIcon sx={{ fontSize: 40, color: 'var(--accent-leaf)' }} />
                    <Typography variant="body2" sx={{ color: 'var(--ink-tertiary)', mt: 1, fontWeight: 600 }}>承認待ちの経費申請はありません。</Typography>
                    <Typography variant="caption" sx={{ color: 'var(--ink-muted)' }}>お疲れさまです。</Typography>
                </Section>
            ) : (
                <Stack spacing={1.5}>
                    {approvalTargets.map((group) => {
                        const groupIdx = data.findIndex((g) => g.applicationId === group.applicationId);
                        const comment = commentMap[group.applicationId] || '';
                        const total = getExpenseApplicationTotal(group);
                        const showReject = showRejectFor === group.applicationId;
                        return (
                            <Box
                                key={group.applicationId}
                                sx={{
                                    position: 'relative',
                                    borderRadius: 'var(--radius-lg)',
                                    background: 'var(--surface-raised)',
                                    boxShadow: 'var(--shadow-1)',
                                    overflow: 'hidden',
                                }}
                            >
                                <Box aria-hidden sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: statusBarColor('pending') }} />
                                <Box sx={{ paddingInline: { xs: 2, md: 3 }, paddingLeft: { xs: 2.5, md: 3.5 }, paddingBlock: 2 }}>
                                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1.5}>
                                        <Box>
                                            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'var(--ink-primary)' }}>
                                                    {group.applicationId}
                                                </Typography>
                                                <StatusChip status="pending" />
                                            </Stack>
                                            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                                                申請日 {group.applicationDate} ・ {group.paymentType || '-'}
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
                                                    <TableCell sx={{ width: 180 }}>費目</TableCell>
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
                                            label="承認者備考（非承認時は必須）"
                                            size="small"
                                            value={comment}
                                            onChange={(e) => setCommentMap({ ...commentMap, [group.applicationId]: e.target.value })}
                                            sx={{ flex: 1 }}
                                            error={showReject && !comment.trim()}
                                            helperText={showReject && !comment.trim() ? '非承認には備考を入力してください' : ' '}
                                        />
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                startIcon={<CancelRoundedIcon />}
                                                onClick={() => handleStatus(groupIdx, '非承認')}
                                            >
                                                非承認
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                startIcon={<CheckCircleRoundedIcon />}
                                                onClick={() => handleStatus(groupIdx, '承認済')}
                                            >
                                                承認する
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </Box>
                            </Box>
                        );
                    })}
                </Stack>
            )}
            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ open: false, message: '' })}>
                <Alert severity="success" sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </PageScaffold>
    );
}

export default Approvals;
