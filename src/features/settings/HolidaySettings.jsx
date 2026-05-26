import { useEffect, useMemo, useState } from 'react';
import {
    Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel,
    MenuItem, Select, Snackbar, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
    Tooltip, Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import CloudSyncRoundedIcon from '@mui/icons-material/CloudSyncRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import AdminConfirmDialog from '../../shared/components/AdminConfirmDialog';
import PageScaffold from '../../shared/ui/PageScaffold.jsx';
import Section from '../../shared/ui/Section.jsx';
import {
    HOLIDAY_SOURCES,
    deleteHoliday,
    importLegalForYear,
    invalidateHolidayCache,
    loadHolidays,
    resetHolidays,
    upsertHoliday,
} from '../../shared/utils/holidayStore';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const formatWeekday = (dateKey) => {
    const d = new Date(`${dateKey}T00:00:00`);
    return Number.isNaN(d.getTime()) ? '-' : WEEKDAYS[d.getDay()];
};

const EMPTY_FORM = { date: '', name: '', source: 'company', note: '' };

function HolidaySettings() {
    const today = new Date();
    const [holidays, setHolidays] = useState(() => loadHolidays());
    const [year, setYear] = useState(today.getFullYear());
    const [sourceFilter, setSourceFilter] = useState('all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [importConfirm, setImportConfirm] = useState(false);
    const [resetConfirm, setResetConfirm] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => { invalidateHolidayCache(); }, [holidays]);

    const years = useMemo(() => {
        const set = new Set([today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1]);
        holidays.forEach((h) => set.add(Number(h.date.slice(0, 4))));
        return Array.from(set).sort();
    }, [holidays, today]);

    const filtered = useMemo(() => {
        const prefix = `${year}-`;
        return holidays
            .filter((h) => h.date.startsWith(prefix))
            .filter((h) => sourceFilter === 'all' || h.source === sourceFilter);
    }, [holidays, year, sourceFilter]);

    const summary = useMemo(() => {
        const prefix = `${year}-`;
        const ofYear = holidays.filter((h) => h.date.startsWith(prefix));
        return {
            total: ofYear.length,
            legal: ofYear.filter((h) => h.source === 'legal').length,
            company: ofYear.filter((h) => h.source === 'company').length,
            adjusted: ofYear.filter((h) => h.source === 'adjusted').length,
        };
    }, [holidays, year]);

    const openCreate = () => {
        setEditing(null);
        setForm({ ...EMPTY_FORM, date: `${year}-01-01` });
        setDialogOpen(true);
    };
    const openEdit = (rec) => {
        setEditing(rec);
        setForm({ date: rec.date, name: rec.name, source: rec.source, note: rec.note || '' });
        setDialogOpen(true);
    };
    const closeDialog = () => { setDialogOpen(false); setEditing(null); };

    const handleSave = () => {
        if (!form.date || !form.name.trim()) {
            setSnackbar({ open: true, message: '日付と名称は必須です', severity: 'warning' });
            return;
        }
        // 編集で date/source が変わるケースは旧レコードを消してから upsert
        let next = holidays;
        if (editing && (editing.date !== form.date || editing.source !== form.source)) {
            next = deleteHoliday(next, editing.date, editing.source);
        }
        next = upsertHoliday(next, form);
        setHolidays(next);
        closeDialog();
        setSnackbar({ open: true, message: editing ? '祝日を更新しました' : '祝日を追加しました', severity: 'success' });
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        const next = deleteHoliday(holidays, deleteTarget.date, deleteTarget.source);
        setHolidays(next);
        setDeleteTarget(null);
        setSnackbar({ open: true, message: '祝日を削除しました', severity: 'success' });
    };

    const handleImport = () => {
        const next = importLegalForYear(holidays, year);
        setHolidays(next);
        setImportConfirm(false);
        setSnackbar({ open: true, message: `${year}年の法定祝日をバッチ取込しました`, severity: 'success' });
    };

    const handleReset = () => {
        const next = resetHolidays();
        setHolidays(next);
        setResetConfirm(false);
        setSnackbar({ open: true, message: '祝日マスタを初期化しました', severity: 'success' });
    };

    const isEditable = (rec) => rec.source !== 'legal'; // legalはバッチ管理のため直接編集不可（補正は別レコードで）

    return (
        <PageScaffold
            eyebrow="マスタ"
            title="祝日マスタ"
            subtitle="法定祝日（バッチ取込）と会社休業日・補正を管理します。月次タイムシートの判定に即時反映されます。"
            actions={(
                <>
                    <Button
                        startIcon={<CloudSyncRoundedIcon />}
                        variant="outlined"
                        onClick={() => setImportConfirm(true)}
                    >
                        {year}年を取込
                    </Button>
                    <Button
                        startIcon={<AddRoundedIcon />}
                        variant="contained"
                        onClick={openCreate}
                    >
                        休業日を追加
                    </Button>
                </>
            )}
        >
            <Section padded sx={{ paddingBlock: 2 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
                    <Stack direction="row" spacing={2} alignItems="center">
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>年</InputLabel>
                            <Select label="年" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                                {years.map((y) => <MenuItem key={y} value={y}>{y}年</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                            <InputLabel>種別</InputLabel>
                            <Select label="種別" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
                                <MenuItem value="all">すべて</MenuItem>
                                {Object.entries(HOLIDAY_SOURCES).map(([k, v]) => (
                                    <MenuItem key={k} value={k}>{v.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                        <Chip
                            icon={<EventRoundedIcon />}
                            label={`${year}年計 ${summary.total}日`}
                            size="small"
                            sx={{ fontWeight: 700 }}
                        />
                        <Chip label={`法定 ${summary.legal}`} size="small"
                            sx={{ background: HOLIDAY_SOURCES.legal.softBg, color: HOLIDAY_SOURCES.legal.color, fontWeight: 700 }} />
                        <Chip label={`会社 ${summary.company}`} size="small"
                            sx={{ background: HOLIDAY_SOURCES.company.softBg, color: HOLIDAY_SOURCES.company.color, fontWeight: 700 }} />
                        <Chip label={`補正 ${summary.adjusted}`} size="small"
                            sx={{ background: HOLIDAY_SOURCES.adjusted.softBg, color: HOLIDAY_SOURCES.adjusted.color, fontWeight: 700 }} />
                    </Stack>
                </Stack>
            </Section>

            <Alert severity="info" sx={{ borderRadius: 'var(--radius-md)' }}>
                法定祝日は<strong>内閣府CSVの年次バッチ</strong>で更新されます。会社休業日・補正はこの画面で手動管理します。締め済の月への変更は集計再計算に注意してください。
            </Alert>

            <TableContainer sx={{ borderRadius: 'var(--radius-lg)', background: 'var(--surface-raised)', boxShadow: 'var(--shadow-1)' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ width: 132 }}>日付</TableCell>
                            <TableCell sx={{ width: 56 }}>曜</TableCell>
                            <TableCell>名称</TableCell>
                            <TableCell sx={{ width: 96 }}>種別</TableCell>
                            <TableCell>備考</TableCell>
                            <TableCell sx={{ width: 96 }} align="right">操作</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6}>
                                    <Box sx={{ paddingBlock: 4, textAlign: 'center', color: 'var(--ink-tertiary)' }}>
                                        該当する祝日が登録されていません
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : filtered.map((rec) => {
                            const cfg = HOLIDAY_SOURCES[rec.source];
                            const wd = formatWeekday(rec.date);
                            const isWeekend = wd === '土' || wd === '日';
                            return (
                                <TableRow key={`${rec.date}-${rec.source}`} hover>
                                    <TableCell sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{rec.date}</TableCell>
                                    <TableCell sx={{ color: isWeekend ? 'var(--accent-rose)' : 'var(--ink-secondary)', fontWeight: 700 }}>{wd}</TableCell>
                                    <TableCell>{rec.name}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={cfg.label}
                                            size="small"
                                            sx={{ background: cfg.softBg, color: cfg.color, fontWeight: 700 }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ color: 'var(--ink-tertiary)', fontSize: 13 }}>{rec.note || '-'}</TableCell>
                                    <TableCell align="right">
                                        <Tooltip title={isEditable(rec) ? '編集' : '法定祝日はバッチ管理のため編集不可（補正で上書き）'}>
                                            <span>
                                                <IconButton size="small" disabled={!isEditable(rec)} onClick={() => openEdit(rec)}>
                                                    <EditRoundedIcon fontSize="small" />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        <Tooltip title={isEditable(rec) ? '削除' : '法定祝日は削除不可（バッチで管理）'}>
                                            <span>
                                                <IconButton size="small" disabled={!isEditable(rec)} onClick={() => setDeleteTarget(rec)}>
                                                    <DeleteRoundedIcon fontSize="small" />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <Section padded sx={{ paddingBlock: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} justifyContent="space-between">
                    <Stack>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>マスタの初期化</Typography>
                        <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                            登録された全ての祝日（会社休業日・補正含む）を初期シードに戻します。元に戻せません。
                        </Typography>
                    </Stack>
                    <Button
                        startIcon={<RestartAltRoundedIcon />}
                        variant="text"
                        color="warning"
                        onClick={() => setResetConfirm(true)}
                        sx={{ color: 'var(--accent-rose)' }}
                    >
                        初期化
                    </Button>
                </Stack>
            </Section>

            <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editing ? '祝日を編集' : '休業日を追加'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="日付"
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                        <TextField
                            label="名称"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            fullWidth
                            placeholder="例: 創立記念日"
                        />
                        <FormControl fullWidth>
                            <InputLabel>種別</InputLabel>
                            <Select
                                label="種別"
                                value={form.source}
                                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                            >
                                <MenuItem value="company">会社 — 会社指定の休業日</MenuItem>
                                <MenuItem value="adjusted">補正 — 法改正の手動補正</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="備考"
                            value={form.note}
                            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                            fullWidth
                            multiline
                            minRows={2}
                            placeholder="任意"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog}>キャンセル</Button>
                    <Button variant="contained" onClick={handleSave}>保存</Button>
                </DialogActions>
            </Dialog>

            <AdminConfirmDialog
                open={Boolean(deleteTarget)}
                title="この休業日を削除しますか？"
                message={deleteTarget ? `${deleteTarget.date}（${deleteTarget.name}）を削除します。元に戻せません。` : ''}
                confirmLabel="削除"
                confirmColor="warning"
                onCancel={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
            />
            <AdminConfirmDialog
                open={importConfirm}
                title={`${year}年の法定祝日をバッチ取込しますか？`}
                message="内閣府CSV相当のシードから法定祝日を再投入します。会社休業日・補正はそのまま保持されます。"
                confirmLabel="取込"
                confirmColor="primary"
                onCancel={() => setImportConfirm(false)}
                onConfirm={handleImport}
            />
            <AdminConfirmDialog
                open={resetConfirm}
                title="祝日マスタを初期化しますか？"
                message="登録された会社休業日・補正も含めて全て削除し、初期シードを再投入します。元に戻せません。"
                confirmLabel="初期化"
                confirmColor="warning"
                onCancel={() => setResetConfirm(false)}
                onConfirm={handleReset}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={2500}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </PageScaffold>
    );
}

export default HolidaySettings;
