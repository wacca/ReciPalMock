import { useEffect, useMemo, useState } from 'react';
import {
    Alert, Box, Button, FormControl, InputLabel, MenuItem, Select, Snackbar, Stack, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import {
    getAttendanceIntegrationStatus, loadAttendanceTimesheets, saveAttendanceTimesheets,
} from './attendanceStore';
import { buildCsv, downloadCsv, todayStamp } from './csvHelpers.js';
import AdminConfirmDialog from './components/AdminConfirmDialog';
import { getUserProfile } from './userDirectory';
import PageScaffold from './ui/PageScaffold.jsx';
import Section from './ui/Section.jsx';
import StatusChip, { statusBarColor } from './ui/StatusChip.jsx';
import ScopeSelector, { SCOPE_OPTIONS, filterByScope } from './ui/ScopeSelector.jsx';
import IntegrationStatusChip from './ui/IntegrationStatusChip.jsx';

const STATUS_OPTIONS = ['下書き', '申請中', '承認済', '非承認', '取消'];
const INTEGRATION_FILTER_OPTIONS = [
    { value: 'pending', label: '連携待ち' },
    { value: 'synced', label: '連携済' },
    { value: 'error', label: '連携エラー' },
];
const CLOSING_OPTIONS = [
    { value: 'open', label: '締め前' },
    { value: 'closed', label: '締め済' },
];
const ADMIN_SCOPE_OPTIONS = SCOPE_OPTIONS.filter((o) => o.value !== 'self');

const toStatusKey = (s) => (
    s === '承認済' ? 'approved' : s === '非承認' ? 'rejected' : s === '取消' ? 'cancelled' : s === '下書き' ? 'draft' : 'pending'
);

const pad2 = (v) => String(v).padStart(2, '0');
const parseTime = (v) => {
    if (!v) return null;
    const [h, m] = v.split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
};
const formatDuration = (m) => {
    if (!Number.isFinite(m)) return '-';
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
    return {
        workDays: count('出勤'),
        absenceDays: count('欠勤'),
        paidLeaveDays: count('有給'),
        totalWork: list.reduce((s, e) => s + dayTotalMinutes(e), 0),
    };
};

function AttendanceManagement({ userId }) {
    const profile = getUserProfile(userId);
    const today = new Date();
    const [records, setRecords] = useState([]);
    const [scope, setScope] = useState('department');
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [status, setStatus] = useState('all');
    const [integrationFilter, setIntegrationFilter] = useState('all');
    const [closingFilter, setClosingFilter] = useState('all');
    const [keyword, setKeyword] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [markSyncedConfirmOpen, setMarkSyncedConfirmOpen] = useState(false);

    useEffect(() => { setRecords(loadAttendanceTimesheets()); }, []);

    const scopedRows = useMemo(() => (
        filterByScope(
            records.map((r) => ({ ...r, applicantId: r.userId, applicantDepartment: r.department })),
            { scope, userId: profile.id, department: profile.department },
        )
    ), [records, scope, profile.id, profile.department]);

    const filtered = useMemo(() => {
        const kw = keyword.trim().toLowerCase();
        return scopedRows
            .filter((r) => {
                if (year && r.year !== Number(year)) return false;
                if (month && r.month !== Number(month)) return false;
                if (status !== 'all' && r.approvalStatus !== status) return false;
                if (integrationFilter !== 'all' && getAttendanceIntegrationStatus(r) !== integrationFilter) return false;
                if (closingFilter !== 'all' && r.closingStatus !== closingFilter) return false;
                if (kw) {
                    const hay = `${r.userName} ${r.department} ${r.userId}`.toLowerCase();
                    if (!hay.includes(kw)) return false;
                }
                return true;
            })
            .sort((a, b) => a.userName.localeCompare(b.userName, 'ja'));
    }, [scopedRows, year, month, status, integrationFilter, closingFilter, keyword]);

    const handleReset = () => {
        setStatus('all');
        setIntegrationFilter('all');
        setClosingFilter('all');
        setKeyword('');
    };

    const syncableTargets = useMemo(() => filtered.filter((r) => {
        const s = getAttendanceIntegrationStatus(r);
        return s === 'pending' || s === 'error';
    }), [filtered]);

    const persistAndReload = (next) => {
        saveAttendanceTimesheets(next);
        setRecords(next);
    };

    const handleExportCsv = () => {
        if (filtered.length === 0) {
            setSnackbar({ open: true, message: '出力対象がありません', severity: 'warning' });
            return;
        }
        const columns = [
            { label: '社員ID', value: (r) => r.userId },
            { label: '氏名', value: (r) => r.userName },
            { label: '部署', value: (r) => r.department },
            { label: '年', value: (r) => r.year },
            { label: '月', value: (r) => r.month },
            { label: '出勤日数', value: (r) => computeSummary(r.entries).workDays },
            { label: '欠勤日数', value: (r) => computeSummary(r.entries).absenceDays },
            { label: '有給日数', value: (r) => computeSummary(r.entries).paidLeaveDays },
            { label: '総就業時間(分)', value: (r) => computeSummary(r.entries).totalWork },
            { label: '承認状態', value: (r) => r.approvalStatus },
            { label: '承認者', value: (r) => r.approvedBy },
            { label: '承認日時', value: (r) => (r.approvedAt ? new Date(r.approvedAt).toLocaleString() : '') },
            { label: '連携状況', value: (r) => getAttendanceIntegrationStatus(r) },
            { label: '締め状況', value: (r) => r.closingStatus },
        ];
        const csv = buildCsv(filtered, columns);
        downloadCsv(csv, `attendance-${year}-${String(month).padStart(2, '0')}-${todayStamp()}.csv`);
        setSnackbar({ open: true, message: `${filtered.length} 件を CSV 出力しました`, severity: 'success' });
    };

    const handleMarkSynced = () => {
        if (syncableTargets.length === 0) return;
        const ids = new Set(syncableTargets.map((r) => r.id));
        const nowIso = new Date().toISOString();
        const next = records.map((r) => (
            ids.has(r.id)
                ? { ...r, integrationStatus: 'synced', integrationSyncedAt: nowIso, integrationError: '' }
                : r
        ));
        persistAndReload(next);
        setMarkSyncedConfirmOpen(false);
        setSnackbar({ open: true, message: `${ids.size} 件を連携済にマークしました`, severity: 'success' });
    };

    const summary = useMemo(() => {
        const total = filtered.reduce((s, r) => s + computeSummary(r.entries).totalWork, 0);
        const counts = filtered.reduce((acc, r) => { acc[r.approvalStatus] = (acc[r.approvalStatus] || 0) + 1; return acc; }, {});
        return { total, counts };
    }, [filtered]);

    const scopeHint = scope === 'department'
        ? `${profile.department} の勤怠を表示中`
        : '全社の勤怠を表示中';

    const filtersActive = status !== 'all' || integrationFilter !== 'all' || closingFilter !== 'all' || keyword !== '';

    return (
        <PageScaffold
            eyebrow="勤怠"
            title="勤怠管理"
            subtitle="全社員の月次勤怠を参照します。締め状況・連携状況を可視化し、漏れを把握できます。"
            actions={(
                <>
                    <Button
                        variant="text"
                        color="inherit"
                        startIcon={<RestartAltRoundedIcon />}
                        onClick={handleReset}
                        disabled={!filtersActive}
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

            <Section title="絞り込み" padded sx={{ paddingBlock: 2 }}>
                <Box sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(6, 1fr)' },
                }}>
                    <TextField size="small" type="number" label="年" value={year} onChange={(e) => setYear(Number(e.target.value))} inputProps={{ min: 2020, max: 2100 }} />
                    <TextField size="small" type="number" label="月" value={month} onChange={(e) => setMonth(Math.min(12, Math.max(1, Number(e.target.value))))} inputProps={{ min: 1, max: 12 }} />
                    <FormControl size="small">
                        <InputLabel>承認状態</InputLabel>
                        <Select label="承認状態" value={status} onChange={(e) => setStatus(e.target.value)}>
                            <MenuItem value="all">すべて</MenuItem>
                            {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small">
                        <InputLabel>連携状況</InputLabel>
                        <Select label="連携状況" value={integrationFilter} onChange={(e) => setIntegrationFilter(e.target.value)}>
                            <MenuItem value="all">すべて</MenuItem>
                            {INTEGRATION_FILTER_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small">
                        <InputLabel>締め状況</InputLabel>
                        <Select label="締め状況" value={closingFilter} onChange={(e) => setClosingFilter(e.target.value)}>
                            <MenuItem value="all">すべて</MenuItem>
                            {CLOSING_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <TextField size="small" label="社員名・部署で検索" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                </Box>
            </Section>

            <Section tone="sunken" elevation={0}>
                <Stack direction="row" spacing={4} flexWrap="wrap" alignItems="center">
                    <Stat label="該当件数" value={filtered.length} unit="件" tone="primary" />
                    <Stat label="承認済" value={summary.counts['承認済'] || 0} unit="件" tone="leaf" />
                    <Stat label="申請中" value={summary.counts['申請中'] || 0} unit="件" tone="iris" />
                    <Stat label="下書き" value={summary.counts['下書き'] || 0} unit="件" tone="slate" />
                    <Stat label="合計就業時間" value={formatDuration(summary.total)} tone="amber" />
                </Stack>
            </Section>

            {filtered.length === 0 ? (
                <Section padded sx={{ textAlign: 'center', paddingBlock: 6 }}>
                    <SearchOffRoundedIcon sx={{ fontSize: 40, color: 'var(--ink-muted)' }} />
                    <Typography variant="body2" sx={{ color: 'var(--ink-tertiary)', mt: 1 }}>
                        条件に一致する勤怠はありません。
                    </Typography>
                </Section>
            ) : (
                <Section padded={false}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ width: 200 }}>社員 / 部署</TableCell>
                                    <TableCell sx={{ width: 110 }}>年月</TableCell>
                                    <TableCell sx={{ width: 110 }}>承認状態</TableCell>
                                    <TableCell sx={{ width: 90 }} align="right">出勤日</TableCell>
                                    <TableCell sx={{ width: 110 }} align="right">総就業</TableCell>
                                    <TableCell>承認者</TableCell>
                                    <TableCell sx={{ width: 160 }}>連携状況</TableCell>
                                    <TableCell sx={{ width: 110 }}>締め</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filtered.map((rec) => {
                                    const s = computeSummary(rec.entries);
                                    const statusKey = toStatusKey(rec.approvalStatus);
                                    const integration = getAttendanceIntegrationStatus(rec);
                                    return (
                                        <TableRow key={rec.id} sx={{ '& td': { paddingBlock: 1.25 }, '&:hover': { background: 'var(--surface-sunken)' } }}>
                                            <TableCell>
                                                <Stack spacing={0.25}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--ink-primary)' }}>
                                                        {rec.userName}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                                                        {rec.department}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell className="tabular-nums">{rec.year}/{pad2(rec.month)}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box aria-hidden sx={{ width: 3, height: 18, borderRadius: 'var(--radius-pill)', background: statusBarColor(statusKey) }} />
                                                    <StatusChip status={statusKey} size="sm" />
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right" className="tabular-nums">{s.workDays}日</TableCell>
                                            <TableCell align="right" className="tabular-nums" sx={{ fontWeight: 600, color: 'var(--accent-iris)' }}>{formatDuration(s.totalWork)}</TableCell>
                                            <TableCell>
                                                {rec.approvedBy ? (
                                                    <Stack spacing={0.25}>
                                                        <Typography variant="caption" sx={{ color: 'var(--ink-secondary)' }}>{rec.approvedBy}</Typography>
                                                        <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                                                            {rec.approvedAt && new Date(rec.approvedAt).toLocaleDateString()}
                                                        </Typography>
                                                    </Stack>
                                                ) : (
                                                    <Typography variant="caption" sx={{ color: 'var(--ink-muted)' }}>-</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <IntegrationStatusChip status={integration} target="attendance" size="sm" />
                                                {rec.integrationStatus === 'error' && rec.integrationError && (
                                                    <Typography variant="caption" sx={{ color: 'var(--accent-rose)', display: 'block', mt: 0.25 }}>
                                                        {rec.integrationError}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <IntegrationStatusChip
                                                    status={rec.closingStatus === 'closed' ? 'closed' : 'not_applicable'}
                                                    size="sm"
                                                    showLabel
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
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
                message={`現在の絞り込み結果のうち、連携待ち・連携エラーの ${syncableTargets.length} 件を給与 SaaS 連携済としてマークします。実行前に外部 SaaS 側で取り込み完了を確認してください。`}
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
    slate: 'var(--accent-slate)',
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

export default AttendanceManagement;
