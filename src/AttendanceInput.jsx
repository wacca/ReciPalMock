import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Container,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
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
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

const SOURCE_YEAR = 2025;
const SOURCE_MONTH = 2;
const SOURCE_MONTH_KEY = `${SOURCE_YEAR}-${String(SOURCE_MONTH).padStart(2, '0')}`;

const ATTENDANCE_TYPES = ['出勤', '欠勤', '有給', '振替休日'];

const TIME_RULES = {
    basicStart: 9 * 60 + 30,
    basicEnd: 18 * 60 + 30,
    earlyStart: 5 * 60,
    earlyEnd: 9 * 60 + 30,
    overtimeStart: 18 * 60 + 30,
    overtimeEnd: 22 * 60,
    nightStart: 22 * 60,
    nightEnd: 5 * 60,
    breakMinutes: 60,
    startRoundMinutes: 1,
    endRoundMinutes: 1,
};

const EXCEL_SAMPLE_ENTRIES = {
    '2025-02-03': { type: '出勤', clockIn: '08:00', clockOut: '15:00', note: '' },
    '2025-02-04': { type: '出勤', clockIn: '10:00', clockOut: '23:00', note: '' },
};

const DEFAULT_PATTERN = {
    type: '出勤',
    clockIn: '09:30',
    clockOut: '18:30',
    target: 'weekdays',
};

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const pad2 = (value) => String(value).padStart(2, '0');

const monthKeyOf = (year, month) => `${year}-${pad2(month)}`;

const dateKeyOf = (year, month, day) => `${monthKeyOf(year, month)}-${pad2(day)}`;

const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

const parseTime = (value) => {
    if (!value) return null;
    const [hours, minutes] = value.split(':').map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    return hours * 60 + minutes;
};

const formatClock = (minutes) => {
    if (minutes === null || minutes === undefined) return '-';
    const normalized = ((minutes % (24 * 60)) + (24 * 60)) % (24 * 60);
    return `${pad2(Math.floor(normalized / 60))}:${pad2(normalized % 60)}`;
};

const formatDuration = (minutes) => {
    if (minutes === null || minutes === undefined) return '-';
    const sign = minutes < 0 ? '-' : '';
    const absolute = Math.abs(minutes);
    return `${sign}${Math.floor(absolute / 60)}:${pad2(absolute % 60)}`;
};

const ceilToUnit = (minutes, unit) => Math.ceil(minutes / unit) * unit;

const floorToUnit = (minutes, unit) => Math.floor(minutes / unit) * unit;

const isBlankEntry = (entry = {}) => !entry.type && !entry.clockIn && !entry.clockOut && !entry.note;

const calculateWorkTimes = (clockIn, clockOut) => {
    const cardIn = parseTime(clockIn);
    const cardOut = parseTime(clockOut);

    if (cardIn === null || cardOut === null) {
        return {
            start: null,
            end: null,
            basic: null,
            earlyOvertime: null,
            night: null,
            total: null,
            error: '',
        };
    }

    const start = ceilToUnit(cardIn, TIME_RULES.startRoundMinutes);
    const end = floorToUnit(cardOut, TIME_RULES.endRoundMinutes);

    if (end < start) {
        return {
            start,
            end,
            basic: null,
            earlyOvertime: null,
            night: null,
            total: null,
            error: '退社は出社以降で入力してください',
        };
    }

    const basic = start <= TIME_RULES.basicStart
        ? (
            end <= TIME_RULES.basicStart
                ? 0
                : end <= TIME_RULES.basicEnd
                    ? end - TIME_RULES.basicStart - TIME_RULES.breakMinutes
                    : TIME_RULES.basicEnd - TIME_RULES.basicStart - TIME_RULES.breakMinutes
        )
        : (
            end <= TIME_RULES.basicEnd
                ? end - start - TIME_RULES.breakMinutes
                : TIME_RULES.basicEnd - start < 0
                    ? 0
                    : TIME_RULES.basicEnd - start - TIME_RULES.breakMinutes
        );

    const early = start <= TIME_RULES.earlyEnd
        ? (
            start <= TIME_RULES.earlyStart
                ? (
                    end <= TIME_RULES.basicStart
                        ? Math.max(end - TIME_RULES.earlyStart, 0)
                        : TIME_RULES.earlyEnd - TIME_RULES.earlyStart
                )
                : (
                    end <= TIME_RULES.basicStart
                        ? end - start
                        : TIME_RULES.earlyEnd - start
                )
        )
        : 0;

    const overtime = end >= TIME_RULES.overtimeStart
        ? (
            end >= TIME_RULES.overtimeEnd
                ? TIME_RULES.overtimeEnd - TIME_RULES.overtimeStart
                : end - TIME_RULES.overtimeStart
        )
        : 0;

    const night = start >= 0 && start <= TIME_RULES.nightEnd && end >= 0 && end <= TIME_RULES.nightEnd
        ? end - start
        : (
            (start < TIME_RULES.nightEnd ? TIME_RULES.nightEnd - start : 0)
            + (end > TIME_RULES.nightStart ? end - TIME_RULES.nightStart : 0)
        );

    return {
        start,
        end,
        basic,
        earlyOvertime: early + overtime,
        night,
        total: end - start - TIME_RULES.breakMinutes,
        error: '',
    };
};

function AttendanceInput({ username = '', userId = '' }) {
    const [year, setYear] = useState(SOURCE_YEAR);
    const [month, setMonth] = useState(SOURCE_MONTH);
    const [employee, setEmployee] = useState({
        employeeId: userId,
        name: username,
        department: '',
    });
    const [entries, setEntries] = useState(EXCEL_SAMPLE_ENTRIES);
    const [defaultPattern, setDefaultPattern] = useState(() => {
        const saved = JSON.parse(localStorage.getItem('attendanceDefaultPattern') || 'null');
        return { ...DEFAULT_PATTERN, ...(saved || {}) };
    });
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('勤怠入力を保存しました');

    const monthKey = monthKeyOf(year, month);
    const storageKey = `attendanceTimesheet:${monthKey}`;

    useEffect(() => {
        setEmployee(prev => ({
            ...prev,
            employeeId: prev.employeeId || userId,
            name: prev.name || username,
        }));
    }, [userId, username]);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
        if (saved) {
            setEmployee(prev => ({
                ...prev,
                ...(saved.employee || {}),
                employeeId: saved.employee?.employeeId || prev.employeeId,
                name: saved.employee?.name || prev.name,
            }));
            setEntries(saved.entries || {});
            return;
        }

        setEntries(monthKey === SOURCE_MONTH_KEY ? EXCEL_SAMPLE_ENTRIES : {});
    }, [monthKey, storageKey]);

    const rows = useMemo(() => {
        const days = getDaysInMonth(year, month);
        return Array.from({ length: days }, (_, index) => {
            const day = index + 1;
            const date = new Date(year, month - 1, day);
            const dateKey = dateKeyOf(year, month, day);
            const entry = entries[dateKey] || { type: '', clockIn: '', clockOut: '', note: '' };
            const calc = calculateWorkTimes(entry.clockIn, entry.clockOut);

            return {
                dateKey,
                day,
                weekday: WEEKDAYS[date.getDay()],
                isWeekend: date.getDay() === 0 || date.getDay() === 6,
                entry,
                calc,
            };
        });
    }, [entries, month, year]);

    const summary = useMemo(() => {
        const count = (type) => rows.filter(row => row.entry.type === type).length;
        const sum = (field) => rows.reduce((total, row) => total + (row.calc[field] || 0), 0);

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

    const handleEmployeeChange = (field) => (event) => {
        setEmployee(prev => ({ ...prev, [field]: event.target.value }));
    };

    const handleEntryChange = (dateKey, field) => (event) => {
        const value = event.target.value;
        setEntries(prev => ({
            ...prev,
            [dateKey]: {
                ...(prev[dateKey] || { type: '', clockIn: '', clockOut: '', note: '' }),
                [field]: value,
            },
        }));
    };

    const handleDefaultPatternChange = (field) => (event) => {
        const nextPattern = { ...defaultPattern, [field]: event.target.value };
        setDefaultPattern(nextPattern);
        localStorage.setItem('attendanceDefaultPattern', JSON.stringify(nextPattern));
    };

    const handleApplyDefaultPattern = () => {
        let appliedCount = 0;
        const nextEntries = { ...entries };

        rows.forEach(row => {
            if (defaultPattern.target === 'weekdays' && row.isWeekend) return;
            if (!isBlankEntry(nextEntries[row.dateKey])) return;

            nextEntries[row.dateKey] = {
                type: defaultPattern.type,
                clockIn: defaultPattern.clockIn,
                clockOut: defaultPattern.clockOut,
                note: '',
            };
            appliedCount += 1;
        });

        setEntries(nextEntries);
        setSnackbarMessage(`${appliedCount}日分にデフォルト勤務を反映しました`);
        setSnackbarOpen(true);
    };

    const handleSave = () => {
        localStorage.setItem(storageKey, JSON.stringify({ employee, entries }));
        setSnackbarMessage('勤怠入力を保存しました');
        setSnackbarOpen(true);
    };

    const handleClear = () => {
        if (!window.confirm(`${year}年${month}月の勤怠入力をクリアしますか？`)) return;
        setEntries({});
        localStorage.setItem(storageKey, JSON.stringify({ employee, entries: {} }));
    };

    return (
        <Container maxWidth={false} sx={{ py: 0 }}>
            <Stack spacing={3}>
                <Paper sx={{ p: 3 }}>
                    <Stack spacing={2.5}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                    勤怠入力
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    B-35 タイムシート準拠
                                </Typography>
                            </Box>
                            <Button startIcon={<RestartAltIcon />} variant="outlined" color="inherit" onClick={handleClear}>
                                入力クリア
                            </Button>
                            <Button startIcon={<SaveIcon />} variant="contained" onClick={handleSave}>
                                保存
                            </Button>
                        </Box>

                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: {
                                    xs: '1fr',
                                    sm: 'repeat(2, minmax(180px, 1fr))',
                                    lg: '120px 120px repeat(3, minmax(180px, 1fr))',
                                },
                                gap: 2,
                            }}
                        >
                            <TextField
                                label="年"
                                type="number"
                                size="small"
                                value={year}
                                onChange={(event) => setYear(Number(event.target.value))}
                                inputProps={{ min: 2000, max: 2100 }}
                            />
                            <TextField
                                label="月"
                                type="number"
                                size="small"
                                value={month}
                                onChange={(event) => setMonth(Math.min(12, Math.max(1, Number(event.target.value))))}
                                inputProps={{ min: 1, max: 12 }}
                            />
                            <TextField
                                label="社員ID"
                                size="small"
                                value={employee.employeeId}
                                onChange={handleEmployeeChange('employeeId')}
                            />
                            <TextField
                                label="氏名"
                                size="small"
                                value={employee.name}
                                onChange={handleEmployeeChange('name')}
                            />
                            <TextField
                                label="所属"
                                size="small"
                                value={employee.department}
                                onChange={handleEmployeeChange('department')}
                            />
                        </Box>

                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: {
                                    xs: '1fr',
                                    sm: 'repeat(2, minmax(180px, 1fr))',
                                    lg: '140px 160px 140px 140px 200px auto',
                                },
                                gap: 2,
                                alignItems: 'center',
                                border: '1px solid #dce7f2',
                                borderRadius: 1,
                                p: 2,
                                backgroundColor: '#fbfdff',
                            }}
                        >
                            <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1', lg: 'auto' } }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                    一括入力
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    未入力日だけに反映
                                </Typography>
                            </Box>
                            <FormControl size="small" fullWidth>
                                <InputLabel>デフォルト区分</InputLabel>
                                <Select
                                    label="デフォルト区分"
                                    value={defaultPattern.type}
                                    onChange={handleDefaultPatternChange('type')}
                                >
                                    {ATTENDANCE_TYPES.map(type => (
                                        <MenuItem key={type} value={type}>{type}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                label="デフォルト出社"
                                type="time"
                                size="small"
                                value={defaultPattern.clockIn}
                                onChange={handleDefaultPatternChange('clockIn')}
                                inputProps={{ step: 60 }}
                            />
                            <TextField
                                label="デフォルト退社"
                                type="time"
                                size="small"
                                value={defaultPattern.clockOut}
                                onChange={handleDefaultPatternChange('clockOut')}
                                inputProps={{ step: 60 }}
                            />
                            <FormControl size="small" fullWidth>
                                <InputLabel>反映対象</InputLabel>
                                <Select
                                    label="反映対象"
                                    value={defaultPattern.target}
                                    onChange={handleDefaultPatternChange('target')}
                                >
                                    <MenuItem value="weekdays">未入力の平日のみ</MenuItem>
                                    <MenuItem value="all">未入力の全日</MenuItem>
                                </Select>
                            </FormControl>
                            <Button
                                variant="outlined"
                                onClick={handleApplyDefaultPattern}
                                disabled={
                                    !defaultPattern.type
                                    || (defaultPattern.type === '出勤' && (!defaultPattern.clockIn || !defaultPattern.clockOut))
                                }
                                sx={{ minHeight: 40 }}
                            >
                                デフォルト反映
                            </Button>
                        </Box>

                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: {
                                    xs: 'repeat(2, minmax(0, 1fr))',
                                    md: 'repeat(7, minmax(0, 1fr))',
                                },
                                gap: 1,
                            }}
                        >
                            {[
                                ['出勤日数', `${summary.workDays}日`],
                                ['欠勤日数', `${summary.absenceDays}日`],
                                ['有休取得日数', `${summary.paidLeaveDays}日`],
                                ['振替休日取得日数', `${summary.substituteLeaveDays}日`],
                                ['総就業時間', formatDuration(summary.totalWork)],
                                ['早出残業時間', formatDuration(summary.earlyOvertime)],
                                ['早朝深夜勤務時間', formatDuration(summary.night)],
                            ].map(([label, value]) => (
                                <Box
                                    key={label}
                                    sx={{
                                        border: '1px solid #e4e8ee',
                                        borderRadius: 1,
                                        px: 1.5,
                                        py: 1,
                                        backgroundColor: '#f8fafc',
                                    }}
                                >
                                    <Typography variant="caption" color="text.secondary">
                                        {label}
                                    </Typography>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                        {value}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Stack>
                </Paper>

                <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 220px)' }}>
                    <Table stickyHeader size="small" sx={{ minWidth: 1260 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ width: 56 }}>日</TableCell>
                                <TableCell sx={{ width: 56 }}>曜日</TableCell>
                                <TableCell sx={{ width: 128 }}>区分</TableCell>
                                <TableCell sx={{ width: 116 }}>出社</TableCell>
                                <TableCell sx={{ width: 116 }}>退社</TableCell>
                                <TableCell sx={{ width: 88 }}>開始</TableCell>
                                <TableCell sx={{ width: 88 }}>終了</TableCell>
                                <TableCell sx={{ width: 88 }}>基本</TableCell>
                                <TableCell sx={{ width: 104 }}>早出/残業</TableCell>
                                <TableCell sx={{ width: 112 }}>早朝/深夜</TableCell>
                                <TableCell sx={{ width: 88 }}>合計</TableCell>
                                <TableCell>備考</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map(row => (
                                <TableRow
                                    key={row.dateKey}
                                    hover
                                    sx={{
                                        backgroundColor: row.isWeekend ? '#f8fbff' : 'inherit',
                                        '& .calculated-cell': {
                                            backgroundColor: '#eef2f6',
                                            color: '#344054',
                                            fontVariantNumeric: 'tabular-nums',
                                        },
                                    }}
                                >
                                    <TableCell>{row.day}</TableCell>
                                    <TableCell sx={{ color: row.isWeekend ? 'error.main' : 'text.primary' }}>
                                        {row.weekday}
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            size="small"
                                            value={row.entry.type}
                                            displayEmpty
                                            fullWidth
                                            onChange={handleEntryChange(row.dateKey, 'type')}
                                        >
                                            <MenuItem value="">未選択</MenuItem>
                                            {ATTENDANCE_TYPES.map(type => (
                                                <MenuItem key={type} value={type}>{type}</MenuItem>
                                            ))}
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            type="time"
                                            size="small"
                                            value={row.entry.clockIn}
                                            fullWidth
                                            onChange={handleEntryChange(row.dateKey, 'clockIn')}
                                            inputProps={{ step: 60 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            type="time"
                                            size="small"
                                            value={row.entry.clockOut}
                                            fullWidth
                                            error={Boolean(row.calc.error)}
                                            onChange={handleEntryChange(row.dateKey, 'clockOut')}
                                            inputProps={{ step: 60 }}
                                        />
                                    </TableCell>
                                    <TableCell className="calculated-cell">{formatClock(row.calc.start)}</TableCell>
                                    <TableCell className="calculated-cell">{formatClock(row.calc.end)}</TableCell>
                                    <TableCell className="calculated-cell">{formatDuration(row.calc.basic)}</TableCell>
                                    <TableCell className="calculated-cell">{formatDuration(row.calc.earlyOvertime)}</TableCell>
                                    <TableCell className="calculated-cell">{formatDuration(row.calc.night)}</TableCell>
                                    <TableCell className="calculated-cell">{formatDuration(row.calc.total)}</TableCell>
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
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Stack>

            <Snackbar open={snackbarOpen} autoHideDuration={2500} onClose={() => setSnackbarOpen(false)}>
                <Alert severity="success" sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default AttendanceInput;
