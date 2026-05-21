import { useEffect, useMemo, useState } from 'react';
import {
    Alert, Box, Button, FormControl, InputLabel, MenuItem, Select, Snackbar, Stack, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import AdminConfirmDialog from './components/AdminConfirmDialog';
import PageScaffold from './ui/PageScaffold.jsx';
import Section from './ui/Section.jsx';
import StatusChip from './ui/StatusChip.jsx';
import IntegrationStatusChip from './ui/IntegrationStatusChip.jsx';
import { KeyHint } from './ui/KeyHint.jsx';
import {
    emptyAttendance,
    findAttendance,
    getAttendanceIntegrationStatus,
    loadAttendanceTimesheets,
    saveAttendanceTimesheets,
    upsertAttendance,
} from './attendanceStore';
import { getUserProfile } from './userDirectory';

const ATTENDANCE_TYPES = ['出勤', '欠勤', '有給', '振替休日'];

const TIME_RULES = {
    basicStart: 9 * 60 + 30, basicEnd: 18 * 60 + 30,
    earlyStart: 5 * 60, earlyEnd: 9 * 60 + 30,
    overtimeStart: 18 * 60 + 30, overtimeEnd: 22 * 60,
    nightStart: 22 * 60, nightEnd: 5 * 60,
    startRoundMinutes: 1, endRoundMinutes: 1,
};

const DEFAULT_PATTERN = { type: '出勤', clockIn: '09:30', clockOut: '18:30', target: 'weekdays' };

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const pad2 = (v) => String(v).padStart(2, '0');
const dateKeyOf = (y, m, d) => `${y}-${pad2(m)}-${pad2(d)}`;
const getDaysInMonth = (y, m) => new Date(y, m, 0).getDate();
const parseTime = (v) => {
    if (!v) return null;
    const [h, m] = v.split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
};
const formatClock = (m) => {
    if (m === null || m === undefined) return '-';
    const n = ((m % (24 * 60)) + (24 * 60)) % (24 * 60);
    return `${pad2(Math.floor(n / 60))}:${pad2(n % 60)}`;
};
const formatDuration = (m) => {
    if (m === null || m === undefined) return '-';
    const sign = m < 0 ? '-' : '';
    const a = Math.abs(m);
    return `${sign}${Math.floor(a / 60)}:${pad2(a % 60)}`;
};
const ceilToUnit = (m, u) => Math.ceil(m / u) * u;
const floorToUnit = (m, u) => Math.floor(m / u) * u;
const isBlankEntry = (e = {}) => !e.type && !e.clockIn && !e.clockOut && !e.note;
const buildSnapshot = (entries) => JSON.stringify(entries);
const emptyCalc = (error = '') => ({ start: null, end: null, basic: null, earlyOvertime: null, night: null, total: null, error });
const getBreakMinutes = (g) => (g > 8 * 60 ? 60 : g > 6 * 60 ? 45 : 0);
const overlapMinutes = (s, e, rs, re) => Math.max(0, Math.min(e, re) - Math.max(s, rs));
const sumDailyRange = (s, e, rs, re) => {
    const oneDay = 24 * 60;
    return [0, oneDay].reduce((t, off) => t + overlapMinutes(s, e, rs + off, re + off), 0);
};

const calculateWorkTimes = (clockIn, clockOut) => {
    const ci = parseTime(clockIn);
    const co = parseTime(clockOut);
    if (ci === null || co === null) return emptyCalc();
    const start = ceilToUnit(ci, TIME_RULES.startRoundMinutes);
    const rOut = floorToUnit(co, TIME_RULES.endRoundMinutes);
    const end = rOut < start ? rOut + 24 * 60 : rOut;
    if (end === start) return emptyCalc('退社は出社より後の時刻を入力してください');
    const gross = end - start;
    const br = getBreakMinutes(gross);
    const basicRaw = sumDailyRange(start, end, TIME_RULES.basicStart, TIME_RULES.basicEnd);
    const early = sumDailyRange(start, end, TIME_RULES.earlyStart, TIME_RULES.earlyEnd);
    const ot = sumDailyRange(start, end, TIME_RULES.overtimeStart, TIME_RULES.overtimeEnd);
    const night = sumDailyRange(start, end, 0, TIME_RULES.nightEnd) + sumDailyRange(start, end, TIME_RULES.nightStart, 24 * 60);
    return { start, end, basic: Math.max(0, basicRaw - br), earlyOvertime: early + ot, night, total: Math.max(0, gross - br), error: '' };
};

const toApprovalStatusKey = (s) => (
    s === '承認済' ? 'approved' : s === '差戻し' ? 'rejected' : s === '取消' ? 'cancelled' : s === '下書き' ? 'draft' : 'pending'
);

function AttendanceInput({ username = '', userId = '' }) {
    const profile = getUserProfile(userId);
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [record, setRecord] = useState(() => emptyAttendance(profile.id, today.getFullYear(), today.getMonth() + 1));
    const [defaultPattern, setDefaultPattern] = useState(() => {
        const saved = JSON.parse(localStorage.getItem('attendanceDefaultPattern') || 'null');
        return { ...DEFAULT_PATTERN, ...(saved || {}) };
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
    const [periodChangeConfirmOpen, setPeriodChangeConfirmOpen] = useState(false);
    const [pendingPeriodChange, setPendingPeriodChange] = useState(null);
    const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
    const [lastSavedSnapshot, setLastSavedSnapshot] = useState(() => buildSnapshot({}));

    const currentSnapshot = useMemo(() => buildSnapshot(record.entries), [record.entries]);
    const hasUnsavedChanges = currentSnapshot !== lastSavedSnapshot;
    const isEditable = record.approvalStatus === '下書き' || record.approvalStatus === '差戻し';
    const isLocked = !isEditable;

    useEffect(() => {
        const all = loadAttendanceTimesheets();
        const found = findAttendance(all, profile.id, year, month);
        const next = found || emptyAttendance(profile.id, year, month);
        setRecord(next);
        setLastSavedSnapshot(buildSnapshot(next.entries));
    }, [profile.id, year, month]);

    const updateEntries = (updater) => {
        setRecord((prev) => ({ ...prev, entries: typeof updater === 'function' ? updater(prev.entries) : updater }));
    };

    const rows = useMemo(() => {
        const days = getDaysInMonth(year, month);
        return Array.from({ length: days }, (_, idx) => {
            const day = idx + 1;
            const date = new Date(year, month - 1, day);
            const dateKey = dateKeyOf(year, month, day);
            const entry = record.entries[dateKey] || { type: '', clockIn: '', clockOut: '', note: '' };
            const calc = entry.type === '出勤' ? calculateWorkTimes(entry.clockIn, entry.clockOut) : emptyCalc();
            return { dateKey, day, weekday: WEEKDAYS[date.getDay()], isWeekend: date.getDay() === 0 || date.getDay() === 6, entry, calc };
        });
    }, [record.entries, month, year]);

    const summary = useMemo(() => {
        const count = (t) => rows.filter((r) => r.entry.type === t).length;
        const sum = (f) => rows.reduce((acc, r) => acc + (r.calc[f] || 0), 0);
        return {
            workDays: count('出勤'),
            absenceDays: count('欠勤'),
            paidLeaveDays: count('有給'),
            substituteLeaveDays: count('振替休日'),
            totalWork: sum('total'),
            earlyOvertime: sum('earlyOvertime'),
            night: sum('night'),
        };
    }, [rows]);

    const validationErrors = useMemo(() =>
        rows.flatMap((r) => {
            if (r.entry.type !== '出勤') return [];
            if (!r.entry.clockIn || !r.entry.clockOut) return [`${r.day}日: 出勤は出社と退社を入力してください`];
            if (r.calc.error) return [`${r.day}日: ${r.calc.error}`];
            return [];
        }),
    [rows]);

    const hasBlocking = validationErrors.length > 0;
    const hasAnyEntries = Object.values(record.entries).some((e) => !isBlankEntry(e));

    const handleEntryChange = (dateKey, field) => (e) => {
        if (isLocked) return;
        const value = e.target.value;
        updateEntries((p) => ({
            ...p,
            [dateKey]: {
                ...(p[dateKey] || { type: '', clockIn: '', clockOut: '', note: '' }),
                [field]: value,
                ...(field === 'type' && value !== '出勤' ? { clockIn: '', clockOut: '' } : {}),
            },
        }));
    };
    const handleDefaultPatternChange = (field) => (e) => {
        const value = e.target.value;
        const next = { ...defaultPattern, [field]: value, ...(field === 'type' && value !== '出勤' ? { clockIn: '', clockOut: '' } : {}) };
        setDefaultPattern(next);
        localStorage.setItem('attendanceDefaultPattern', JSON.stringify(next));
    };
    const requestPeriodChange = (next) => {
        if (hasUnsavedChanges) {
            setPendingPeriodChange(next);
            setPeriodChangeConfirmOpen(true);
            return;
        }
        setYear(next.year);
        setMonth(next.month);
    };
    const handlePeriodChangeConfirm = () => {
        if (pendingPeriodChange) { setYear(pendingPeriodChange.year); setMonth(pendingPeriodChange.month); }
        setPendingPeriodChange(null);
        setPeriodChangeConfirmOpen(false);
    };
    const handleApplyDefaultPattern = () => {
        if (isLocked) return;
        let applied = 0;
        const next = { ...record.entries };
        rows.forEach((r) => {
            if (defaultPattern.target === 'weekdays' && r.isWeekend) return;
            if (!isBlankEntry(next[r.dateKey])) return;
            next[r.dateKey] = {
                type: defaultPattern.type,
                clockIn: defaultPattern.type === '出勤' ? defaultPattern.clockIn : '',
                clockOut: defaultPattern.type === '出勤' ? defaultPattern.clockOut : '',
                note: '',
            };
            applied += 1;
        });
        updateEntries(next);
        setSnackbar({ open: true, message: `${applied}日分にデフォルト勤務を反映しました`, severity: 'success' });
    };

    const persist = (updated) => {
        const all = loadAttendanceTimesheets();
        const next = upsertAttendance(all, updated);
        saveAttendanceTimesheets(next);
    };

    const handleSave = () => {
        if (isLocked) return;
        if (hasBlocking) {
            setSnackbar({ open: true, message: '保存前に入力エラーを修正してください', severity: 'warning' });
            return;
        }
        const updated = { ...record, approvalStatus: record.approvalStatus === '差戻し' ? '下書き' : record.approvalStatus };
        persist(updated);
        setRecord(updated);
        setLastSavedSnapshot(buildSnapshot(updated.entries));
        setSnackbar({ open: true, message: '勤怠入力を保存しました', severity: 'success' });
    };

    const handleSubmit = () => {
        if (isLocked) return;
        if (hasBlocking) {
            setSnackbar({ open: true, message: '申請前に入力エラーを修正してください', severity: 'warning' });
            return;
        }
        if (!hasAnyEntries) {
            setSnackbar({ open: true, message: '勤怠が未入力です', severity: 'warning' });
            return;
        }
        const updated = {
            ...record,
            approvalStatus: '申請中',
            submittedAt: new Date().toISOString(),
            remarks: '',
            approvedBy: '',
            approvedAt: '',
        };
        persist(updated);
        setRecord(updated);
        setLastSavedSnapshot(buildSnapshot(updated.entries));
        setSubmitConfirmOpen(false);
        setSnackbar({ open: true, message: `${year}年${month}月の勤怠を申請しました`, severity: 'success' });
    };

    const handleClearConfirm = () => {
        if (isLocked) {
            setClearConfirmOpen(false);
            return;
        }
        const updated = { ...record, entries: {} };
        persist(updated);
        setRecord(updated);
        setLastSavedSnapshot(buildSnapshot({}));
        setClearConfirmOpen(false);
        setSnackbar({ open: true, message: '勤怠入力をクリアしました', severity: 'success' });
    };

    useEffect(() => {
        const onKey = (e) => {
            if ((e.metaKey || e.ctrlKey) && (e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [record, hasBlocking, isLocked]);

    const approvalKey = toApprovalStatusKey(record.approvalStatus);
    const integrationStatus = getAttendanceIntegrationStatus(record);

    return (
        <PageScaffold
            eyebrow="勤怠"
            title="月次タイムシート"
            subtitle={`${profile.name}（${profile.department}）の月次勤怠です。${isLocked ? '承認状態のため編集はロックされています。' : '入力後に上長へ申請してください。'}`}
            actions={(
                <>
                    <Button
                        startIcon={<RestartAltRoundedIcon />}
                        variant="text"
                        color="inherit"
                        onClick={() => setClearConfirmOpen(true)}
                        disabled={isLocked}
                        sx={{ color: 'var(--ink-tertiary)' }}
                    >
                        入力クリア
                    </Button>
                    <Button
                        startIcon={<SaveRoundedIcon />}
                        variant="outlined"
                        onClick={handleSave}
                        disabled={isLocked || hasBlocking}
                        endIcon={<KeyHint keys={['Mod', 'S']} />}
                    >
                        下書き保存
                    </Button>
                    <Button
                        startIcon={<SendRoundedIcon />}
                        variant="contained"
                        onClick={() => setSubmitConfirmOpen(true)}
                        disabled={isLocked || hasBlocking || !hasAnyEntries}
                    >
                        申請する
                    </Button>
                </>
            )}
        >
            <Section padded sx={{ paddingBlock: 2 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} flexWrap="wrap" rowGap={1.5}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={1}>
                        <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', fontWeight: 700 }}>承認状態:</Typography>
                        <StatusChip status={approvalKey} size="sm" />
                        <IntegrationStatusChip status={integrationStatus} target="attendance" size="sm" />
                        {record.closingStatus === 'closed' && (
                            <IntegrationStatusChip status="closed" size="sm" />
                        )}
                    </Stack>
                    {record.submittedAt && (
                        <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                            申請: {new Date(record.submittedAt).toLocaleString()}
                        </Typography>
                    )}
                    {record.approvedBy && (
                        <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                            承認: {record.approvedBy}{record.approvedAt && ` ・ ${new Date(record.approvedAt).toLocaleString()}`}
                        </Typography>
                    )}
                </Stack>
                {record.approvalStatus === '差戻し' && record.remarks && (
                    <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 'var(--radius-md)' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>承認者備考</Typography>
                        {record.remarks}
                    </Alert>
                )}
            </Section>

            {hasBlocking && !isLocked && (
                <Alert severity="warning" sx={{ borderRadius: 'var(--radius-md)' }}>
                    保存・申請前に入力エラーを修正してください。{validationErrors[0]}
                </Alert>
            )}

            <Section padded>
                <Stack spacing={2.5}>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(180px, 1fr))', md: '120px 120px repeat(3, minmax(180px, 1fr))' },
                            gap: 2,
                        }}
                    >
                        <TextField label="年" type="number" size="small" value={year}
                            onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v)) requestPeriodChange({ year: v, month }); }}
                            inputProps={{ min: 2000, max: 2100 }} />
                        <TextField label="月" type="number" size="small" value={month}
                            onChange={(e) => { const v = Math.min(12, Math.max(1, Number(e.target.value))); if (Number.isFinite(v)) requestPeriodChange({ year, month: v }); }}
                            inputProps={{ min: 1, max: 12 }} />
                        <TextField label="社員ID" size="small" value={record.userId} InputProps={{ readOnly: true }} />
                        <TextField label="氏名" size="small" value={record.userName} InputProps={{ readOnly: true }} />
                        <TextField label="所属" size="small" value={record.department} InputProps={{ readOnly: true }} />
                    </Box>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: 'minmax(160px, 200px) 1fr 1fr 1fr 1fr auto' },
                            gap: 2,
                            alignItems: 'center',
                            padding: 2,
                            background: 'var(--accent-iris-soft)',
                            borderRadius: 'var(--radius-md)',
                            opacity: isLocked ? 0.5 : 1,
                            pointerEvents: isLocked ? 'none' : 'auto',
                        }}
                    >
                        <Box sx={{ gridColumn: { xs: '1', md: 'auto' } }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'var(--accent-iris)' }}>
                                型を流す
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                                未入力日にだけ反映
                            </Typography>
                        </Box>
                        <FormControl size="small" fullWidth>
                            <InputLabel>デフォルト区分</InputLabel>
                            <Select label="デフォルト区分" value={defaultPattern.type} onChange={handleDefaultPatternChange('type')}>
                                {ATTENDANCE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <TextField label="デフォルト出社" type="time" size="small" value={defaultPattern.clockIn}
                            disabled={defaultPattern.type !== '出勤'} onChange={handleDefaultPatternChange('clockIn')} inputProps={{ step: 60 }} />
                        <TextField label="デフォルト退社" type="time" size="small" value={defaultPattern.clockOut}
                            disabled={defaultPattern.type !== '出勤'} onChange={handleDefaultPatternChange('clockOut')} inputProps={{ step: 60 }} />
                        <FormControl size="small" fullWidth>
                            <InputLabel>反映対象</InputLabel>
                            <Select label="反映対象" value={defaultPattern.target} onChange={handleDefaultPatternChange('target')}>
                                <MenuItem value="weekdays">未入力の平日のみ</MenuItem>
                                <MenuItem value="all">未入力の全日</MenuItem>
                            </Select>
                        </FormControl>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={handleApplyDefaultPattern}
                            disabled={!defaultPattern.type || (defaultPattern.type === '出勤' && (!defaultPattern.clockIn || !defaultPattern.clockOut))}
                            sx={{ minHeight: 40, background: 'var(--accent-iris)', '&:hover': { background: 'var(--accent-iris)', filter: 'brightness(1.05)' } }}
                        >
                            反映
                        </Button>
                    </Box>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(auto-fit, minmax(110px, 1fr))' },
                            gap: 1,
                        }}
                    >
                        {[
                            ['出勤日数', `${summary.workDays}日`, 'primary'],
                            ['欠勤日数', `${summary.absenceDays}日`, 'slate'],
                            ['有休', `${summary.paidLeaveDays}日`, 'leaf'],
                            ['振替休日', `${summary.substituteLeaveDays}日`, 'iris'],
                            ['総就業', formatDuration(summary.totalWork), 'primary'],
                            ['早出/残業', formatDuration(summary.earlyOvertime), 'amber'],
                            ['早朝/深夜', formatDuration(summary.night), 'iris'],
                        ].map(([label, value, tone]) => (
                            <Box
                                key={label}
                                sx={{
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--surface-sunken)',
                                    paddingInline: 1.5,
                                    paddingBlock: 1,
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                            >
                                <Box
                                    aria-hidden
                                    sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: `var(--accent-${tone === 'slate' ? 'slate' : tone})`, opacity: 0.7 }}
                                />
                                <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', display: 'block' }}>{label}</Typography>
                                <Typography sx={{ fontWeight: 800, fontSize: 18, lineHeight: 1.1, color: 'var(--ink-primary)', fontVariantNumeric: 'tabular-nums' }}>
                                    {value}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Stack>
            </Section>

            <TableContainer
                sx={{
                    maxHeight: 'calc(100vh - 280px)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--surface-raised)',
                    boxShadow: 'var(--shadow-1)',
                }}
            >
                <Table stickyHeader size="small" sx={{ minWidth: 1260 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ width: 56 }}>日</TableCell>
                            <TableCell sx={{ width: 56 }}>曜</TableCell>
                            <TableCell sx={{ width: 128 }}>区分</TableCell>
                            <TableCell sx={{ width: 116 }}>出社</TableCell>
                            <TableCell sx={{ width: 116 }}>退社</TableCell>
                            <TableCell sx={{ width: 80 }} align="right">開始</TableCell>
                            <TableCell sx={{ width: 80 }} align="right">終了</TableCell>
                            <TableCell sx={{ width: 80 }} align="right">基本</TableCell>
                            <TableCell sx={{ width: 96 }} align="right">早出/残業</TableCell>
                            <TableCell sx={{ width: 96 }} align="right">早朝/深夜</TableCell>
                            <TableCell sx={{ width: 80 }} align="right">合計</TableCell>
                            <TableCell>備考</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow
                                key={row.dateKey}
                                hover
                                sx={{
                                    position: 'relative',
                                    background: row.isWeekend ? 'var(--accent-iris-soft)' : 'inherit',
                                    '& .calc-cell': {
                                        background: 'var(--surface-sunken)',
                                        color: 'var(--ink-tertiary)',
                                        fontVariantNumeric: 'tabular-nums',
                                        fontWeight: 500,
                                    },
                                    '& > td:first-of-type': {
                                        boxShadow: row.isWeekend ? 'inset 2px 0 0 var(--accent-iris)' : 'none',
                                    },
                                }}
                            >
                                <TableCell sx={{ fontWeight: 600 }}>{row.day}</TableCell>
                                <TableCell sx={{ color: row.isWeekend ? 'var(--accent-iris)' : 'var(--ink-primary)', fontWeight: row.isWeekend ? 700 : 500 }}>
                                    {row.weekday}
                                </TableCell>
                                <TableCell>
                                    <Select size="small" value={row.entry.type} displayEmpty fullWidth disabled={isLocked} onChange={handleEntryChange(row.dateKey, 'type')}>
                                        <MenuItem value=""><span style={{ color: 'var(--ink-tertiary)' }}>未選択</span></MenuItem>
                                        {ATTENDANCE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <TextField type="time" size="small" value={row.entry.clockIn} fullWidth
                                        disabled={isLocked || row.entry.type !== '出勤'} onChange={handleEntryChange(row.dateKey, 'clockIn')} inputProps={{ step: 60 }} />
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        type="time"
                                        size="small"
                                        value={row.entry.clockOut}
                                        fullWidth
                                        error={Boolean(row.calc.error)}
                                        disabled={isLocked || row.entry.type !== '出勤'}
                                        onChange={handleEntryChange(row.dateKey, 'clockOut')}
                                        inputProps={{ step: 60 }}
                                        sx={row.calc.error ? { '& .MuiOutlinedInput-root': { background: 'var(--accent-amber-soft)' } } : {}}
                                    />
                                </TableCell>
                                <TableCell className="calc-cell" align="right">{formatClock(row.calc.start)}</TableCell>
                                <TableCell className="calc-cell" align="right">{formatClock(row.calc.end)}</TableCell>
                                <TableCell className="calc-cell" align="right">{formatDuration(row.calc.basic)}</TableCell>
                                <TableCell className="calc-cell" align="right">{formatDuration(row.calc.earlyOvertime)}</TableCell>
                                <TableCell className="calc-cell" align="right">{formatDuration(row.calc.night)}</TableCell>
                                <TableCell className="calc-cell" align="right" sx={{ fontWeight: '700 !important', color: 'var(--ink-primary) !important' }}>
                                    {formatDuration(row.calc.total)}
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        size="small"
                                        value={row.entry.note}
                                        fullWidth
                                        multiline
                                        maxRows={2}
                                        disabled={isLocked}
                                        onChange={handleEntryChange(row.dateKey, 'note')}
                                        helperText={row.calc.error || ' '}
                                        error={Boolean(row.calc.error)}
                                        FormHelperTextProps={{ sx: { color: row.calc.error ? 'var(--accent-amber)' : 'transparent' } }}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Snackbar open={snackbar.open} autoHideDuration={2500} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
            <AdminConfirmDialog
                open={clearConfirmOpen}
                title="勤怠入力をクリアしますか？"
                message={`${year}年${month}月の入力内容をクリアします。元に戻せません。`}
                confirmLabel="クリア"
                confirmColor="warning"
                onCancel={() => setClearConfirmOpen(false)}
                onConfirm={handleClearConfirm}
            />
            <AdminConfirmDialog
                open={periodChangeConfirmOpen}
                title="年月を切り替えますか？"
                message="未保存の入力内容があります。保存せずに年月を切り替えると、現在の変更は破棄されます。"
                confirmLabel="切り替え"
                confirmColor="warning"
                onCancel={() => { setPendingPeriodChange(null); setPeriodChangeConfirmOpen(false); }}
                onConfirm={handlePeriodChangeConfirm}
            />
            <AdminConfirmDialog
                open={submitConfirmOpen}
                title={`${year}年${month}月の勤怠を申請しますか？`}
                message="申請後は上長の承認が必要となり、編集できなくなります。差戻された場合は再度編集できます。"
                confirmLabel="申請する"
                confirmColor="primary"
                onCancel={() => setSubmitConfirmOpen(false)}
                onConfirm={handleSubmit}
            />
        </PageScaffold>
    );
}

export default AttendanceInput;
