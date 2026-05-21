import { useState, useEffect, useMemo } from 'react';
import {
    Box, Stack, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, Snackbar, Alert,
    MenuItem, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select,
} from '@mui/material';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import {
    EXPENSE_CATEGORIES,
    formatYen,
    getApplicationPaymentMethods,
    getExpenseApplicationStatus,
    getExpenseApplicationTotal,
    loadExpenseApplications,
    saveExpenseApplications,
} from './expenseApplicationStore';
import { getLastNMonths, inDateRange } from '../../shared/utils/dateRangeHelpers';
import AdminConfirmDialog from '../../shared/components/AdminConfirmDialog';
import PageScaffold from '../../shared/ui/PageScaffold.jsx';
import Section from '../../shared/ui/Section.jsx';
import StatusChip from '../../shared/ui/StatusChip.jsx';
import ApplicationCard from '../../shared/ui/ApplicationCard.jsx';
import IntegrationStatusChip from '../../shared/ui/IntegrationStatusChip.jsx';

const STATUS_OPTIONS = ['申請中', '承認済', '差戻し', '取消'];

const toStatusKey = (s) => (
    s === '承認済' ? 'approved' : s === '差戻し' ? 'rejected' : s === '取消' ? 'cancelled' : 'pending'
);

function SubmittedApplications({ userId }) {
    const [data, setData] = useState([]);
    const [editGroupId, setEditGroupId] = useState(null);
    const [editGroupRows, setEditGroupRows] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    const [cancelTargetId, setCancelTargetId] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    const defaultRange = useMemo(() => getLastNMonths(3), []);
    const [dateFrom, setDateFrom] = useState(defaultRange.from);
    const [dateTo, setDateTo] = useState(defaultRange.to);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const all = loadExpenseApplications();
        setData(userId ? all.filter((app) => app.applicantId === userId) : all);
    }, [userId]);

    const persistData = (newData) => {
        setData(newData);
        if (userId) {
            const all = loadExpenseApplications();
            const others = all.filter((app) => app.applicantId !== userId);
            saveExpenseApplications([...newData, ...others]);
        } else {
            saveExpenseApplications(newData);
        }
    };

    const filteredData = useMemo(() => (
        data.filter((group) => {
            if (!inDateRange(group.applicationDate, dateFrom, dateTo)) return false;
            if (statusFilter !== 'all' && getExpenseApplicationStatus(group) !== statusFilter) return false;
            return true;
        })
    ), [data, dateFrom, dateTo, statusFilter]);

    const handleCancelGroupConfirm = () => {
        if (!cancelTargetId) return;
        persistData(data.map((g) => (
            g.applicationId === cancelTargetId
                ? { ...g, details: g.details.map((row) => ({ ...row, status: '取消' })) }
                : g
        )));
        setCancelTargetId(null);
        setSnackbar({ open: true, message: '申請を取り消しました' });
    };

    const handleEditGroup = (id) => {
        const target = data.find((g) => g.applicationId === id);
        if (!target) return;
        setEditGroupId(id);
        setEditGroupRows(target.details.map((r) => ({ ...r })));
    };
    const handleEditGroupRowChange = (i, field, value) => {
        const next = [...editGroupRows];
        next[i] = { ...next[i], [field]: value };
        setEditGroupRows(next);
    };
    const handleEditGroupSave = () => {
        if (!editGroupId) return;
        persistData(data.map((g) => (
            g.applicationId === editGroupId
                ? { ...g, details: editGroupRows.map((r) => ({ ...r, amount: Number(r.amount || 0) })) }
                : g
        )));
        setEditGroupId(null);
        setEditGroupRows([]);
        setSnackbar({ open: true, message: '申請内容を保存しました' });
    };
    const handleResubmitGroup = (id) => {
        persistData(data.map((g) => (
            g.applicationId === id
                ? { ...g, remarks: '', details: g.details.map((r) => ({ ...r, status: '申請中' })) }
                : g
        )));
        setSnackbar({ open: true, message: '再申請しました' });
    };

    const handleResetFilters = () => {
        setDateFrom(defaultRange.from);
        setDateTo(defaultRange.to);
        setStatusFilter('all');
    };

    const isDefaultRange = dateFrom === defaultRange.from && dateTo === defaultRange.to;
    const filtersActive = !isDefaultRange || statusFilter !== 'all';

    return (
        <PageScaffold
            eyebrow="申請"
            title="経費履歴"
            subtitle="自分が申請した経費の履歴です。期間・状態で絞り込み、差戻しのものは編集後に再申請または取下げできます。"
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
                            label="期間（開始）"
                            InputLabelProps={{ shrink: true }}
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                        <TextField
                            size="small"
                            type="date"
                            label="期間（終了）"
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
                    <Box sx={{ minWidth: 180 }}>
                        <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', display: 'block', lineHeight: 1 }}>
                            表示件数
                        </Typography>
                        <Typography sx={{ fontWeight: 800, fontSize: 22, color: 'var(--accent-primary)', lineHeight: 1.1 }} className="tabular-nums">
                            {filteredData.length}
                            <Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'var(--ink-tertiary)', fontSize: 12 }}>
                                件 / 全 {data.length} 件
                            </Typography>
                        </Typography>
                        {isDefaultRange && statusFilter === 'all' && (
                            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                                直近3ヶ月を表示中
                            </Typography>
                        )}
                    </Box>
                </Stack>
            </Section>

            {data.length === 0 ? (
                <Section padded sx={{ textAlign: 'center', paddingBlock: 6 }}>
                    <ReceiptLongRoundedIcon sx={{ fontSize: 40, color: 'var(--ink-muted)' }} />
                    <Typography variant="body2" sx={{ color: 'var(--ink-tertiary)', mt: 1 }}>経費申請の履歴はありません。</Typography>
                </Section>
            ) : filteredData.length === 0 ? (
                <Section padded sx={{ textAlign: 'center', paddingBlock: 6 }}>
                    <SearchOffRoundedIcon sx={{ fontSize: 40, color: 'var(--ink-muted)' }} />
                    <Typography variant="body2" sx={{ color: 'var(--ink-tertiary)', mt: 1 }}>
                        条件に一致する申請はありません。期間や状態を見直してください。
                    </Typography>
                </Section>
            ) : null}

            <Stack spacing={1.5}>
                {filteredData.map((group) => {
                    const status = getExpenseApplicationStatus(group);
                    const total = getExpenseApplicationTotal(group);
                    const expanded = expandedId === group.applicationId;
                    const statusKey = toStatusKey(status);
                    return (
                        <ApplicationCard
                            key={group.applicationId}
                            statusKey={statusKey}
                            onClick={() => setExpandedId(expanded ? null : group.applicationId)}
                        >
                            <Box
                                sx={{
                                    paddingInline: { xs: 2, md: 3 },
                                    paddingBlock: 2,
                                    paddingLeft: { xs: 2.5, md: 3.5 },
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', md: '120px 1fr 200px 140px minmax(100px, auto)' },
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
                                <Typography variant="body2" sx={{ color: 'var(--ink-secondary)' }}>{getApplicationPaymentMethods(group).join(' / ') || '-'}</Typography>
                                <Typography sx={{ fontWeight: 700, fontSize: 18, color: 'var(--accent-iris)' }} className="tabular-nums">
                                    {formatYen(total)}
                                </Typography>
                                <Stack
                                    direction="row"
                                    spacing={0.75}
                                    alignItems="center"
                                    flexWrap="wrap"
                                    sx={{ justifySelf: { xs: 'flex-start', md: 'flex-end' }, rowGap: 0.5 }}
                                >
                                    <StatusChip status={statusKey} />
                                    {status === '承認済' && (
                                        <IntegrationStatusChip
                                            status={group.integrationStatus && group.integrationStatus !== 'not_applicable' ? group.integrationStatus : 'pending'}
                                            target="expense"
                                            size="sm"
                                        />
                                    )}
                                </Stack>
                            </Box>
                            {status === '差戻し' && group.remarks && (
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
                                    {(status === '申請中' || status === '差戻し') && (
                                        <Stack direction="row" spacing={0.5} sx={{ mt: 2 }} justifyContent="flex-end" alignItems="center">
                                            {status === '申請中' && (
                                                <Tooltip title="申請を取消">
                                                    <IconButton color="error" size="small" onClick={(e) => { e.stopPropagation(); setCancelTargetId(group.applicationId); }}>
                                                        <RemoveCircleOutlineRoundedIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {status === '差戻し' && (
                                                <>
                                                    <Tooltip title="変更">
                                                        <IconButton color="primary" size="small" onClick={(e) => { e.stopPropagation(); handleEditGroup(group.applicationId); }}>
                                                            <EditRoundedIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="再申請">
                                                        <IconButton size="small" sx={{ color: 'var(--accent-leaf)' }} onClick={(e) => { e.stopPropagation(); handleResubmitGroup(group.applicationId); }}>
                                                            <ReplayRoundedIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="申請を取下げ">
                                                        <IconButton color="error" size="small" onClick={(e) => { e.stopPropagation(); setCancelTargetId(group.applicationId); }}>
                                                            <RemoveCircleOutlineRoundedIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}
                                        </Stack>
                                    )}
                                </Box>
                            )}
                        </ApplicationCard>
                    );
                })}
            </Stack>

            <Dialog open={editGroupId !== null} onClose={() => setEditGroupId(null)} maxWidth="lg" fullWidth>
                <DialogTitle>経費申請を変更</DialogTitle>
                <DialogContent>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ width: 150 }}>日付</TableCell>
                                    <TableCell sx={{ width: 220 }}>内容</TableCell>
                                    <TableCell>用途・行き先</TableCell>
                                    <TableCell sx={{ width: 160 }}>費目</TableCell>
                                    <TableCell sx={{ width: 150 }}>支払方法</TableCell>
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
                                        <TableCell sx={{ color: 'var(--ink-secondary)' }}>{row.paymentMethod || '-'}</TableCell>
                                        <TableCell><TextField type="number" size="small" value={row.amount || ''} onChange={(e) => handleEditGroupRowChange(idx, 'amount', e.target.value)} InputProps={{ sx: { fontVariantNumeric: 'tabular-nums' } }} /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button variant="text" color="inherit" startIcon={<CancelRoundedIcon />} onClick={() => setEditGroupId(null)}>キャンセル</Button>
                    <Button variant="contained" color="primary" startIcon={<SaveRoundedIcon />} onClick={handleEditGroupSave}>保存</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ open: false, message: '' })}>
                <Alert severity="success" sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
            <AdminConfirmDialog
                open={Boolean(cancelTargetId)}
                title="経費申請を取り消しますか？"
                message={cancelTargetId ? `申請ID: ${cancelTargetId} を取消状態にします。` : ''}
                confirmLabel="取消"
                confirmColor="warning"
                onCancel={() => setCancelTargetId(null)}
                onConfirm={handleCancelGroupConfirm}
            />
        </PageScaffold>
    );
}

export default SubmittedApplications;
