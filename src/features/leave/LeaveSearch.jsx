import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
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
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import { LEAVE_TYPES, formatLeavePeriod, getLeaveDayCount, getLeaveHours, getLeaveIntegrationStatus, loadLeaveApplications, saveLeaveApplications } from './leaveApplicationStore';
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

const toRow = (app) => {
    const dateFrom = app.dateFrom || app.date || '';
    const dateTo = app.dateTo || dateFrom;
    return {
        key: app.id,
        applicationId: app.id,
        applicationDate: (app.submittedAt || '').slice(0, 10),
        dateFrom,
        dateTo,
        targetDate: dateFrom,
        periodLabel: formatLeavePeriod(app, { withDays: false }),
        dayCount: getLeaveDayCount(app),
        hourCount: getLeaveHours(app),
        isHourly: Boolean(app.isHourly),
        applicantId: app.applicantId,
        applicantName: app.applicantName,
        applicantDepartment: app.applicantDepartment,
        leaveType: app.leaveType || '',
        reason: app.reason || '',
        status: app.status || '申請中',
        statusKey: toStatusKey(app.status || '申請中'),
        submittedAt: app.submittedAt,
        approvedBy: app.approvedBy || '',
        approvedAt: app.approvedAt || '',
        remarks: app.remarks || '',
        integrationStatus: getLeaveIntegrationStatus(app),
        haystack: [app.id, app.applicantName, app.applicantDepartment, app.leaveType, app.reason, app.remarks]
            .filter(Boolean)
            .join(' ')
            .toLowerCase(),
    };
};

function LeaveSearch({ userId }) {
    const profile = getUserProfile(userId);
    const [apps, setApps] = useState([]);
    const [scope, setScope] = useState('department');
    const [keyword, setKeyword] = useState('');
    const [status, setStatus] = useState('all');
    const [leaveType, setLeaveType] = useState('all');
    const [integrationFilter, setIntegrationFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [markSyncedConfirmOpen, setMarkSyncedConfirmOpen] = useState(false);

    useEffect(() => {
        setApps(loadLeaveApplications());
    }, []);

    const allRows = useMemo(() => apps.map(toRow), [apps]);

    const scopedRows = useMemo(
        () => filterByScope(allRows, { scope, userId: profile.id, department: profile.department }),
        [allRows, scope, profile.id, profile.department],
    );

    const filtered = useMemo(() => {
        const kw = keyword.trim().toLowerCase();
        return scopedRows
            .filter((row) => {
                if (status !== 'all' && row.status !== status) return false;
                if (leaveType !== 'all' && row.leaveType !== leaveType) return false;
                if (integrationFilter !== 'all' && row.integrationStatus !== integrationFilter) return false;
                if (dateFrom || dateTo) {
                    // 休暇期間が指定範囲とオーバーラップするものをヒット
                    if (dateFrom && row.dateTo && row.dateTo < dateFrom) return false;
                    if (dateTo && row.dateFrom && row.dateFrom > dateTo) return false;
                    if (!row.dateFrom) return false;
                }
                if (kw && !row.haystack.includes(kw)) return false;
                return true;
            })
            .sort((a, b) => (b.dateFrom || '').localeCompare(a.dateFrom || ''));
    }, [scopedRows, keyword, status, leaveType, integrationFilter, dateFrom, dateTo]);

    const handleReset = () => {
        setKeyword('');
        setStatus('all');
        setLeaveType('all');
        setIntegrationFilter('all');
        setDateFrom('');
        setDateTo('');
    };

    const syncableTargets = useMemo(
        () => filtered.filter((r) => r.integrationStatus === 'pending' || r.integrationStatus === 'error'),
        [filtered],
    );

    const persistAndReload = (next) => {
        saveLeaveApplications(next);
        setApps(next);
    };

    const handleExportCsv = () => {
        if (filtered.length === 0) {
            setSnackbar({ open: true, message: '出力対象がありません', severity: 'warning' });
            return;
        }
        const columns = [
            { label: '申請ID', value: (r) => r.applicationId },
            { label: '開始日', value: (r) => r.dateFrom },
            { label: '終了日', value: (r) => r.dateTo },
            { label: '日数', value: (r) => r.dayCount },
            { label: '時間指定', value: (r) => (r.isHourly ? 'はい' : 'いいえ') },
            { label: '時間数', value: (r) => r.hourCount },
            { label: '申請日', value: (r) => r.applicationDate },
            { label: '申請者', value: (r) => r.applicantName },
            { label: '部署', value: (r) => r.applicantDepartment },
            { label: '申請種別', value: (r) => r.leaveType },
            { label: '理由', value: (r) => r.reason },
            { label: '状態', value: (r) => r.status },
            { label: '承認者', value: (r) => r.approvedBy },
            { label: '承認日時', value: (r) => (r.approvedAt ? new Date(r.approvedAt).toLocaleString() : '') },
            { label: '備考', value: (r) => r.remarks },
            { label: '連携状況', value: (r) => r.integrationStatus },
        ];
        const csv = buildCsv(filtered, columns);
        downloadCsv(csv, `leave-search-${todayStamp()}.csv`);
        setSnackbar({ open: true, message: `${filtered.length} 件を CSV 出力しました`, severity: 'success' });
    };

    const handleMarkSynced = () => {
        if (syncableTargets.length === 0) return;
        const ids = new Set(syncableTargets.map((r) => r.applicationId));
        const nowIso = new Date().toISOString();
        const next = apps.map((row) => (
            ids.has(row.id)
                ? { ...row, integrationStatus: 'synced', integrationSyncedAt: nowIso, integrationError: '' }
                : row
        ));
        persistAndReload(next);
        setMarkSyncedConfirmOpen(false);
        setSnackbar({ open: true, message: `${ids.size} 件を連携済にマークしました`, severity: 'success' });
    };

    const summary = useMemo(() => {
        const counts = filtered.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
        return { counts, applicantCount: new Set(filtered.map((r) => r.applicantId)).size };
    }, [filtered]);

    const scopeHint = scope === 'department'
        ? `${profile.department} の申請を表示中（自分の申請は「勤怠申請履歴」画面で確認できます）`
        : '全社の申請を表示中';

    const activeFilterCount = [
        keyword.trim() !== '',
        status !== 'all',
        leaveType !== 'all',
        integrationFilter !== 'all',
        dateFrom !== '',
        dateTo !== '',
    ].filter(Boolean).length;

    return (
        <PageScaffold
            eyebrow="申請"
            title="勤怠申請検索"
            subtitle="申請済みの勤怠申請（休暇・時間休・遅刻・早退）を横断検索します。スコープを切り替えて部署・全社の申請を確認できます。"
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
                        placeholder="申請ID・申請者・休暇種別・理由などで検索"
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
                            <InputLabel>休暇種別</InputLabel>
                            <Select label="休暇種別" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
                                <MenuItem value="all">すべて</MenuItem>
                                {LEAVE_TYPES.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl size="small">
                            <InputLabel>連携状況</InputLabel>
                            <Select label="連携状況" value={integrationFilter} onChange={(e) => setIntegrationFilter(e.target.value)}>
                                <MenuItem value="all">すべて</MenuItem>
                                {INTEGRATION_FILTER_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <Box />
                    </Box>
                    <Box
                        sx={{
                            display: 'grid',
                            gap: 2,
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, minmax(140px, 1fr))' },
                        }}
                    >
                        <TextField size="small" type="date" label="対象日（開始）" InputLabelProps={{ shrink: true }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                        <TextField size="small" type="date" label="対象日（終了）" InputLabelProps={{ shrink: true }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                        <Box />
                        <Box />
                    </Box>
                </Stack>
            </Section>

            <Section tone="sunken" elevation={0}>
                <Stack direction="row" spacing={4} flexWrap="wrap" alignItems="center">
                    <Stat label="該当件数" value={filtered.length} unit="件" tone="primary" />
                    <Stat label="申請者数" value={summary.applicantCount} unit="名" tone="iris" />
                    <Stat label="申請中" value={summary.counts['申請中'] || 0} unit="件" tone="iris" />
                    <Stat label="承認済" value={summary.counts['承認済'] || 0} unit="件" tone="leaf" />
                    <Stat label="差戻し" value={summary.counts['差戻し'] || 0} unit="件" tone="amber" />
                </Stack>
            </Section>

            {filtered.length === 0 ? (
                <Section padded sx={{ textAlign: 'center', paddingBlock: 6 }}>
                    <SearchOffRoundedIcon sx={{ fontSize: 40, color: 'var(--ink-muted)' }} />
                    <Typography variant="body2" sx={{ color: 'var(--ink-tertiary)', mt: 1 }}>
                        条件に一致する勤怠申請はありません。
                    </Typography>
                </Section>
            ) : (
                <Section padded={false}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ width: 200 }}>休暇期間</TableCell>
                                    <TableCell sx={{ width: 120 }}>申請日</TableCell>
                                    <TableCell sx={{ width: 200 }}>申請者 / 部署</TableCell>
                                    <TableCell sx={{ width: 130 }}>休暇種別</TableCell>
                                    <TableCell>理由</TableCell>
                                    <TableCell sx={{ width: 110 }}>状態</TableCell>
                                    <TableCell sx={{ width: 140 }}>連携状況</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filtered.map((row) => (
                                    <TableRow key={row.key} sx={{ '& td': { paddingBlock: 1.25 }, '&:hover': { background: 'var(--surface-sunken)' } }}>
                                        <TableCell sx={{ fontWeight: 600 }}>
                                            <Stack spacing={0.25}>
                                                <Typography variant="body2" className="tabular-nums" sx={{ fontWeight: 600 }}>
                                                    {row.periodLabel}
                                                </Typography>
                                                {row.isHourly && row.hourCount > 0 && (
                                                    <Typography variant="caption" sx={{ color: 'var(--accent-iris)', fontWeight: 700 }}>
                                                        時間休 {row.hourCount}h
                                                    </Typography>
                                                )}
                                                {!row.isHourly && row.dayCount > 1 && (
                                                    <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                                                        {row.dayCount}日間
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </TableCell>
                                        <TableCell className="tabular-nums" sx={{ color: 'var(--ink-secondary)' }}>{row.applicationDate || '-'}</TableCell>
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
                                            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'var(--accent-leaf)', fontWeight: 700, fontSize: 12.5 }}>
                                                <EventAvailableRoundedIcon sx={{ fontSize: 16 }} />
                                                <span>{row.leaveType}</span>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{
                                                color: 'var(--ink-primary)',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                            }}>
                                                {row.reason || '(理由なし)'}
                                            </Typography>
                                            {row.status === '差戻し' && row.remarks && (
                                                <Typography variant="caption" sx={{ color: 'var(--accent-rose)', display: 'block', mt: 0.25 }}>
                                                    承認者備考: {row.remarks}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box aria-hidden sx={{ width: 3, height: 18, borderRadius: 'var(--radius-pill)', background: statusBarColor(row.statusKey) }} />
                                                <StatusChip status={row.statusKey} size="sm" />
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <IntegrationStatusChip status={row.integrationStatus} target="leave" size="sm" />
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
                message={`現在の絞り込み結果のうち、連携待ち・連携エラーの ${syncableTargets.length} 件を勤怠 SaaS 連携済としてマークします。実行前に外部 SaaS 側で取り込み完了を確認してください。`}
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

export default LeaveSearch;
