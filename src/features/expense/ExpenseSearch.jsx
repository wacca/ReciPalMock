import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    FormControl,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded';
import {
    EXPENSE_CATEGORIES,
    PAYMENT_METHODS,
    formatYen,
    getExpenseIntegrationStatus,
    loadExpenseApplications,
    saveExpenseApplications,
} from './expenseApplicationStore';
import { buildCsv, downloadCsv, todayStamp } from '../../shared/utils/csvHelpers.js';
import AdminConfirmDialog from '../../shared/components/AdminConfirmDialog';
import PageScaffold from '../../shared/ui/PageScaffold.jsx';
import Section from '../../shared/ui/Section.jsx';
import StatusChip, { statusBarColor } from '../../shared/ui/StatusChip.jsx';
import ScopeSelector, { SCOPE_OPTIONS, filterByScope } from '../../shared/ui/ScopeSelector.jsx';
import IntegrationStatusChip from '../../shared/ui/IntegrationStatusChip.jsx';
import { getUserProfile } from '../../shared/utils/userDirectory';

const STATUS_OPTIONS = ['申請中', '承認済', '差戻し', '取消'];
const INTEGRATION_FILTER_OPTIONS = [
    { value: 'pending', label: '連携待ち' },
    { value: 'synced', label: '連携済' },
    { value: 'error', label: '連携エラー' },
];
const ADMIN_SCOPE_OPTIONS = SCOPE_OPTIONS.filter((o) => o.value !== 'self');

const toStatusKey = (s) => {
    if (s === '承認済') return 'approved';
    if (s === '差戻し') return 'rejected';
    if (s === '取消') return 'cancelled';
    return 'pending';
};

const inDateRange = (date, from, to) => {
    if (!date) return !from && !to;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
};

const toDetailRows = (app) => {
    const integrationStatus = getExpenseIntegrationStatus(app);
    const details = app.details || [];
    if (details.length === 0) {
        return [{
            key: `${app.applicationId}#empty`,
            applicationId: app.applicationId,
            applicationDate: app.applicationDate,
            applicantId: app.applicantId,
            applicantName: app.applicantName,
            applicantDepartment: app.applicantDepartment,
            detailIndex: 0,
            date: '',
            description: '(明細なし)',
            destination: '',
            category: '',
            paymentMethod: '',
            amount: 0,
            status: '明細なし',
            statusKey: 'pending',
            remarks: app.remarks || '',
            integrationStatus,
            haystack: [app.applicationId, app.applicantName, app.applicantDepartment, app.remarks]
                .filter(Boolean).join(' ').toLowerCase(),
        }];
    }
    return details.map((detail, index) => ({
        key: `${app.applicationId}#${index}`,
        applicationId: app.applicationId,
        applicationDate: app.applicationDate,
        applicantId: app.applicantId,
        applicantName: app.applicantName,
        applicantDepartment: app.applicantDepartment,
        detailIndex: index,
        date: detail.date || '',
        description: detail.description || '',
        destination: detail.destination || '',
        category: detail.category || '',
        paymentMethod: detail.paymentMethod || '',
        amount: Number(detail.amount || 0),
        status: detail.status || '申請中',
        statusKey: toStatusKey(detail.status || '申請中'),
        remarks: app.remarks || '',
        integrationStatus,
        haystack: [
            app.applicationId,
            app.applicantName,
            app.applicantDepartment,
            detail.paymentMethod,
            detail.description,
            detail.destination,
            detail.category,
            app.remarks,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase(),
    }));
};

function ExpenseSearch({ userId }) {
    const profile = getUserProfile(userId);
    const [apps, setApps] = useState([]);
    const [scope, setScope] = useState('department');
    const [keyword, setKeyword] = useState('');
    const [status, setStatus] = useState('all');
    const [category, setCategory] = useState('all');
    const [paymentType, setPaymentType] = useState('all');
    const [integrationFilter, setIntegrationFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [amountMin, setAmountMin] = useState('');
    const [amountMax, setAmountMax] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [markSyncedConfirmOpen, setMarkSyncedConfirmOpen] = useState(false);

    useEffect(() => {
        setApps(loadExpenseApplications());
    }, []);

    const allRows = useMemo(() => apps.flatMap(toDetailRows), [apps]);

    const scopedRows = useMemo(
        () => filterByScope(allRows, { scope, userId: profile.id, department: profile.department }),
        [allRows, scope, profile.id, profile.department],
    );

    const filtered = useMemo(() => {
        const kw = keyword.trim().toLowerCase();
        const min = amountMin === '' ? null : Number(amountMin);
        const max = amountMax === '' ? null : Number(amountMax);

        return scopedRows
            .filter((row) => {
                if (status !== 'all' && row.status !== status) return false;
                if (category !== 'all' && row.category !== category) return false;
                if (paymentType !== 'all' && row.paymentMethod !== paymentType) return false;
                if (integrationFilter !== 'all' && row.integrationStatus !== integrationFilter) return false;
                if (dateFrom || dateTo) {
                    const targetDate = row.date || row.applicationDate;
                    if (!inDateRange(targetDate, dateFrom, dateTo)) return false;
                }
                if (min !== null && row.amount < min) return false;
                if (max !== null && row.amount > max) return false;
                if (kw && !row.haystack.includes(kw)) return false;
                return true;
            })
            .sort((a, b) => {
                const byAppDate = (b.applicationDate || '').localeCompare(a.applicationDate || '');
                if (byAppDate !== 0) return byAppDate;
                const byAppId = (b.applicationId || '').localeCompare(a.applicationId || '');
                if (byAppId !== 0) return byAppId;
                return a.detailIndex - b.detailIndex;
            });
    }, [scopedRows, keyword, status, category, paymentType, integrationFilter, dateFrom, dateTo, amountMin, amountMax]);

    const handleReset = () => {
        setKeyword('');
        setStatus('all');
        setCategory('all');
        setPaymentType('all');
        setIntegrationFilter('all');
        setDateFrom('');
        setDateTo('');
        setAmountMin('');
        setAmountMax('');
    };

    const syncableTargets = useMemo(() => {
        const seen = new Set();
        const list = [];
        for (const row of filtered) {
            if (row.integrationStatus !== 'pending' && row.integrationStatus !== 'error') continue;
            if (seen.has(row.applicationId)) continue;
            seen.add(row.applicationId);
            list.push(row);
        }
        return list;
    }, [filtered]);

    const persistAndReload = (next) => {
        saveExpenseApplications(next);
        setApps(next);
    };

    const handleExportCsv = () => {
        if (filtered.length === 0) {
            setSnackbar({ open: true, message: '出力対象がありません', severity: 'warning' });
            return;
        }
        const columns = [
            { label: '申請ID', value: (row) => row.applicationId },
            { label: '申請日', value: (row) => row.applicationDate },
            { label: '申請者', value: (row) => row.applicantName },
            { label: '部署', value: (row) => row.applicantDepartment },
            { label: '明細日付', value: (row) => row.date },
            { label: '内容', value: (row) => row.description },
            { label: '行き先', value: (row) => row.destination },
            { label: '費目', value: (row) => row.category },
            { label: '支払方法', value: (row) => row.paymentMethod },
            { label: '金額', value: (row) => row.amount },
            { label: '明細状態', value: (row) => row.status },
            { label: '備考', value: (row) => row.remarks },
            { label: '連携状況', value: (row) => row.integrationStatus },
        ];
        const csv = buildCsv(filtered, columns);
        downloadCsv(csv, `expense-search-${todayStamp()}.csv`);
        setSnackbar({ open: true, message: `${filtered.length} 明細を CSV 出力しました`, severity: 'success' });
    };

    const handleMarkSynced = () => {
        if (syncableTargets.length === 0) return;
        const ids = new Set(syncableTargets.map((r) => r.applicationId));
        const nowIso = new Date().toISOString();
        const next = apps.map((app) => (
            ids.has(app.applicationId)
                ? { ...app, integrationStatus: 'synced', integrationSyncedAt: nowIso, integrationError: '' }
                : app
        ));
        persistAndReload(next);
        setMarkSyncedConfirmOpen(false);
        setSnackbar({ open: true, message: `${ids.size} 件を連携済にマークしました`, severity: 'success' });
    };

    const summary = useMemo(() => {
        const counts = filtered.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
        const total = filtered.reduce((sum, r) => sum + (r.amount || 0), 0);
        return {
            total,
            counts,
            applicationCount: new Set(filtered.map((r) => r.applicationId)).size,
            applicantCount: new Set(filtered.map((r) => r.applicantId)).size,
        };
    }, [filtered]);

    const scopeHint = scope === 'department'
        ? `${profile.department} の申請を表示中（自分の申請は「経費履歴」画面で確認できます）`
        : '全社の申請を表示中';

    const activeFilterCount = [
        keyword.trim() !== '',
        status !== 'all',
        category !== 'all',
        paymentType !== 'all',
        integrationFilter !== 'all',
        dateFrom !== '',
        dateTo !== '',
        amountMin !== '',
        amountMax !== '',
    ].filter(Boolean).length;

    return (
        <PageScaffold
            eyebrow="申請"
            title="経費申請検索"
            subtitle="申請済みの経費を明細単位で横断検索します。スコープを切り替えて部署・全社の明細を確認できます。"
            actions={(
                <>
                    <Button
                        variant="text"
                        color="inherit"
                        startIcon={<RestartAltRoundedIcon />}
                        onClick={handleReset}
                        disabled={activeFilterCount === 0}
                    >
                        条件をリセット
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<FileDownloadRoundedIcon />}
                        onClick={handleExportCsv}
                        disabled={filtered.length === 0}
                    >
                        CSV 出力
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<CloudDoneRoundedIcon />}
                        onClick={() => setMarkSyncedConfirmOpen(true)}
                        disabled={syncableTargets.length === 0}
                        sx={{ background: 'var(--accent-leaf)', '&:hover': { background: 'var(--accent-leaf)', filter: 'brightness(0.95)' } }}
                    >
                        連携済にマーク ({syncableTargets.length})
                    </Button>
                </>
            )}
        >
            <Section padded={false} sx={{ padding: 2 }}>
                <ScopeSelector value={scope} onChange={setScope} hint={scopeHint} options={ADMIN_SCOPE_OPTIONS} />
            </Section>

            <Section
                title="検索条件"
                subtitle={activeFilterCount > 0 ? `${activeFilterCount} 件の条件を適用中` : 'スコープに加えて条件を指定すると絞り込まれます'}
                icon={<SearchRoundedIcon />}
            >
                <Stack spacing={2}>
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="申請ID・申請者・内容・行き先・備考などで検索"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchRoundedIcon fontSize="small" sx={{ color: 'var(--ink-tertiary)' }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Box
                        sx={{
                            display: 'grid',
                            gap: 2,
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, minmax(140px, 1fr))' },
                        }}
                    >
                        <FormControl size="small">
                            <InputLabel>状態</InputLabel>
                            <Select label="状態" value={status} onChange={(e) => setStatus(e.target.value)}>
                                <MenuItem value="all">すべて</MenuItem>
                                {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl size="small">
                            <InputLabel>費目</InputLabel>
                            <Select label="費目" value={category} onChange={(e) => setCategory(e.target.value)}>
                                <MenuItem value="all">すべて</MenuItem>
                                {EXPENSE_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl size="small">
                            <InputLabel>支払方法</InputLabel>
                            <Select label="支払方法" value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                                <MenuItem value="all">すべて</MenuItem>
                                {PAYMENT_METHODS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl size="small">
                            <InputLabel>連携状況</InputLabel>
                            <Select label="連携状況" value={integrationFilter} onChange={(e) => setIntegrationFilter(e.target.value)}>
                                <MenuItem value="all">すべて</MenuItem>
                                {INTEGRATION_FILTER_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Box>
                    <Box
                        sx={{
                            display: 'grid',
                            gap: 2,
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, minmax(140px, 1fr))' },
                        }}
                    >
                        <TextField size="small" type="date" label="期間（開始）" InputLabelProps={{ shrink: true }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                        <TextField size="small" type="date" label="期間（終了）" InputLabelProps={{ shrink: true }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                        <TextField size="small" type="number" label="金額（下限）" placeholder="円" value={amountMin} onChange={(e) => setAmountMin(e.target.value)} InputProps={{ sx: { fontVariantNumeric: 'tabular-nums' } }} />
                        <TextField size="small" type="number" label="金額（上限）" placeholder="円" value={amountMax} onChange={(e) => setAmountMax(e.target.value)} InputProps={{ sx: { fontVariantNumeric: 'tabular-nums' } }} />
                    </Box>
                </Stack>
            </Section>

            <Section tone="sunken" elevation={0}>
                <Stack direction="row" spacing={4} flexWrap="wrap" alignItems="center">
                    <Stat label="明細件数" value={filtered.length} unit="件" tone="primary" />
                    <Stat label="申請数" value={summary.applicationCount} unit="件" tone="primary" />
                    <Stat label="申請者数" value={summary.applicantCount} unit="名" tone="iris" />
                    <Stat label="申請中" value={summary.counts['申請中'] || 0} unit="件" tone="iris" />
                    <Stat label="承認済" value={summary.counts['承認済'] || 0} unit="件" tone="leaf" />
                    <Stat label="合計金額" value={formatYen(summary.total)} tone="amber" />
                </Stack>
            </Section>

            {filtered.length === 0 ? (
                <Section padded sx={{ textAlign: 'center', paddingBlock: 6 }}>
                    <SearchOffRoundedIcon sx={{ fontSize: 40, color: 'var(--ink-tertiary)' }} />
                    <Typography variant="body2" sx={{ color: 'var(--ink-tertiary)', mt: 1 }}>
                        条件に一致する経費申請はありません。
                    </Typography>
                </Section>
            ) : (
                <Section padded={false}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ width: 120 }}>明細日付</TableCell>
                                    <TableCell sx={{ width: 160 }}>申請ID / 申請日</TableCell>
                                    <TableCell sx={{ width: 180 }}>申請者 / 部署</TableCell>
                                    <TableCell sx={{ width: 140 }}>費目</TableCell>
                                    <TableCell>内容 / 行き先</TableCell>
                                    <TableCell sx={{ width: 140 }}>支払方法</TableCell>
                                    <TableCell sx={{ width: 130 }} align="right">金額</TableCell>
                                    <TableCell sx={{ width: 110 }}>明細状態</TableCell>
                                    <TableCell sx={{ width: 130 }}>連携状況</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filtered.map((row) => (
                                    <TableRow key={row.key} sx={{ '& td': { paddingBlock: 1.25 }, '&:hover': { background: 'var(--surface-sunken)' } }}>
                                        <TableCell className="tabular-nums" sx={{ color: 'var(--ink-secondary)' }}>{row.date || '-'}</TableCell>
                                        <TableCell>
                                            <Stack spacing={0.25}>
                                                <Typography variant="body2" sx={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12.5, color: 'var(--ink-primary)' }}>
                                                    {row.applicationId}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                                                    {row.applicationDate || '-'}
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Stack spacing={0.25}>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--ink-primary)' }}>
                                                    {row.applicantName || '-'}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                                                    {row.applicantDepartment || '-'}
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            {row.category ? (
                                                <Chip
                                                    label={row.category}
                                                    size="small"
                                                    sx={{
                                                        height: 22,
                                                        fontSize: 11.5,
                                                        background: 'var(--surface-sunken)',
                                                        color: 'var(--ink-secondary)',
                                                    }}
                                                />
                                            ) : (
                                                <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>-</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Stack spacing={0.25}>
                                                <Typography variant="body2" sx={{ color: 'var(--ink-primary)' }}>
                                                    {row.description || '-'}
                                                </Typography>
                                                {row.destination && (
                                                    <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                                                        {row.destination}
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </TableCell>
                                        <TableCell sx={{ color: 'var(--ink-secondary)' }}>{row.paymentMethod || '-'}</TableCell>
                                        <TableCell align="right" className="tabular-nums" sx={{ fontWeight: 600, color: 'var(--accent-iris)' }}>
                                            {formatYen(row.amount)}
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box aria-hidden sx={{ width: 3, height: 18, borderRadius: 'var(--radius-pill)', background: statusBarColor(row.statusKey) }} />
                                                <StatusChip status={row.statusKey} size="sm" />
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <IntegrationStatusChip status={row.integrationStatus} target="expense" size="sm" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Section>
            )}

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
            <AdminConfirmDialog
                open={markSyncedConfirmOpen}
                title="連携済にマークしますか？"
                message={`現在の絞り込み結果のうち、連携待ち・連携エラーの ${syncableTargets.length} 件を 経費 SaaS 連携済としてマークします。実行前に外部 SaaS 側で取り込み完了を確認してください。`}
                confirmLabel="連携済にする"
                confirmColor="primary"
                onCancel={() => setMarkSyncedConfirmOpen(false)}
                onConfirm={handleMarkSynced}
            />
        </PageScaffold>
    );
}

const toneMap = {
    primary: 'var(--accent-primary)',
    iris: 'var(--accent-iris)',
    leaf: 'var(--accent-leaf)',
    amber: 'var(--accent-amber)',
};

const Stat = ({ label, value, unit, tone = 'primary' }) => (
    <Box>
        <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', display: 'block', lineHeight: 1 }}>{label}</Typography>
        <Typography sx={{ fontWeight: 800, fontSize: 22, color: toneMap[tone], lineHeight: 1.1 }} className="tabular-nums">
            {value}
            {unit && (
                <Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'var(--ink-tertiary)', fontSize: 12 }}>
                    {unit}
                </Typography>
            )}
        </Typography>
    </Box>
);

export default ExpenseSearch;
