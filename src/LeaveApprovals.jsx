import { useState, useEffect } from 'react';
import { Box, Stack, Snackbar, Alert, TextField, FormControl, Select, MenuItem, Button, Typography } from '@mui/material';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import { loadLeaveApplications, saveLeaveApplications } from './leaveApplicationStore';
import PageScaffold from './ui/PageScaffold.jsx';
import Section from './ui/Section.jsx';
import StatusChip, { statusBarColor } from './ui/StatusChip.jsx';

const approvers = [
    { value: 'user1', label: '油ニ 和平(univapay@univa.tech)' },
    { value: 'user2', label: '由引 安人(ubiast@univa.tech)' },
];

function LeaveApprovals() {
    const [data, setData] = useState([]);
    const [commentMap, setCommentMap] = useState({});
    const [selectedApprover, setSelectedApprover] = useState('user1');
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    const [showRejectFor, setShowRejectFor] = useState(null);

    useEffect(() => { setData(loadLeaveApplications()); }, []);

    const persist = (next) => { setData(next); saveLeaveApplications(next); };

    const handleStatus = (id, status) => {
        const approver = approvers.find((a) => a.value === selectedApprover)?.label || '';
        const comment = (commentMap[id] || '').trim();
        if (status === '非承認' && !comment) {
            setShowRejectFor(id);
            return;
        }
        const next = data.map((row) => (
            row.id === id ? { ...row, status, remarks: status === '非承認' ? comment : '', approvedBy: approver, approvedAt: new Date().toISOString() } : row
        ));
        persist(next);
        setCommentMap({ ...commentMap, [id]: '' });
        setShowRejectFor(null);
        setSnackbar({ open: true, message: status === '承認済' ? '休暇申請を承認しました' : '休暇申請を非承認にしました' });
    };

    const approvalTargets = data.filter((row) => (row.status || '申請中') === '申請中');

    return (
        <PageScaffold
            eyebrow="承認"
            title="休暇承認"
            subtitle="申請中の休暇申請のみ表示します。承認結果は申請済画面に反映されます。"
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
                    <HowToRegRoundedIcon sx={{ fontSize: 40, color: 'var(--accent-leaf)' }} />
                    <Typography variant="body2" sx={{ color: 'var(--ink-tertiary)', mt: 1, fontWeight: 600 }}>承認待ちの休暇申請はありません。</Typography>
                </Section>
            ) : (
                <Stack spacing={1.25}>
                    {approvalTargets.map((row) => {
                        const comment = commentMap[row.id] || '';
                        const showReject = showRejectFor === row.id;
                        return (
                            <Box
                                key={row.id}
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
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                    {row.leaveType} <Typography component="span" variant="body2" sx={{ color: 'var(--ink-tertiary)' }}>／ {row.date}</Typography>
                                                </Typography>
                                                <StatusChip status="pending" />
                                            </Stack>
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

export default LeaveApprovals;
