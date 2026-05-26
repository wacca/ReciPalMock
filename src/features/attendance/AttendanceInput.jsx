import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert, Box, Button, Chip, Collapse, Divider, FormControl, IconButton, InputLabel, ListItemIcon, ListItemText,
    Menu, MenuItem, Select, Snackbar, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Tooltip, Typography,
} from '@mui/material';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import ViewColumnRoundedIcon from '@mui/icons-material/ViewColumnRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import BeachAccessRoundedIcon from '@mui/icons-material/BeachAccessRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import AdminConfirmDialog from '../../shared/components/AdminConfirmDialog';
import PageScaffold from '../../shared/ui/PageScaffold.jsx';
import Section from '../../shared/ui/Section.jsx';
import StatusChip from '../../shared/ui/StatusChip.jsx';
import IntegrationStatusChip from '../../shared/ui/IntegrationStatusChip.jsx';
import { KeyHint } from '../../shared/ui/KeyHint.jsx';
import {
    emptyAttendance,
    findAttendance,
    getAttendanceIntegrationStatus,
    loadAttendanceTimesheets,
    saveAttendanceTimesheets,
    upsertAttendance,
} from './attendanceStore';
import { getUserProfile } from '../../shared/utils/userDirectory';
import { HISTORY_EVENTS, appendHistory, createHistoryEntry } from '../../shared/utils/applicationHistory';
import { getHolidayName, isHoliday } from '../../shared/utils/holidays';

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
const CLOCK_IN_CHIPS = ['09:00', '09:30', '10:00'];
const CLOCK_OUT_CHIPS = ['18:00', '18:30', '19:00', '20:00'];

const COLUMN_DEFS = [
    { key: 'start', label: '開始', width: 72 },
    { key: 'end', label: '終了', width: 72 },
    { key: 'basic', label: '基本', width: 72 },
    { key: 'earlyOvertime', label: '早出/残業', width: 88 },
    { key: 'night', label: '早朝/深夜', width: 88 },
];
const DEFAULT_VISIBLE_COLUMNS = { start: false, end: false, basic: false, earlyOvertime: true, night: false };
const COLUMNS_STORAGE_KEY = 'attendanceVisibleColumns_v1';

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

const MONTH_STATUS_TONES = {
    approved: { dot: 'var(--accent-leaf)', label: '承認済' },
    pending: { dot: 'var(--accent-iris)', label: '申請中' },
    rejected: { dot: 'var(--accent-rose)', label: '差戻し' },
    cancelled: { dot: 'var(--accent-slate)', label: '取消' },
    draft: { dot: 'var(--accent-amber)', label: '下書き' },
    empty: { dot: 'var(--ink-tertiary)', label: '未作成' },
};
const getMonthStatusTone = (s) => {
    if (!s.approvalStatus) return MONTH_STATUS_TONES.empty;
    const key = toApprovalStatusKey(s.approvalStatus);
    if (key === 'draft' && !s.hasData) return MONTH_STATUS_TONES.empty;
    return MONTH_STATUS_TONES[key] || MONTH_STATUS_TONES.empty;
};

const loadVisibleColumns = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(COLUMNS_STORAGE_KEY) || 'null');
        if (saved && typeof saved === 'object') return { ...DEFAULT_VISIBLE_COLUMNS, ...saved };
    } catch { /* noop */ }
    return DEFAULT_VISIBLE_COLUMNS;
};

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
    const [bulkOpen, setBulkOpen] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState(loadVisibleColumns);
    const [columnsAnchor, setColumnsAnchor] = useState(null);
    const [overflowAnchor, setOverflowAnchor] = useState(null);
    const [rowMenu, setRowMenu] = useState({ anchor: null, dateKey: null });
    const [flashCells, setFlashCells] = useState({});
    const [autoSavedAt, setAutoSavedAt] = useState(null);
    const [allTimesheets, setAllTimesheets] = useState(() => loadAttendanceTimesheets());
    const [focusedNoteKey, setFocusedNoteKey] = useState(null);

    const rowRefs = useRef({});
    const todayKey = useMemo(() => dateKeyOf(today.getFullYear(), today.getMonth() + 1, today.getDate()), []);
    const previousTotals = useRef({});

    const currentSnapshot = useMemo(() => buildSnapshot(record.entries), [record.entries]);
    const hasUnsavedChanges = currentSnapshot !== lastSavedSnapshot;
    const isEditable = record.approvalStatus === '下書き' || record.approvalStatus === '差戻し';
    const isLocked = !isEditable;

    useEffect(() => {
        const all = loadAttendanceTimesheets();
        setAllTimesheets(all);
        const found = findAttendance(all, profile.id, year, month);
        const next = found || emptyAttendance(profile.id, year, month);
        setRecord(next);
        setLastSavedSnapshot(buildSnapshot(next.entries));
        previousTotals.current = {};
        setAutoSavedAt(null);
    }, [profile.id, year, month]);

    // 保存・申請・クリア後に全体を再読込（12ヶ月帯の更新用）
    useEffect(() => {
        setAllTimesheets(loadAttendanceTimesheets());
    }, [lastSavedSnapshot, record.approvalStatus]);

    const monthlyStatuses = useMemo(() => (
        Array.from({ length: 12 }, (_, idx) => {
            const m = idx + 1;
            const r = findAttendance(allTimesheets, profile.id, year, m);
            const hasData = r ? Object.values(r.entries || {}).some((e) => e && (e.type || e.clockIn || e.clockOut || e.note)) : false;
            return {
                month: m,
                approvalStatus: r ? r.approvalStatus : null,
                hasData,
                closed: r ? r.closingStatus === 'closed' : false,
                isFuture: year === today.getFullYear() ? m > today.getMonth() + 1 : year > today.getFullYear(),
            };
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [allTimesheets, profile.id, year]);

    useEffect(() => {
        localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(visibleColumns));
    }, [visibleColumns]);

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
            const w = date.getDay();
            const holiday = getHolidayName(dateKey);
            return {
                dateKey, day,
                weekday: WEEKDAYS[w],
                isSaturday: w === 6,
                isSunday: w === 0,
                isWeekend: w === 0 || w === 6,
                holidayName: holiday,
                isHoliday: Boolean(holiday),
                isToday: dateKey === todayKey,
                entry, calc,
            };
        });
    }, [record.entries, month, year, todayKey]);

    // 合計変化で短時間フラッシュ
    useEffect(() => {
        const next = {};
        let changed = false;
        rows.forEach((r) => {
            const prev = previousTotals.current[r.dateKey];
            if (prev !== undefined && prev !== r.calc.total && r.calc.total !== null) {
                next[r.dateKey] = Date.now();
                changed = true;
            }
            previousTotals.current[r.dateKey] = r.calc.total;
        });
        if (changed) {
            setFlashCells((p) => ({ ...p, ...next }));
            const t = setTimeout(() => {
                setFlashCells((p) => {
                    const cp = { ...p };
                    Object.keys(next).forEach((k) => { if (cp[k] === next[k]) delete cp[k]; });
                    return cp;
                });
            }, 600);
            return () => clearTimeout(t);
        }
    }, [rows]);

    const summary = useMemo(() => {
        const count = (t) => rows.filter((r) => r.entry.type === t).length;
        const sum = (f) => rows.reduce((acc, r) => acc + (r.calc[f] || 0), 0);
        const expected = rows.filter((r) => !r.isWeekend && !r.isHoliday).length * (8 * 60);
        const totalWork = sum('total');
        return {
            workDays: count('出勤'),
            absenceDays: count('欠勤'),
            paidLeaveDays: count('有給'),
            substituteLeaveDays: count('振替休日'),
            totalWork,
            earlyOvertime: sum('earlyOvertime'),
            night: sum('night'),
            expected,
            diff: totalWork - expected,
        };
    }, [rows]);

    const validationErrors = useMemo(() =>
        rows.flatMap((r) => {
            if (r.entry.type !== '出勤') return [];
            if (!r.entry.clockIn || !r.entry.clockOut) return [{ day: r.day, dateKey: r.dateKey, message: '出勤は出社と退社を入力してください' }];
            if (r.calc.error) return [{ day: r.day, dateKey: r.dateKey, message: r.calc.error }];
            return [];
        }),
    [rows]);

    const hasBlocking = validationErrors.length > 0;
    const hasAnyEntries = Object.values(record.entries).some((e) => !isBlankEntry(e));

    const handleEntryChange = (dateKey, field) => (e) => {
        if (isLocked) return;
        const value = e?.target ? e.target.value : e;
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
        const ny = ((next.month - 1 + 12) % 12 === 11 && next.month === 0) ? next.year - 1 : next.year;
        const normalized = (() => {
            let y = next.year;
            let m = next.month;
            if (m < 1) { m = 12; y -= 1; }
            if (m > 12) { m = 1; y += 1; }
            return { year: y, month: m };
        })();
        if (hasUnsavedChanges) {
            setPendingPeriodChange(normalized);
            setPeriodChangeConfirmOpen(true);
            return;
        }
        setYear(normalized.year);
        setMonth(normalized.month);
    };
    const handlePeriodChangeConfirm = () => {
        if (pendingPeriodChange) { setYear(pendingPeriodChange.year); setMonth(pendingPeriodChange.month); }
        setPendingPeriodChange(null);
        setPeriodChangeConfirmOpen(false);
    };
    const goPrevMonth = () => requestPeriodChange({ year, month: month - 1 });
    const goNextMonth = () => requestPeriodChange({ year, month: month + 1 });
    const goThisMonth = () => requestPeriodChange({ year: today.getFullYear(), month: today.getMonth() + 1 });

    const applyDefaultPattern = useCallback(() => {
        if (isLocked) return 0;
        let applied = 0;
        const next = { ...record.entries };
        rows.forEach((r) => {
            const shouldSkip = defaultPattern.target === 'weekdays' && (r.isWeekend || r.isHoliday);
            if (shouldSkip) return;
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
        return applied;
    }, [isLocked, record.entries, rows, defaultPattern]);

    const handleApplyDefaultPattern = () => {
        const applied = applyDefaultPattern();
        setSnackbar({ open: true, message: `${applied}日分にデフォルト勤務を反映しました`, severity: 'success' });
    };

    const persist = useCallback((updated) => {
        const all = loadAttendanceTimesheets();
        const next = upsertAttendance(all, updated);
        saveAttendanceTimesheets(next);
    }, []);

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
        const userProfile = getUserProfile(record.userId);
        const submitEvent = createHistoryEntry({
            eventType: HISTORY_EVENTS.SUBMIT,
            actorLabel: `${userProfile.name}(${userProfile.id})`,
            actorRole: userProfile.role,
            fromStatus: record.approvalStatus || '下書き',
            toStatus: '申請中',
        });
        const updated = {
            ...record,
            approvalStatus: '申請中',
            submittedAt: new Date().toISOString(),
            remarks: '',
            approvedBy: '',
            approvedAt: '',
            history: appendHistory(record.history, submitEvent),
        };
        persist(updated);
        setRecord(updated);
        setLastSavedSnapshot(buildSnapshot(updated.entries));
        setSubmitConfirmOpen(false);
        setSnackbar({ open: true, message: `${year}年${month}月の勤怠を申請しました`, severity: 'success' });
    };

    const handleClearConfirm = () => {
        if (isLocked) { setClearConfirmOpen(false); return; }
        const updated = { ...record, entries: {} };
        persist(updated);
        setRecord(updated);
        setLastSavedSnapshot(buildSnapshot({}));
        setClearConfirmOpen(false);
        setSnackbar({ open: true, message: '勤怠入力をクリアしました', severity: 'success' });
    };

    // Ctrl+S 保存
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

    // オートセーブ（2秒デバウンス・下書き時のみ・ブロッキングエラーなし）
    useEffect(() => {
        if (isLocked) return undefined;
        if (!hasUnsavedChanges) return undefined;
        if (hasBlocking) return undefined;
        if (record.approvalStatus !== '下書き' && record.approvalStatus !== '差戻し') return undefined;
        const t = setTimeout(() => {
            const updated = { ...record, approvalStatus: record.approvalStatus === '差戻し' ? '下書き' : record.approvalStatus };
            persist(updated);
            setRecord(updated);
            setLastSavedSnapshot(buildSnapshot(updated.entries));
            setAutoSavedAt(new Date());
        }, 2000);
        return () => clearTimeout(t);
    }, [currentSnapshot, hasUnsavedChanges, hasBlocking, isLocked, record, persist]);

    // beforeunload 警告
    useEffect(() => {
        const handler = (e) => {
            if (hasUnsavedChanges && !isLocked) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [hasUnsavedChanges, isLocked]);

    // 初回マウントで今日にスクロール
    useEffect(() => {
        const el = rowRefs.current[todayKey];
        if (el && typeof el.scrollIntoView === 'function') {
            requestAnimationFrame(() => el.scrollIntoView({ block: 'center', behavior: 'auto' }));
        }
    }, [todayKey, year, month]);

    const approvalKey = toApprovalStatusKey(record.approvalStatus);
    const integrationStatus = getAttendanceIntegrationStatus(record);

    const jumpToError = (dateKey) => {
        const el = rowRefs.current[dateKey];
        if (el && typeof el.scrollIntoView === 'function') {
            el.scrollIntoView({ block: 'center', behavior: 'smooth' });
            const input = el.querySelector('input[type=time]:not([disabled])');
            if (input) setTimeout(() => input.focus(), 250);
        }
    };

    const setRowEntry = (dateKey, partial) => {
        if (isLocked) return;
        updateEntries((p) => ({
            ...p,
            [dateKey]: { ...(p[dateKey] || { type: '', clockIn: '', clockOut: '', note: '' }), ...partial },
        }));
    };

    const handleCopyPrev = (dateKey) => {
        const idx = rows.findIndex((r) => r.dateKey === dateKey);
        if (idx <= 0) return;
        const prev = rows[idx - 1].entry;
        setRowEntry(dateKey, { type: prev.type || '', clockIn: prev.clockIn || '', clockOut: prev.clockOut || '', note: '' });
    };

    const monthLabel = `${year}年${month}月`;

    const totalColumns = 5 + Object.values(visibleColumns).filter(Boolean).length + 2; // 日/曜/区分/出社/退社 + 詳細 + 合計/備考
    const tableMinWidth = 640 + Object.values(visibleColumns).filter(Boolean).length * 90;

    return (
        <PageScaffold
            eyebrow="勤怠"
            title="月次タイムシート"
            subtitle={`${profile.name}（${profile.department}）の月次勤怠です。${isLocked ? '承認状態のため編集はロックされています。' : '入力後に上長へ申請してください。'}`}
            actions={(
                <>
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
                    <IconButton
                        size="small"
                        onClick={(e) => setOverflowAnchor(e.currentTarget)}
                        sx={{ color: 'var(--ink-tertiary)' }}
                        aria-label="その他のアクション"
                    >
                        <MoreVertRoundedIcon />
                    </IconButton>
                    <Menu
                        anchorEl={overflowAnchor}
                        open={Boolean(overflowAnchor)}
                        onClose={() => setOverflowAnchor(null)}
                    >
                        <MenuItem
                            disabled={isLocked}
                            onClick={() => { setOverflowAnchor(null); setClearConfirmOpen(true); }}
                        >
                            <ListItemIcon><RestartAltRoundedIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="入力をクリア" secondary="この月の全行を破棄" />
                        </MenuItem>
                    </Menu>
                </>
            )}
        >
            {/* 状態バー */}
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
                    {autoSavedAt && !hasUnsavedChanges && (
                        <Typography variant="caption" sx={{ color: 'var(--accent-leaf)', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                            <CheckRoundedIcon sx={{ fontSize: 14 }} />
                            自動保存 {autoSavedAt.toLocaleTimeString()}
                        </Typography>
                    )}
                    {hasUnsavedChanges && !isLocked && (
                        <Typography variant="caption" sx={{ color: 'var(--accent-amber)' }}>
                            未保存の変更があります
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

            {/* エラーバナー */}
            {hasBlocking && !isLocked && (
                <Alert
                    severity="warning"
                    sx={{ borderRadius: 'var(--radius-md)' }}
                    action={(
                        <Button
                            color="inherit"
                            size="small"
                            onClick={() => jumpToError(validationErrors[0].dateKey)}
                        >
                            {validationErrors[0].day}日へ
                        </Button>
                    )}
                >
                    入力エラー {validationErrors.length} 件: {validationErrors[0].day}日 {validationErrors[0].message}
                    {validationErrors.length > 1 && ` 他 ${validationErrors.length - 1} 件`}
                </Alert>
            )}

            {/* 期間ペジネーター + 一括入力 */}
            <Section padded>
                <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} justifyContent="space-between">
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <IconButton onClick={goPrevMonth} size="small" aria-label="前月">
                                <ChevronLeftRoundedIcon />
                            </IconButton>
                            <Typography
                                sx={{
                                    fontSize: 20,
                                    fontWeight: 800,
                                    color: 'var(--ink-primary)',
                                    minWidth: 140,
                                    textAlign: 'center',
                                    fontVariantNumeric: 'tabular-nums',
                                }}
                            >
                                {monthLabel}
                            </Typography>
                            <IconButton onClick={goNextMonth} size="small" aria-label="翌月">
                                <ChevronRightRoundedIcon />
                            </IconButton>
                            <Button
                                size="small"
                                startIcon={<TodayRoundedIcon />}
                                onClick={goThisMonth}
                                sx={{ ml: 1, color: 'var(--ink-secondary)' }}
                            >
                                今月へ
                            </Button>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Button
                                size="small"
                                variant="text"
                                startIcon={<TuneRoundedIcon />}
                                endIcon={<ExpandMoreRoundedIcon sx={{ transform: bulkOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />}
                                onClick={() => setBulkOpen((v) => !v)}
                                disabled={isLocked}
                            >
                                一括入力
                            </Button>
                            <Button
                                size="small"
                                variant="text"
                                startIcon={<ViewColumnRoundedIcon />}
                                onClick={(e) => setColumnsAnchor(e.currentTarget)}
                            >
                                列表示
                            </Button>
                            <Menu
                                anchorEl={columnsAnchor}
                                open={Boolean(columnsAnchor)}
                                onClose={() => setColumnsAnchor(null)}
                            >
                                {COLUMN_DEFS.map((c) => (
                                    <MenuItem
                                        key={c.key}
                                        onClick={() => setVisibleColumns((v) => ({ ...v, [c.key]: !v[c.key] }))}
                                    >
                                        <ListItemIcon>
                                            {visibleColumns[c.key] ? <CheckRoundedIcon fontSize="small" /> : <Box sx={{ width: 20 }} />}
                                        </ListItemIcon>
                                        <ListItemText primary={c.label} />
                                    </MenuItem>
                                ))}
                            </Menu>
                        </Stack>
                    </Stack>

                    {/* 年内12ヶ月ステータス帯 */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: 'repeat(6, minmax(0, 1fr))', sm: 'repeat(12, minmax(0, 1fr))' },
                            gap: 0.75,
                            padding: 1,
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--surface-sunken)',
                        }}
                        role="group"
                        aria-label={`${year}年の月別ステータス`}
                    >
                        {monthlyStatuses.map((s) => {
                            const isActive = s.month === month;
                            const tone = getMonthStatusTone(s);
                            const isCurrent = year === today.getFullYear() && s.month === today.getMonth() + 1;
                            return (
                                <Tooltip
                                    key={s.month}
                                    title={`${s.month}月 ${tone.label}${s.closed ? '（締め済）' : ''}`}
                                    arrow
                                >
                                    <Box
                                        component="button"
                                        type="button"
                                        onClick={() => requestPeriodChange({ year, month: s.month })}
                                        sx={{
                                            cursor: 'pointer',
                                            border: 'none',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            paddingBlock: 0.75,
                                            paddingInline: 0.5,
                                            borderRadius: 'var(--radius-md)',
                                            background: isActive ? 'var(--accent-primary-soft)' : 'transparent',
                                            outline: isCurrent ? '1px dashed var(--accent-primary)' : 'none',
                                            outlineOffset: -2,
                                            transition: 'background .15s ease',
                                            '&:hover': { background: isActive ? 'var(--accent-primary-soft)' : 'var(--surface-raised)' },
                                            fontFamily: 'inherit',
                                            opacity: s.isFuture && !s.approvalStatus ? 0.55 : 1,
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontSize: 12,
                                                fontWeight: isActive ? 800 : 600,
                                                color: isActive ? 'var(--accent-primary)' : 'var(--ink-secondary)',
                                                lineHeight: 1,
                                                fontVariantNumeric: 'tabular-nums',
                                            }}
                                        >
                                            {s.month}月
                                        </Typography>
                                        <Box
                                            aria-hidden
                                            sx={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                background: tone.dot,
                                                opacity: s.approvalStatus ? 1 : 0.4,
                                                boxShadow: s.closed ? `0 0 0 2px var(--surface-sunken), 0 0 0 3px ${tone.dot}` : 'none',
                                            }}
                                        />
                                    </Box>
                                </Tooltip>
                            );
                        })}
                    </Box>

                    {/* 一括入力（折り畳み） */}
                    <Collapse in={bulkOpen || (!hasAnyEntries && !isLocked)}>
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'minmax(160px, 200px) 1fr 1fr 1fr 1fr auto' },
                                gap: 1.5,
                                alignItems: 'center',
                                padding: 1.75,
                                background: 'var(--accent-iris-soft)',
                                borderRadius: 'var(--radius-md)',
                                opacity: isLocked ? 0.5 : 1,
                                pointerEvents: isLocked ? 'none' : 'auto',
                            }}
                        >
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'var(--accent-iris)', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                    <AutoFixHighRoundedIcon sx={{ fontSize: 18 }} />
                                    一括入力
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                                    {!hasAnyEntries ? '初期化におすすめ。未入力日にだけ反映。' : '未入力日にだけ反映'}
                                </Typography>
                            </Box>
                            <FormControl size="small" fullWidth>
                                <InputLabel>区分</InputLabel>
                                <Select label="区分" value={defaultPattern.type} onChange={handleDefaultPatternChange('type')}>
                                    {ATTENDANCE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <TextField label="出社" type="time" size="small" value={defaultPattern.clockIn}
                                disabled={defaultPattern.type !== '出勤'} onChange={handleDefaultPatternChange('clockIn')} inputProps={{ step: 60 }} />
                            <TextField label="退社" type="time" size="small" value={defaultPattern.clockOut}
                                disabled={defaultPattern.type !== '出勤'} onChange={handleDefaultPatternChange('clockOut')} inputProps={{ step: 60 }} />
                            <FormControl size="small" fullWidth>
                                <InputLabel>対象</InputLabel>
                                <Select label="対象" value={defaultPattern.target} onChange={handleDefaultPatternChange('target')}>
                                    <MenuItem value="weekdays">平日のみ（祝日除く）</MenuItem>
                                    <MenuItem value="all">全日</MenuItem>
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
                    </Collapse>

                    {/* サマリーカード */}
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

            {/* テーブル（中〜大画面）。小画面ではカード表示にフォールバック */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <TableContainer
                    sx={{
                        maxHeight: 'calc(100vh - 320px)',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--surface-raised)',
                        boxShadow: 'var(--shadow-1)',
                    }}
                >
                    <Table stickyHeader size="small" sx={{ minWidth: tableMinWidth }}>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ width: 56 }}>日</TableCell>
                                <TableCell sx={{ width: 72 }}>曜</TableCell>
                                <TableCell sx={{ width: 128 }}>区分</TableCell>
                                <TableCell sx={{ width: 116 }}>出社</TableCell>
                                <TableCell sx={{ width: 116 }}>退社</TableCell>
                                {COLUMN_DEFS.filter((c) => visibleColumns[c.key]).map((c) => (
                                    <TableCell key={c.key} sx={{ width: c.width }} align="right">{c.label}</TableCell>
                                ))}
                                <TableCell sx={{ width: 80 }} align="right">合計</TableCell>
                                <TableCell>備考</TableCell>
                                <TableCell sx={{ width: 40 }} />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((row) => {
                                const dayBg = row.isToday
                                    ? 'var(--accent-primary-soft)'
                                    : row.isHoliday || row.isSunday
                                        ? 'var(--accent-rose-soft)'
                                        : row.isSaturday
                                            ? 'var(--accent-iris-soft)'
                                            : 'inherit';
                                const weekdayColor = row.isHoliday || row.isSunday
                                    ? 'var(--accent-rose)'
                                    : row.isSaturday
                                        ? 'var(--accent-iris)'
                                        : 'var(--ink-primary)';
                                const isFlashing = Boolean(flashCells[row.dateKey]);
                                return (
                                    <TableRow
                                        key={row.dateKey}
                                        ref={(el) => { if (el) rowRefs.current[row.dateKey] = el; }}
                                        hover
                                        sx={{
                                            position: 'relative',
                                            background: dayBg,
                                            '& .calc-cell': {
                                                background: 'var(--surface-sunken)',
                                                color: 'var(--ink-tertiary)',
                                                fontVariantNumeric: 'tabular-nums',
                                                fontWeight: 500,
                                            },
                                            '& > td:first-of-type': {
                                                boxShadow: row.isToday
                                                    ? 'inset 3px 0 0 var(--accent-primary)'
                                                    : row.isHoliday || row.isSunday
                                                        ? 'inset 2px 0 0 var(--accent-rose)'
                                                        : row.isSaturday
                                                            ? 'inset 2px 0 0 var(--accent-iris)'
                                                            : 'none',
                                            },
                                        }}
                                    >
                                        <TableCell sx={{ fontWeight: row.isToday ? 800 : 600 }}>
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <span>{row.day}</span>
                                                {row.isToday && (
                                                    <Chip
                                                        label="今日"
                                                        size="small"
                                                        sx={{
                                                            height: 16, fontSize: 10, fontWeight: 700,
                                                            background: 'var(--accent-primary)', color: '#fff',
                                                            '& .MuiChip-label': { px: 0.75 },
                                                        }}
                                                    />
                                                )}
                                            </Stack>
                                        </TableCell>
                                        <TableCell sx={{ color: weekdayColor, fontWeight: row.isWeekend || row.isHoliday ? 700 : 500 }}>
                                            <Stack direction="column" spacing={0}>
                                                <span>{row.weekday}</span>
                                                {row.holidayName && (
                                                    <Tooltip title={row.holidayName}>
                                                        <Typography sx={{ fontSize: 10, color: 'var(--accent-rose)', lineHeight: 1, mt: 0.25, maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {row.holidayName}
                                                        </Typography>
                                                    </Tooltip>
                                                )}
                                            </Stack>
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
                                        {visibleColumns.start && (
                                            <TableCell className="calc-cell" align="right">{formatClock(row.calc.start)}</TableCell>
                                        )}
                                        {visibleColumns.end && (
                                            <TableCell className="calc-cell" align="right">{formatClock(row.calc.end)}</TableCell>
                                        )}
                                        {visibleColumns.basic && (
                                            <TableCell className="calc-cell" align="right">{formatDuration(row.calc.basic)}</TableCell>
                                        )}
                                        {visibleColumns.earlyOvertime && (
                                            <TableCell className="calc-cell" align="right">{formatDuration(row.calc.earlyOvertime)}</TableCell>
                                        )}
                                        {visibleColumns.night && (
                                            <TableCell className="calc-cell" align="right">{formatDuration(row.calc.night)}</TableCell>
                                        )}
                                        <TableCell
                                            className="calc-cell"
                                            align="right"
                                            sx={{
                                                fontWeight: '700 !important',
                                                color: 'var(--ink-primary) !important',
                                                transition: 'background .35s ease',
                                                background: isFlashing ? 'var(--accent-primary-soft) !important' : undefined,
                                            }}
                                        >
                                            {formatDuration(row.calc.total)}
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                value={row.entry.note}
                                                fullWidth
                                                multiline
                                                minRows={1}
                                                maxRows={focusedNoteKey === row.dateKey ? 3 : 1}
                                                onFocus={() => setFocusedNoteKey(row.dateKey)}
                                                onBlur={() => setFocusedNoteKey((k) => (k === row.dateKey ? null : k))}
                                                disabled={isLocked}
                                                onChange={handleEntryChange(row.dateKey, 'note')}
                                                {...(row.calc.error ? { helperText: row.calc.error, error: true } : {})}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                disabled={isLocked}
                                                onClick={(e) => setRowMenu({ anchor: e.currentTarget, dateKey: row.dateKey })}
                                                aria-label={`${row.day}日の行アクション`}
                                            >
                                                <MoreVertRoundedIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* モバイル/タブレット向けカード表示 */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <Stack spacing={1}>
                    {rows.map((row) => {
                        const accent = row.isToday
                            ? 'var(--accent-primary)'
                            : row.isHoliday || row.isSunday
                                ? 'var(--accent-rose)'
                                : row.isSaturday
                                    ? 'var(--accent-iris)'
                                    : 'transparent';
                        return (
                            <Box
                                key={row.dateKey}
                                ref={(el) => { if (el) rowRefs.current[row.dateKey] = el; }}
                                sx={{
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--surface-raised)',
                                    boxShadow: 'var(--shadow-1)',
                                    borderLeft: `4px solid ${accent}`,
                                    padding: 1.5,
                                }}
                            >
                                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                                    <Stack direction="row" alignItems="baseline" spacing={1}>
                                        <Typography sx={{ fontSize: 18, fontWeight: 800, color: 'var(--ink-primary)' }}>
                                            {row.day}
                                        </Typography>
                                        <Typography sx={{ fontSize: 13, color: row.isHoliday || row.isSunday ? 'var(--accent-rose)' : row.isSaturday ? 'var(--accent-iris)' : 'var(--ink-tertiary)' }}>
                                            ({row.weekday}){row.holidayName ? ` ${row.holidayName}` : ''}
                                        </Typography>
                                        {row.isToday && (
                                            <Chip label="今日" size="small" sx={{ height: 18, background: 'var(--accent-primary)', color: '#fff', fontWeight: 700 }} />
                                        )}
                                    </Stack>
                                    <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: 'var(--ink-primary)' }}>
                                        {formatDuration(row.calc.total)}
                                    </Typography>
                                </Stack>
                                <Stack direction="row" spacing={1}>
                                    <FormControl size="small" sx={{ flex: 1 }}>
                                        <Select value={row.entry.type} displayEmpty disabled={isLocked} onChange={handleEntryChange(row.dateKey, 'type')}>
                                            <MenuItem value=""><span style={{ color: 'var(--ink-tertiary)' }}>未選択</span></MenuItem>
                                            {ATTENDANCE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                    <TextField type="time" size="small" value={row.entry.clockIn} disabled={isLocked || row.entry.type !== '出勤'} onChange={handleEntryChange(row.dateKey, 'clockIn')} sx={{ flex: 1 }} inputProps={{ step: 60 }} />
                                    <TextField type="time" size="small" value={row.entry.clockOut} disabled={isLocked || row.entry.type !== '出勤'} onChange={handleEntryChange(row.dateKey, 'clockOut')} sx={{ flex: 1 }} inputProps={{ step: 60 }} error={Boolean(row.calc.error)} />
                                </Stack>
                                {row.entry.type === '出勤' && !isLocked && (
                                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 1, rowGap: 0.5 }}>
                                        {CLOCK_IN_CHIPS.map((t) => (
                                            <Chip key={`in-${t}`} label={`出 ${t}`} size="small" variant="outlined" onClick={() => setRowEntry(row.dateKey, { clockIn: t })} />
                                        ))}
                                        {CLOCK_OUT_CHIPS.map((t) => (
                                            <Chip key={`out-${t}`} label={`退 ${t}`} size="small" variant="outlined" onClick={() => setRowEntry(row.dateKey, { clockOut: t })} />
                                        ))}
                                    </Stack>
                                )}
                                {row.calc.error && (
                                    <Typography variant="caption" sx={{ color: 'var(--accent-amber)', display: 'block', mt: 0.5 }}>
                                        {row.calc.error}
                                    </Typography>
                                )}
                            </Box>
                        );
                    })}
                </Stack>
            </Box>

            {/* 行アクションメニュー */}
            <Menu
                anchorEl={rowMenu.anchor}
                open={Boolean(rowMenu.anchor)}
                onClose={() => setRowMenu({ anchor: null, dateKey: null })}
            >
                <MenuItem onClick={() => { handleCopyPrev(rowMenu.dateKey); setRowMenu({ anchor: null, dateKey: null }); }}>
                    <ListItemIcon><ContentCopyRoundedIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="前日をコピー" />
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { setRowEntry(rowMenu.dateKey, { type: '有給', clockIn: '', clockOut: '' }); setRowMenu({ anchor: null, dateKey: null }); }}>
                    <ListItemIcon><BeachAccessRoundedIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="有給休暇に変更" />
                </MenuItem>
                <MenuItem onClick={() => { setRowEntry(rowMenu.dateKey, { type: '欠勤', clockIn: '', clockOut: '' }); setRowMenu({ anchor: null, dateKey: null }); }}>
                    <ListItemIcon><EventBusyRoundedIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="欠勤に変更" />
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { setRowEntry(rowMenu.dateKey, { type: '', clockIn: '', clockOut: '', note: '' }); setRowMenu({ anchor: null, dateKey: null }); }}>
                    <ListItemIcon><ClearRoundedIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="この日をクリア" />
                </MenuItem>
            </Menu>

            {/* sticky サマリーバー */}
            <Box
                sx={{
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 5,
                    marginInline: { xs: -1, md: 0 },
                    paddingInline: { xs: 1.5, md: 2 },
                    paddingBlock: 1,
                    background: 'var(--surface-raised)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-2)',
                    backdropFilter: 'blur(6px)',
                }}
            >
                <Stack direction="row" spacing={{ xs: 2, md: 4 }} alignItems="center" justifyContent="space-between" flexWrap="wrap" rowGap={1}>
                    <Stack direction="row" spacing={{ xs: 2, md: 3 }} alignItems="baseline" flexWrap="wrap" rowGap={1}>
                        <Stack>
                            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>総就業</Typography>
                            <Typography sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', fontSize: 18 }}>{formatDuration(summary.totalWork)}</Typography>
                        </Stack>
                        <Stack>
                            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>所定</Typography>
                            <Typography sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--ink-secondary)' }}>{formatDuration(summary.expected)}</Typography>
                        </Stack>
                        <Stack>
                            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>差分</Typography>
                            <Typography sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: summary.diff >= 0 ? 'var(--accent-leaf)' : 'var(--accent-rose)' }}>
                                {summary.diff >= 0 ? '+' : ''}{formatDuration(summary.diff)}
                            </Typography>
                        </Stack>
                        <Stack sx={{ display: { xs: 'none', sm: 'flex' } }}>
                            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>残業</Typography>
                            <Typography sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--accent-amber)' }}>{formatDuration(summary.earlyOvertime)}</Typography>
                        </Stack>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                        {hasBlocking && !isLocked && (
                            <Chip
                                size="small"
                                color="warning"
                                label={`エラー ${validationErrors.length}`}
                                onClick={() => jumpToError(validationErrors[0].dateKey)}
                                clickable
                            />
                        )}
                        {hasUnsavedChanges && !isLocked && (
                            <Chip size="small" label="未保存" sx={{ background: 'var(--accent-amber-soft)', color: 'var(--accent-amber)', fontWeight: 700 }} />
                        )}
                    </Stack>
                </Stack>
            </Box>

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
