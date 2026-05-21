import { useState, useEffect } from 'react';
import {
    Box, TextField, Button, MenuItem, FormControl, InputLabel, Select, Snackbar, Alert, IconButton, Tooltip, Stack, Typography,
    FormControlLabel, Switch, Chip,
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import {
    ALWAYS_HOURLY_TYPES,
    BUSINESS_END,
    BUSINESS_START,
    LEAVE_TYPES,
    RANGEABLE_LEAVE_TYPES,
    buildLeaveApplications,
    emptyLeaveRow,
    formatLeavePeriod,
    getLeaveDayCount,
    getLeaveHours,
    loadLeaveApplications,
    loadLeaveDrafts,
    normalizeLeaveRow,
    saveLeaveApplications,
    saveLeaveDrafts,
} from './leaveApplicationStore';
import AdminConfirmDialog from '../../shared/components/AdminConfirmDialog';
import PageScaffold from '../../shared/ui/PageScaffold.jsx';
import Section from '../../shared/ui/Section.jsx';
import StatusChip from '../../shared/ui/StatusChip.jsx';
import { KeyHint } from '../../shared/ui/KeyHint.jsx';

const hasLeaveRowInput = (row = {}) =>
    row.leaveType !== emptyLeaveRow().leaveType ||
    ['dateFrom', 'dateTo', 'reason'].some((field) => String(row[field] ?? '').trim() !== '') ||
    Number(row.hours) > 0;

const isRangeable = (leaveType) => RANGEABLE_LEAVE_TYPES.includes(leaveType);
const isAlwaysHourly = (leaveType) => ALWAYS_HOURLY_TYPES.includes(leaveType);

function LeaveApplication({ userId }) {
    const location = useLocation();
    const [leaveList, setLeaveList] = useState([]);
    const [mode, setMode] = useState('list');
    const [editId, setEditId] = useState('new');
    const [leaveRows, setLeaveRows] = useState([emptyLeaveRow()]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [deleteRowTargetIndex, setDeleteRowTargetIndex] = useState(null);

    useEffect(() => {
        loadLeaveApplications();
        setLeaveList(loadLeaveDrafts());
    }, []);

    useEffect(() => {
        if (!location.state?.startNew) return;
        setEditId('new');
        setLeaveRows([emptyLeaveRow()]);
        setMode('edit');
    }, [location.state]);

    const resetForm = () => { setEditId('new'); setLeaveRows([emptyLeaveRow()]); };

    const handleEdit = (id) => {
        const draft = leaveList.find((d) => d.id === id);
        if (draft) {
            setEditId(id);
            setLeaveRows(draft.details?.length ? draft.details : [emptyLeaveRow()]);
            setMode('edit');
        }
    };

    const handleDeleteConfirm = () => {
        if (!deleteTargetId) return;
        const next = leaveList.filter((d) => d.id !== deleteTargetId);
        setLeaveList(next);
        saveLeaveDrafts(next);
        setDeleteTargetId(null);
        setSnackbar({ open: true, message: '下書きを削除しました' });
    };

    const handleRowChange = (i, field, value) => {
        const next = [...leaveRows];
        const updated = { ...next[i], [field]: value };
        // dateFrom を入れたとき、dateTo が空 or dateFrom より前なら同期する
        if (field === 'dateFrom') {
            if (!updated.dateTo || updated.dateTo < value) {
                updated.dateTo = value;
            }
        }
        if (field === 'leaveType') {
            // 遅刻・早退は常に時間指定。dateTo を dateFrom に揃え、デフォルト時間数を設定
            if (isAlwaysHourly(value)) {
                updated.isHourly = true;
                updated.dateTo = updated.dateFrom;
                if (!Number(updated.hours)) updated.hours = 1;
            } else if (!isRangeable(value)) {
                updated.dateTo = updated.dateFrom;
            }
        }
        if (field === 'isHourly') {
            // 時間指定 ON で単日固定、時間数のデフォルトを当てる
            if (value) {
                updated.dateTo = updated.dateFrom;
                if (!Number(updated.hours)) updated.hours = 1;
            } else {
                updated.hours = 0;
            }
        }
        if (field === 'hours') {
            const n = Number(value);
            updated.hours = Number.isFinite(n) && n >= 0 ? n : 0;
        }
        // 時間指定中に dateFrom が変わったら dateTo も同期
        if (field === 'dateFrom' && updated.isHourly) {
            updated.dateTo = value;
        }
        next[i] = updated;
        setLeaveRows(next);
    };

    const deleteRowAt = (i) => {
        const next = leaveRows.filter((_, x) => x !== i);
        setLeaveRows(next.length ? next : [emptyLeaveRow()]);
        setSnackbar({ open: true, message: '申請行を削除しました' });
    };
    const handleDeleteRow = (i) => {
        if (hasLeaveRowInput(leaveRows[i])) setDeleteRowTargetIndex(i);
        else deleteRowAt(i);
    };
    const handleDeleteRowConfirm = () => {
        if (deleteRowTargetIndex === null) return;
        deleteRowAt(deleteRowTargetIndex);
        setDeleteRowTargetIndex(null);
    };

    const handleSaveDraft = () => {
        const id = editId === 'new' ? `leave_${Date.now()}` : editId;
        const newDraft = { id, details: leaveRows.map(normalizeLeaveRow), status: '下書き', updated: new Date().toISOString() };
        const next = editId === 'new' ? [...leaveList, newDraft] : leaveList.map((d) => (d.id === id ? newDraft : d));
        setLeaveList(next);
        saveLeaveDrafts(next);
        setEditId(id);
        setMode('list');
        setSnackbar({ open: true, message: '下書きを保存しました' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const dateInvalid = leaveRows.findIndex((r) => !r.isHourly && r.dateFrom && r.dateTo && r.dateTo < r.dateFrom);
        if (dateInvalid >= 0) {
            setSnackbar({ open: true, message: `#${dateInvalid + 1} の終了日が開始日より前です` });
            return;
        }
        const hoursInvalid = leaveRows.findIndex((r) => r.isHourly && !(Number(r.hours) > 0));
        if (hoursInvalid >= 0) {
            setSnackbar({ open: true, message: `#${hoursInvalid + 1} の時間数を入力してください（0より大きい値）` });
            return;
        }
        const apps = buildLeaveApplications({ editId, rows: leaveRows, applicantId: userId });
        const prev = loadLeaveApplications();
        saveLeaveApplications([...apps, ...prev]);
        const next = leaveList.filter((d) => d.id !== editId);
        setLeaveList(next);
        saveLeaveDrafts(next);
        setSnackbar({ open: true, message: `${apps.length}件の勤怠申請を送信しました` });
        resetForm();
        setMode('list');
    };

    const handleNew = () => { resetForm(); setMode('edit'); };

    const filledCount = leaveRows.filter(hasLeaveRowInput).length;

    if (mode === 'list') {
        return (
            <PageScaffold
                eyebrow="申請"
                title="勤怠申請の下書き"
                subtitle="作成中の下書きを編集・送信できます。送信後は勤怠申請履歴画面に反映されます。"
                actions={(
                    <Button variant="contained" color="primary" startIcon={<AddRoundedIcon />} onClick={handleNew}>
                        新規作成
                    </Button>
                )}
            >
                <Section padded>
                    {leaveList.length === 0 ? (
                        <Box sx={{ paddingBlock: 4, textAlign: 'center', color: 'var(--ink-tertiary)' }}>
                            <Typography variant="body2">下書きはありません。</Typography>
                            <Typography variant="caption">右上の「新規作成」から始めましょう。</Typography>
                        </Box>
                    ) : (
                        <Stack spacing={1.25}>
                            {leaveList.map((draft) => {
                                const first = draft.details?.[0] || emptyLeaveRow();
                                const firstPeriod = formatLeavePeriod(first, { withDays: false }) || '-';
                                const summary = `${firstPeriod} / ${first.leaveType}${draft.details?.length > 1 ? ` ほか${draft.details.length - 1}件` : ''}`;
                                return (
                                    <Box
                                        key={draft.id}
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: '1fr', md: '160px 80px 1fr auto' },
                                            alignItems: 'center',
                                            gap: 1.5,
                                            paddingInline: 2,
                                            paddingBlock: 1.5,
                                            borderRadius: 'var(--radius-md)',
                                            background: 'var(--surface-sunken)',
                                            transition: 'var(--motion-fast)',
                                            '&:hover': { background: 'var(--accent-primary-soft)' },
                                        }}
                                    >
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <StatusChip status="draft" size="sm" />
                                            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                                                {draft.updated ? new Date(draft.updated).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </Typography>
                                        </Stack>
                                        <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>{draft.details?.length || 0}件</Typography>
                                        <Typography variant="body2" sx={{ color: 'var(--ink-primary)' }}>{summary}</Typography>
                                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                            <Tooltip title="編集"><IconButton onClick={() => handleEdit(draft.id)}><EditRoundedIcon fontSize="small" /></IconButton></Tooltip>
                                            <Tooltip title="削除"><IconButton color="error" onClick={() => setDeleteTargetId(draft.id)}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton></Tooltip>
                                        </Stack>
                                    </Box>
                                );
                            })}
                        </Stack>
                    )}
                </Section>
                <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ open: false, message: '' })}>
                    <Alert severity="success" sx={{ width: '100%' }}>{snackbar.message}</Alert>
                </Snackbar>
                <AdminConfirmDialog
                    open={Boolean(deleteTargetId)}
                    title="下書きを削除しますか？"
                    message="選択した勤怠申請の下書きを削除します。元に戻せません。"
                    confirmLabel="削除"
                    onCancel={() => setDeleteTargetId(null)}
                    onConfirm={handleDeleteConfirm}
                />
            </PageScaffold>
        );
    }

    return (
        <PageScaffold
            eyebrow="申請"
            title="勤怠申請"
            subtitle="休暇（期間／時間休）・遅刻・早退をまとめて送信できます。承認後は勤怠に自動反映されます。"
            actions={(
                <>
                    <Button variant="text" startIcon={<ArrowBackRoundedIcon />} onClick={() => setMode('list')} sx={{ color: 'var(--ink-tertiary)' }}>
                        一覧に戻る
                    </Button>
                    <Button variant="outlined" color="primary" startIcon={<SaveRoundedIcon />} onClick={handleSaveDraft}>
                        下書き保存
                    </Button>
                    <Button form="leave-form" type="submit" variant="contained" color="primary" startIcon={<SendRoundedIcon />}>
                        送信
                    </Button>
                </>
            )}
        >
            <Box
                sx={{
                    position: 'sticky',
                    top: 'var(--top-strip-h)',
                    zIndex: 5,
                    paddingInline: 2,
                    paddingBlock: 1.25,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface-overlay)',
                    boxShadow: 'var(--shadow-1)',
                    backdropFilter: 'blur(8px)',
                }}
            >
                <Stack direction="row" alignItems="center" spacing={3} flexWrap="wrap">
                    <Stat label="申請件数" value={leaveRows.length} tone="primary" />
                    <Stat label="入力済み" value={filledCount} tone="leaf" />
                    <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', flex: 1 }}>
                        ＊送信は確認なしで進みます。日付と理由を確認してから送信してください。
                    </Typography>
                </Stack>
            </Box>

            <Box component="form" id="leave-form" onSubmit={handleSubmit}>
                <Stack spacing={1.5}>
                    {leaveRows.map((row, index) => (
                        <Section
                            key={index}
                            padded
                            sx={{
                                background: 'var(--surface-raised)',
                                animation: 'recrovaFloatIn 200ms cubic-bezier(.2,.8,.2,1)',
                            }}
                        >
                            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                                <Box
                                    sx={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 'var(--radius-pill)',
                                        background: 'var(--surface-sunken)',
                                        display: 'grid',
                                        placeItems: 'center',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: 'var(--ink-tertiary)',
                                        flexShrink: 0,
                                    }}
                                >
                                    {index + 1}
                                </Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
                                    {row.leaveType || '勤怠申請'}
                                    <Typography component="span" variant="caption" sx={{ color: 'var(--ink-tertiary)', ml: 1 }}>
                                        {formatLeavePeriod(row, { withDays: false }) || '日付未入力'}
                                        {row.isHourly && getLeaveHours(row) > 0 && (
                                            <Typography component="span" variant="caption" sx={{ color: 'var(--accent-iris)', ml: 0.75, fontWeight: 700 }}>
                                                ・{getLeaveHours(row)}時間
                                            </Typography>
                                        )}
                                        {!row.isHourly && row.dateFrom && row.dateTo && row.dateFrom !== row.dateTo && (
                                            <Typography component="span" variant="caption" sx={{ color: 'var(--accent-primary)', ml: 0.75, fontWeight: 700 }}>
                                                ・{getLeaveDayCount(row)}日間
                                            </Typography>
                                        )}
                                    </Typography>
                                </Typography>
                                <Tooltip title="この行を削除">
                                    <IconButton color="error" onClick={() => handleDeleteRow(index)} size="small">
                                        <DeleteOutlineRoundedIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                            <Stack spacing={2}>
                                {/* A: 申請種別 + 時間指定モード */}
                                <Stack
                                    direction={{ xs: 'column', md: 'row' }}
                                    spacing={1.5}
                                    alignItems={{ xs: 'stretch', md: 'flex-start' }}
                                >
                                    <FormControl sx={{ width: { xs: '100%', md: 240 }, flexShrink: 0 }}>
                                        <InputLabel>申請種別</InputLabel>
                                        <Select
                                            value={row.leaveType}
                                            label="申請種別"
                                            onChange={(e) => handleRowChange(index, 'leaveType', e.target.value)}
                                            required
                                        >
                                            {LEAVE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                    <Box
                                        sx={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            paddingInline: 1.75,
                                            paddingBlock: 1,
                                            borderRadius: 'var(--radius-md)',
                                            background: 'var(--surface-sunken)',
                                            minHeight: 56,
                                        }}
                                    >
                                        {isAlwaysHourly(row.leaveType) ? (
                                            <Chip
                                                size="small"
                                                icon={<AccessTimeRoundedIcon fontSize="small" />}
                                                label={`${row.leaveType}は時間指定で申請します（自動）`}
                                                sx={{
                                                    background: 'var(--accent-iris-soft, rgba(99,102,241,0.12))',
                                                    color: 'var(--accent-iris)',
                                                    fontWeight: 600,
                                                    '& .MuiChip-icon': { color: 'var(--accent-iris)' },
                                                }}
                                            />
                                        ) : (
                                            <FormControlLabel
                                                control={(
                                                    <Switch
                                                        size="small"
                                                        checked={row.isHourly}
                                                        onChange={(e) => handleRowChange(index, 'isHourly', e.target.checked)}
                                                    />
                                                )}
                                                label={(
                                                    <Stack direction="row" spacing={0.75} alignItems="center">
                                                        <AccessTimeRoundedIcon fontSize="small" sx={{ color: 'var(--ink-tertiary)' }} />
                                                        <Typography variant="body2" sx={{ color: 'var(--ink-secondary)', fontWeight: 600 }}>
                                                            時間休として取得
                                                        </Typography>
                                                    </Stack>
                                                )}
                                                sx={{ m: 0 }}
                                            />
                                        )}
                                    </Box>
                                </Stack>

                                {/* B: 期間（時間休 or 全日）*/}
                                <Box
                                    sx={{
                                        paddingInline: 1.75,
                                        paddingBlock: 1.5,
                                        borderRadius: 'var(--radius-md)',
                                        background: 'var(--surface-sunken)',
                                        border: '1px dashed var(--divider-soft, rgba(0,0,0,0.08))',
                                    }}
                                >
                                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                                        {row.isHourly
                                            ? <AccessTimeRoundedIcon fontSize="small" sx={{ color: 'var(--ink-tertiary)' }} />
                                            : <EventRoundedIcon fontSize="small" sx={{ color: 'var(--ink-tertiary)' }} />}
                                        <Typography variant="overline" sx={{ color: 'var(--ink-tertiary)', lineHeight: 1 }}>
                                            {row.isHourly ? '日付 ・ 時間数' : '休暇期間'}
                                        </Typography>
                                    </Stack>
                                    {row.isHourly ? (
                                        <Stack
                                            direction={{ xs: 'column', sm: 'row' }}
                                            spacing={1.5}
                                            alignItems={{ xs: 'stretch', sm: 'flex-start' }}
                                        >
                                            <TextField
                                                label="日付"
                                                type="date"
                                                InputLabelProps={{ shrink: true }}
                                                value={row.dateFrom}
                                                onChange={(e) => handleRowChange(index, 'dateFrom', e.target.value)}
                                                helperText=" "
                                                required
                                                sx={{ width: { xs: '100%', sm: 200 } }}
                                            />
                                            <TextField
                                                label="時間数"
                                                type="number"
                                                InputLabelProps={{ shrink: true }}
                                                value={row.hours || ''}
                                                onChange={(e) => handleRowChange(index, 'hours', e.target.value)}
                                                inputProps={{ step: 0.5, min: 0.5, max: 8, inputMode: 'decimal' }}
                                                error={row.isHourly && !(Number(row.hours) > 0)}
                                                helperText={row.isHourly && !(Number(row.hours) > 0) ? '0.5時間以上' : '0.5時間単位（例: 1, 1.5, 2）'}
                                                required
                                                InputProps={{ endAdornment: <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', ml: 0.5 }}>時間</Typography> }}
                                                sx={{ width: { xs: '100%', sm: 180 } }}
                                            />
                                            <Box
                                                sx={{
                                                    flex: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    height: { sm: 43 },
                                                    paddingInline: { sm: 1 },
                                                    paddingBlock: { xs: 0.5, sm: 0 },
                                                }}
                                            >
                                                <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', lineHeight: 1.5 }}>
                                                    {row.leaveType === '遅刻' && `始業 ${BUSINESS_START} から ${row.hours || '-'} 時間分遅刻として勤怠に反映`}
                                                    {row.leaveType === '早退' && `終業 ${BUSINESS_END} の ${row.hours || '-'} 時間前に退社として勤怠に反映`}
                                                    {!isAlwaysHourly(row.leaveType) && '具体的な時間帯は備考欄に記入できます'}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    ) : (
                                        <Stack
                                            direction={{ xs: 'column', sm: 'row' }}
                                            spacing={1}
                                            alignItems={{ xs: 'stretch', sm: 'flex-start' }}
                                        >
                                            <TextField
                                                label="開始日"
                                                type="date"
                                                InputLabelProps={{ shrink: true }}
                                                value={row.dateFrom}
                                                onChange={(e) => handleRowChange(index, 'dateFrom', e.target.value)}
                                                helperText=" "
                                                required
                                                sx={{ width: { xs: '100%', sm: 200 } }}
                                            />
                                            <Box
                                                sx={{
                                                    display: { xs: 'none', sm: 'flex' },
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    height: 43,
                                                    minWidth: 24,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Typography variant="body2" sx={{ color: 'var(--ink-tertiary)' }}>〜</Typography>
                                            </Box>
                                            <TextField
                                                label="終了日"
                                                type="date"
                                                InputLabelProps={{ shrink: true }}
                                                value={row.dateTo}
                                                onChange={(e) => handleRowChange(index, 'dateTo', e.target.value)}
                                                inputProps={{ min: row.dateFrom || undefined }}
                                                error={Boolean(row.dateFrom && row.dateTo && row.dateTo < row.dateFrom)}
                                                helperText={row.dateFrom && row.dateTo && row.dateTo < row.dateFrom ? '終了日は開始日以降を指定' : ' '}
                                                required
                                                sx={{ width: { xs: '100%', sm: 200 } }}
                                            />
                                            {row.dateFrom && row.dateTo && row.dateFrom !== row.dateTo && (
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        height: { sm: 43 },
                                                        alignSelf: { xs: 'flex-start', sm: 'auto' },
                                                    }}
                                                >
                                                    <Chip
                                                        size="small"
                                                        label={`${getLeaveDayCount(row)}日間`}
                                                        sx={{
                                                            background: 'var(--accent-primary-soft, rgba(34,197,94,0.12))',
                                                            color: 'var(--accent-primary)',
                                                            fontWeight: 700,
                                                        }}
                                                    />
                                                </Box>
                                            )}
                                        </Stack>
                                    )}
                                </Box>

                                {/* C: 理由・備考 */}
                                <TextField
                                    label="理由・備考"
                                    multiline
                                    minRows={2}
                                    maxRows={6}
                                    value={row.reason}
                                    onChange={(e) => handleRowChange(index, 'reason', e.target.value)}
                                    fullWidth
                                    placeholder={row.isHourly
                                        ? '例: 午前中の通院／14:00-16:00 の打合せのため'
                                        : '例: 帰省／私用のため'}
                                />
                            </Stack>
                        </Section>
                    ))}
                </Stack>

                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    sx={{ mt: 2 }}
                >
                    <Button
                        variant="outlined"
                        startIcon={<AddRoundedIcon />}
                        onClick={() => setLeaveRows([...leaveRows, emptyLeaveRow()])}
                        sx={{ borderStyle: 'dashed', flex: { xs: 'auto', sm: 1 }, paddingBlock: 1.2, color: 'var(--ink-tertiary)' }}
                    >
                        申請行を追加
                    </Button>
                    <Box sx={{ flex: { xs: 'auto', sm: '0 0 auto' } }}>
                        <KeyHint keys={['Tab']} />
                        <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', ml: 1 }}>で次の入力へ</Typography>
                    </Box>
                </Stack>
            </Box>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ open: false, message: '' })}>
                <Alert severity="success" sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
            <AdminConfirmDialog
                open={deleteRowTargetIndex !== null}
                title="申請行を削除しますか？"
                message={`#${deleteRowTargetIndex + 1} の申請行を削除します。入力内容も失われます。`}
                confirmLabel="削除"
                onCancel={() => setDeleteRowTargetIndex(null)}
                onConfirm={handleDeleteRowConfirm}
            />
        </PageScaffold>
    );
}

const Stat = ({ label, value, tone = 'primary' }) => {
    const tones = { primary: 'var(--accent-primary)', leaf: 'var(--accent-leaf)' };
    return (
        <Box>
            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', display: 'block', lineHeight: 1 }}>{label}</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 22, color: tones[tone], lineHeight: 1.1 }} className="tabular-nums">
                {value}<Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'var(--ink-tertiary)', fontSize: 12, fontWeight: 600 }}>件</Typography>
            </Typography>
        </Box>
    );
};

export default LeaveApplication;
