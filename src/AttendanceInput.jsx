import { useEffect, useMemo, useState } from 'react';
import {
    Alert, Box, Button, FormControl, InputLabel, MenuItem, Select, Snackbar, Stack, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import AdminConfirmDialog from './components/AdminConfirmDialog';
import PageScaffold from './ui/PageScaffold.jsx';
import Section from './ui/Section.jsx';
import { KeyHint } from './ui/KeyHint.jsx';

const SOURCE_YEAR = 2025;
const SOURCE_MONTH = 2;
const SOURCE_MONTH_KEY = `${SOURCE_YEAR}-${String(SOURCE_MONTH).padStart(2, '0')}`;

const ATTENDANCE_TYPES = ['出勤', '欠勤', '有給', '振替休日'];

const TIME_RULES = {
    basicStart: 9 * 60 + 30, basicEnd: 18 * 60 + 30,
    earlyStart: 5 * 60, earlyEnd: 9 * 60 + 30,
    overtimeStart: 18 * 60 + 30, overtimeEnd: 22 * 60,
    nightStart: 22 * 60, nightEnd: 5 * 60,
    startRoundMinutes: 1, endRoundMinutes: 1,
};

const EXCEL_SAMPLE_ENTRIES = {
    '2025-02-03': { type: '出勤', clockIn: '08:00', clockOut: '15:00', note: '' },
    '2025-02-04': { type: '出勤', clockIn: '10:00', clockOut: '23:00', note: '' },
};

const DEFAULT_PATTERN = { type: '出勤', clockIn: '09:30', clockOut: '18:30', target: 'weekdays' };

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const pad2 = (v) => String(v).padStart(2, '0');
const monthKeyOf = (y, m) => `${y}-${pad2(m)}`;
const dateKeyOf = (y, m, d) => `${monthKeyOf(y, m)}-${pad2(d)}`;
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
const buildSnapshot = (employee, entries) => JSON.stringify({ employee, entries });
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

function AttendanceInput({ username = '', userId = '' }) {
    const [year, setYear] = useState(SOURCE_YEAR);
    const [month, setMonth] = useState(SOURCE_MONTH);
    const [employee, setEmployee] = useState({ employeeId: userId, name: username, department: '' });
    const [entries, setEntries] = useState(EXCEL_SAMPLE_ENTRIES);
    const [defaultPattern, setDefaultPattern] = useState(() => {
        const saved = JSON.parse(localStorage.getItem('attendanceDefaultPattern') || 'null');
        return { ...DEFAULT_PATTERN, ...(saved || {}) };
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: '勤怠入力を保存しました', severity: 'success' });
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
    const [periodChangeConfirmOpen, setPeriodChangeConfirmOpen] = useState(false);
    const [pendingPeriodChange, setPendingPeriodChange] = useState(null);
    const [lastSavedSnapshot, setLastSavedSnapshot] = useState(() =>
        buildSnapshot({ employeeId: userId, name: username, department: '' }, EXCEL_SAMPLE_ENTRIES),
    );

    const monthKey = monthKeyOf(year, month);
    const storageKey = `attendanceTimesheet:${monthKey}`;
    const currentSnapshot = useMemo(() => buildSnapshot(employee, entries), [employee, entries]);
    const hasUnsavedChanges = currentSnapshot !== lastSavedSnapshot;

    useEffect(() => {
        setEmployee((prev) => ({ ...prev, employeeId: prev.employeeId || userId, name: prev.name || username }));
    }, [userId, username]);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
        if (saved) {
            const next = saved.entries || {};
            setEmployee((prev) => {
                const nextEmp = { ...prev, ...(saved.employee || {}), employeeId: saved.employee?.employeeId || prev.employeeId, name: saved.employee?.name || prev.name };
                setLastSavedSnapshot(buildSnapshot(nextEmp, next));
                return nextEmp;
            });
            setEntries(next);
            return;
        }
        const next = monthKey === SOURCE_MONTH_KEY ? EXCEL_SAMPLE_ENTRIES : {};
        setEntries(next);
        setEmployee((prev) => { setLastSavedSnapshot(buildSnapshot(prev, next)); return prev; });
    }, [monthKey, storageKey]);

    const rows = useMemo(() => {
        const days = getDaysInMonth(year, month);
        return Array.from({ length: days }, (_, idx) => {
            const day = idx + 1;
            const date = new Date(year, month - 1, day);
            const dateKey = dateKeyOf(year, month, day);
            const entry = entries[dateKey] || { type: '', clockIn: '', clockOut: '', note: '' };
            const calc = entry.type === '出勤' ? calculateWorkTimes(entry.clockIn, entry.clockOut) : emptyCalc();
            return { dateKey, day, weekday: WEEKDAYS[date.getDay()], isWeekend: date.getDay() === 0 || date.getDay() === 6, entry, calc };
        });
    }, [entries, month, year]);

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

    const handleEmployeeChange = (field) => (e) => setEmployee((p) => ({ ...p, [field]: e.target.value }));
    const handleEntryChange = (dateKey, field) => (e) => {
        const value = e.target.value;
        setEntries((p) => ({
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
        let applied = 0;
        const next = { ...entries };
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
        setEntries(next);
        setSnackbar({ open: true, message: `${applied}日分にデフォルト勤務を反映しました`, severity: 'success' });
    };

    const handleSave = () => {
        if (hasBlocking) {
            setSnackbar({ open: true, message: '保存前に入力エラーを修正してください', severity: 'warning' });
            return;
        }
        localStorage.setItem(storageKey, JSON.stringify({ employee, entries }));
        setLastSavedSnapshot(buildSnapshot(employee, entries));
        setSnackbar({ open: true, message: '勤怠入力を保存しました', severity: 'success' });
    };
    const handleClearConfirm = () => {
        setEntries({});
        localStorage.setItem(storageKey, JSON.stringify({ employee, entries: {} }));
        setLastSavedSnapshot(buildSnapshot(employee, {}));
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
    }, [employee, entries, hasBlocking]);

    return (
        <PageScaffold
            eyebrow="勤怠"
            title="月次タイムシート"
            subtitle="出社・退社を記入すると、計算列が自動で更新されます。「型を流す」で平日を一気に整えられます。"
            actions={(
                <>
                    <Button startIcon={<RestartAltRoundedIcon />} variant="text" color="inherit" onClick={() => setClearConfirmOpen(true)} sx={{ color: 'var(--ink-tertiary)' }}>
                        入力クリア
                    </Button>
                    <Button
                        startIcon={<SaveRoundedIcon />}
                        variant="contained"
                        onClick={handleSave}
                        disabled={hasBlocking}
                        endIcon={<KeyHint keys={['Mod', 'S']} />}
                    >
                        保存
                    </Button>
                </>
            )}
        >
            {hasBlocking && (
                <Alert severity="warning" sx={{ borderRadius: 'var(--radius-md)' }}>
                    保存前に入力エラーを修正してください。{validationErrors[0]}
                </Alert>
            )}

            <Section padded>
                <Stack spacing={2.5}>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(180px, 1fr))', lg: '120px 120px repeat(3, minmax(180px, 1fr))' },
                            gap: 2,
                        }}
                    >
                        <TextField label="年" type="number" size="small" value={year}
                            onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v)) requestPeriodChange({ year: v, month }); }}
                            inputProps={{ min: 2000, max: 2100 }} />
                        <TextField label="月" type="number" size="small" value={month}
                            onChange={(e) => { const v = Math.min(12, Math.max(1, Number(e.target.value))); if (Number.isFinite(v)) requestPeriodChange({ year, month: v }); }}
                            inputProps={{ min: 1, max: 12 }} />
                        <TextField label="社員ID" size="small" value={employee.employeeId} onChange={handleEmployeeChange('employeeId')} />
                        <TextField label="氏名" size="small" value={employee.name} onChange={handleEmployeeChange('name')} />
                        <TextField label="所属" size="small" value={employee.department} onChange={handleEmployeeChange('department')} />
                    </Box>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(180px, 1fr))', lg: '140px 160px 140px 140px 200px auto' },
                            gap: 2,
                            alignItems: 'center',
                            padding: 2,
                            background: 'var(--accent-iris-soft)',
                            borderRadius: 'var(--radius-md)',
                        }}
                    >
                        <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1', lg: 'auto' } }}>
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
                            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(7, minmax(0, 1fr))' },
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
                                    <Select size="small" value={row.entry.type} displayEmpty fullWidth onChange={handleEntryChange(row.dateKey, 'type')}>
                                        <MenuItem value=""><span style={{ color: 'var(--ink-muted)' }}>未選択</span></MenuItem>
                                        {ATTENDANCE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <TextField type="time" size="small" value={row.entry.clockIn} fullWidth
                                        disabled={row.entry.type !== '出勤'} onChange={handleEntryChange(row.dateKey, 'clockIn')} inputProps={{ step: 60 }} />
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        type="time"
                                        size="small"
                                        value={row.entry.clockOut}
                                        fullWidth
                                        error={Boolean(row.calc.error)}
                                        disabled={row.entry.type !== '出勤'}
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
        </PageScaffold>
    );
}

export default AttendanceInput;
