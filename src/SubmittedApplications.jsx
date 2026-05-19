import { useState, useEffect } from 'react';
import {
    Box, Stack, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, Snackbar, Alert,
    MenuItem, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import {
    EXPENSE_CATEGORIES,
    formatYen,
    getExpenseApplicationStatus,
    getExpenseApplicationTotal,
    loadExpenseApplications,
    saveExpenseApplications,
} from './expenseApplicationStore';
import AdminConfirmDialog from './components/AdminConfirmDialog';
import PageScaffold from './ui/PageScaffold.jsx';
import Section from './ui/Section.jsx';
import StatusChip, { statusBarColor } from './ui/StatusChip.jsx';

function SubmittedApplications() {
    const [data, setData] = useState([]);
    const [editGroupIndexAll, setEditGroupIndexAll] = useState(null);
    const [editGroupRows, setEditGroupRows] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    const [cancelTargetIndex, setCancelTargetIndex] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        setData(loadExpenseApplications());
    }, []);

    const persistData = (newData) => { setData(newData); saveExpenseApplications(newData); };

    const handleCancelGroupConfirm = () => {
        if (cancelTargetIndex === null) return;
        const next = [...data];
        next[cancelTargetIndex] = {
            ...next[cancelTargetIndex],
            details: next[cancelTargetIndex].details.map((row) => ({ ...row, status: '取消' })),
        };
        persistData(next);
        setCancelTargetIndex(null);
        setSnackbar({ open: true, message: '申請を取り消しました' });
    };

    const handleEditGroup = (i) => { setEditGroupIndexAll(i); setEditGroupRows(data[i].details.map((r) => ({ ...r }))); };
    const handleEditGroupRowChange = (i, field, value) => {
        const next = [...editGroupRows];
        next[i] = { ...next[i], [field]: value };
        setEditGroupRows(next);
    };
    const handleEditGroupSave = () => {
        if (editGroupIndexAll === null) return;
        const next = [...data];
        next[editGroupIndexAll] = { ...next[editGroupIndexAll], details: editGroupRows.map((r) => ({ ...r, amount: Number(r.amount || 0) })) };
        persistData(next);
        setEditGroupIndexAll(null);
        setEditGroupRows([]);
        setSnackbar({ open: true, message: '申請内容を保存しました' });
    };
    const handleResubmitGroup = (i) => {
        const next = [...data];
        next[i] = { ...next[i], remarks: '', details: next[i].details.map((r) => ({ ...r, status: '申請中' })) };
        persistData(next);
        setSnackbar({ open: true, message: '再申請しました' });
    };

    return (
        <PageScaffold
            eyebrow="申請"
            title="経費申請済 一覧"
            subtitle="状態ごとに整理されています。非承認のものは編集後に再申請できます。"
        >
            {data.length === 0 && (
                <Section padded sx={{ textAlign: 'center', paddingBlock: 6 }}>
                    <ReceiptLongRoundedIcon sx={{ fontSize: 40, color: 'var(--ink-muted)' }} />
                    <Typography variant="body2" sx={{ color: 'var(--ink-tertiary)', mt: 1 }}>申請済みの経費申請はありません。</Typography>
                </Section>
            )}
            <Stack spacing={1.5}>
                {data.map((group, groupIdx) => {
                    const status = getExpenseApplicationStatus(group);
                    const total = getExpenseApplicationTotal(group);
                    const expanded = expandedId === group.applicationId;
                    const statusKey = status === '申請中' ? 'pending' : status === '承認済' ? 'approved' : status === '非承認' ? 'rejected' : 'cancelled';
                    return (
                        <Box
                            key={group.applicationId}
                            sx={{
                                position: 'relative',
                                borderRadius: 'var(--radius-lg)',
                                background: 'var(--surface-raised)',
                                boxShadow: 'var(--shadow-1)',
                                overflow: 'hidden',
                                transition: 'var(--motion-base)',
                                '&:hover': { boxShadow: expanded ? 'var(--shadow-2)' : 'var(--shadow-2)' },
                            }}
                        >
                            <Box
                                aria-hidden
                                sx={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: 4,
                                    background: statusBarColor(statusKey),
                                }}
                            />
                            <Box
                                onClick={() => setExpandedId(expanded ? null : group.applicationId)}
                                sx={{
                                    paddingInline: { xs: 2, md: 3 },
                                    paddingBlock: 2,
                                    paddingLeft: { xs: 2.5, md: 3.5 },
                                    cursor: 'pointer',
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', md: '120px 1fr 180px 140px 100px' },
                                    gap: 2,
                                    alignItems: 'center',
                                }}
                            >
                                <Stack spacing={0.25}>
                                    <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>申請日</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--ink-primary)' }}>{group.applicationDate}</Typography>
                                </Stack>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>申請ID</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--ink-primary)' }}>{group.applicationId}</Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: 'var(--ink-secondary)' }}>{group.paymentType || '-'}</Typography>
                                <Typography sx={{ fontWeight: 700, fontSize: 18, color: 'var(--accent-iris)' }} className="tabular-nums">
                                    {formatYen(total)}
                                </Typography>
                                <Box sx={{ justifySelf: { xs: 'flex-start', md: 'flex-end' } }}>
                                    <StatusChip status={statusKey} />
                                </Box>
                            </Box>
                            {status === '非承認' && group.remarks && (
                                <Alert severity="warning" sx={{ mx: { xs: 2, md: 3 }, mb: 1.5, borderRadius: 'var(--radius-md)' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>承認者備考</Typography>
                                    {group.remarks}
                                </Alert>
                            )}
                            {expanded && (
                                <Box sx={{ paddingInline: { xs: 2, md: 3 }, paddingBottom: 2.5, animation: 'recrovaFloatIn 200ms' }}>
                                    <TableContainer sx={{ borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)' }}>
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
                                    <Stack direction="row" spacing={1} sx={{ mt: 2 }} justifyContent="flex-end">
                                        <Tooltip title="変更（非承認の申請のみ）">
                                            <span>
                                                <IconButton color="primary" onClick={(e) => { e.stopPropagation(); handleEditGroup(groupIdx); }} disabled={status !== '非承認'}>
                                                    <EditRoundedIcon fontSize="small" />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        <Tooltip title="取消">
                                            <span>
                                                <IconButton color="error" onClick={(e) => { e.stopPropagation(); setCancelTargetIndex(groupIdx); }} disabled={status !== '申請中'}>
                                                    <CancelRoundedIcon fontSize="small" />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        {status === '非承認' && (
                                            <Tooltip title="再申請">
                                                <IconButton sx={{ color: 'var(--accent-leaf)' }} onClick={(e) => { e.stopPropagation(); handleResubmitGroup(groupIdx); }}>
                                                    <ReplayRoundedIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Stack>
                                </Box>
                            )}
                        </Box>
                    );
                })}
            </Stack>

            <Dialog open={editGroupIndexAll !== null} onClose={() => setEditGroupIndexAll(null)} maxWidth="lg" fullWidth>
                <DialogTitle>経費申請を変更</DialogTitle>
                <DialogContent>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ width: 150 }}>日付</TableCell>
                                    <TableCell sx={{ width: 220 }}>内容</TableCell>
                                    <TableCell>用途・行き先</TableCell>
                                    <TableCell sx={{ width: 180 }}>費目</TableCell>
                                    <TableCell sx={{ width: 140 }}>金額</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {editGroupRows.map((row, idx) => (
                                    <TableRow key={`edit_${idx}`}>
                                        <TableCell><TextField type="date" size="small" value={row.date || ''} onChange={(e) => handleEditGroupRowChange(idx, 'date', e.target.value)} InputLabelProps={{ shrink: true }} /></TableCell>
                                        <TableCell><TextField size="small" fullWidth value={row.description || ''} onChange={(e) => handleEditGroupRowChange(idx, 'description', e.target.value)} /></TableCell>
                                        <TableCell><TextField size="small" fullWidth value={row.destination || ''} onChange={(e) => handleEditGroupRowChange(idx, 'destination', e.target.value)} /></TableCell>
                                        <TableCell><TextField select size="small" fullWidth value={row.category || ''} onChange={(e) => handleEditGroupRowChange(idx, 'category', e.target.value)}>{EXPENSE_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField></TableCell>
                                        <TableCell><TextField type="number" size="small" value={row.amount || ''} onChange={(e) => handleEditGroupRowChange(idx, 'amount', e.target.value)} InputProps={{ sx: { fontVariantNumeric: 'tabular-nums' } }} /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button variant="text" color="inherit" startIcon={<CancelRoundedIcon />} onClick={() => setEditGroupIndexAll(null)}>キャンセル</Button>
                    <Button variant="contained" color="primary" startIcon={<SaveRoundedIcon />} onClick={handleEditGroupSave}>保存</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ open: false, message: '' })}>
                <Alert severity="success" sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
            <AdminConfirmDialog
                open={cancelTargetIndex !== null}
                title="経費申請を取り消しますか？"
                message={cancelTargetIndex !== null ? `申請ID: ${data[cancelTargetIndex]?.applicationId || '-'} を取消状態にします。` : ''}
                confirmLabel="取消"
                confirmColor="warning"
                onCancel={() => setCancelTargetIndex(null)}
                onConfirm={handleCancelGroupConfirm}
            />
        </PageScaffold>
    );
}

export default SubmittedApplications;
