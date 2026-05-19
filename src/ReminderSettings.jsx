import { useEffect, useState } from 'react';
import {
    Box, Button, TextField, Snackbar, Alert, Switch, MenuItem, Stack, Typography,
} from '@mui/material';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import AdminConfirmDialog from './components/AdminConfirmDialog';
import PageScaffold from './ui/PageScaffold.jsx';
import Section from './ui/Section.jsx';
import StatusChip from './ui/StatusChip.jsx';

const STORAGE_KEY = 'reminderSettings';

const TIMING_TYPES = {
    fixedDay: 'fixedDay',
    daysBeforeMonthEnd: 'daysBeforeMonthEnd',
    monthEnd: 'monthEnd',
};

const ALERT_ITEMS = [
    { key: 'forget', label: '申請忘れアラート', description: '月末前に未申請の利用者へ通知します。', defaultConfig: { enabled: true, timingType: TIMING_TYPES.daysBeforeMonthEnd, day: 25, daysBeforeMonthEnd: 5, max: 2 } },
    { key: 'deadline', label: '申請締切アラート', description: '締切日が近い申請者へ通知します。', defaultConfig: { enabled: false, timingType: TIMING_TYPES.daysBeforeMonthEnd, day: 28, daysBeforeMonthEnd: 1, max: 1 } },
    { key: 'approvalDelay', label: '承認遅延アラート', description: '承認待ちのまま残っている承認者へ通知します。', defaultConfig: { enabled: false, timingType: TIMING_TYPES.fixedDay, day: 27, daysBeforeMonthEnd: 3, max: 1 } },
    { key: 'monthlySummary', label: '月次未申請サマリーアラート', description: '月次の未申請状況を管理者へ集計通知します。', defaultConfig: { enabled: false, timingType: TIMING_TYPES.monthEnd, day: 20, daysBeforeMonthEnd: 1, max: 1 } },
];

const createDefaultConfigs = () =>
    ALERT_ITEMS.reduce((configs, item) => ({ ...configs, [item.key]: { ...item.defaultConfig } }), {});

const normalizeConfig = (config = {}, defaultConfig) => {
    const timingType = Object.values(TIMING_TYPES).includes(config.timingType) ? config.timingType : TIMING_TYPES.fixedDay;
    return {
        ...defaultConfig,
        ...config,
        timingType,
        day: Number(config.day || defaultConfig.day),
        daysBeforeMonthEnd: Number(config.daysBeforeMonthEnd || defaultConfig.daysBeforeMonthEnd),
        max: Number(config.max || defaultConfig.max),
    };
};

const normalizeConfigs = (configs) =>
    ALERT_ITEMS.reduce((next, item) => ({ ...next, [item.key]: normalizeConfig(configs?.[item.key], item.defaultConfig) }), {});

const isConfigInvalid = (config) => {
    if (!Number.isInteger(config.max) || config.max < 1 || config.max > 10) return true;
    if (config.timingType === TIMING_TYPES.fixedDay) {
        return !Number.isInteger(config.day) || config.day < 1 || config.day > 28;
    }
    if (config.timingType === TIMING_TYPES.daysBeforeMonthEnd) {
        return !Number.isInteger(config.daysBeforeMonthEnd) || config.daysBeforeMonthEnd < 1 || config.daysBeforeMonthEnd > 10;
    }
    return config.timingType !== TIMING_TYPES.monthEnd;
};

function ReminderSettings() {
    const [alertConfigs, setAlertConfigs] = useState(createDefaultConfigs);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            if (saved) setAlertConfigs(normalizeConfigs(saved));
        } catch {
            setAlertConfigs(createDefaultConfigs());
        }
    }, []);

    const handleSave = () => {
        const invalidItem = ALERT_ITEMS.find((item) => {
            const config = alertConfigs[item.key];
            return config.enabled && isConfigInvalid(config);
        });
        if (invalidItem) {
            setSnackbar({ open: true, message: `${invalidItem.label}の通知タイミングまたは送信回数を確認してください`, severity: 'warning' });
            return;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(alertConfigs));
        setSnackbar({ open: true, message: 'アラート設定を保存しました', severity: 'success' });
    };

    const handleReset = () => {
        const defaults = createDefaultConfigs();
        setAlertConfigs(defaults);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
        setResetConfirmOpen(false);
        setSnackbar({ open: true, message: 'アラート設定を初期値に戻しました', severity: 'success' });
    };

    const handleAlertChange = (type, field, value) => {
        setAlertConfigs({
            ...alertConfigs,
            [type]: {
                ...alertConfigs[type],
                [field]: field === 'enabled' || field === 'timingType' ? value : Number(value),
            },
        });
    };

    const enabledCount = ALERT_ITEMS.filter((item) => alertConfigs[item.key].enabled).length;

    return (
        <PageScaffold
            eyebrow="管理"
            title="アラート設定"
            subtitle="申請忘れや承認遅延の通知タイミングを調整します。"
            actions={(
                <>
                    <Button variant="text" startIcon={<RestartAltRoundedIcon />} onClick={() => setResetConfirmOpen(true)} sx={{ color: 'var(--ink-tertiary)' }}>
                        初期値に戻す
                    </Button>
                    <Button variant="contained" color="primary" startIcon={<SaveRoundedIcon />} onClick={handleSave}>
                        保存
                    </Button>
                </>
            )}
        >
            <Section padded tone="sunken" elevation={0}>
                <Stack direction="row" spacing={4} sx={{ flexWrap: 'wrap' }}>
                    <Box>
                        <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>アラート種類</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--ink-primary)' }}>{ALERT_ITEMS.length}件</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>有効</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--accent-primary)' }}>{enabledCount}件</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>無効</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--ink-tertiary)' }}>{ALERT_ITEMS.length - enabledCount}件</Typography>
                    </Box>
                </Stack>
            </Section>

            <Stack spacing={2}>
                {ALERT_ITEMS.map((alert) => {
                    const config = alertConfigs[alert.key];
                    const isEnabled = config.enabled;
                    return (
                        <Section
                            key={alert.key}
                            padded
                            sx={{
                                background: isEnabled ? 'var(--surface-raised)' : 'var(--surface-sunken)',
                                transition: 'var(--motion-base)',
                            }}
                        >
                            <Stack
                                direction={{ xs: 'column', md: 'row' }}
                                alignItems={{ xs: 'flex-start', md: 'center' }}
                                justifyContent="space-between"
                                spacing={1.5}
                                sx={{ mb: 2 }}
                            >
                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                    <Switch
                                        checked={isEnabled}
                                        onChange={(e) => handleAlertChange(alert.key, 'enabled', e.target.checked)}
                                    />
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'var(--ink-primary)' }}>
                                            {alert.label}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'var(--ink-tertiary)' }}>
                                            {alert.description}
                                        </Typography>
                                    </Box>
                                </Stack>
                                <StatusChip status={isEnabled ? 'active' : 'inactive'} />
                            </Stack>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap">
                                <TextField
                                    label="通知タイミング"
                                    select
                                    size="small"
                                    value={config.timingType}
                                    onChange={(e) => handleAlertChange(alert.key, 'timingType', e.target.value)}
                                    sx={{ minWidth: 200 }}
                                    disabled={!isEnabled}
                                >
                                    <MenuItem value={TIMING_TYPES.fixedDay}>毎月固定日</MenuItem>
                                    <MenuItem value={TIMING_TYPES.daysBeforeMonthEnd}>月末のN日前</MenuItem>
                                    <MenuItem value={TIMING_TYPES.monthEnd}>月末</MenuItem>
                                </TextField>
                                {config.timingType === TIMING_TYPES.fixedDay && (
                                    <TextField
                                        label="毎月何日"
                                        type="number"
                                        size="small"
                                        slotProps={{ htmlInput: { min: 1, max: 28 } }}
                                        value={config.day}
                                        onChange={(e) => handleAlertChange(alert.key, 'day', e.target.value)}
                                        sx={{ width: 140 }}
                                        disabled={!isEnabled}
                                        error={isEnabled && (config.day < 1 || config.day > 28)}
                                        helperText={isEnabled && (config.day < 1 || config.day > 28) ? '1-28' : ' '}
                                    />
                                )}
                                {config.timingType === TIMING_TYPES.daysBeforeMonthEnd && (
                                    <TextField
                                        label="月末の何日前"
                                        type="number"
                                        size="small"
                                        slotProps={{ htmlInput: { min: 1, max: 10 } }}
                                        value={config.daysBeforeMonthEnd}
                                        onChange={(e) => handleAlertChange(alert.key, 'daysBeforeMonthEnd', e.target.value)}
                                        sx={{ width: 170 }}
                                        disabled={!isEnabled}
                                        error={isEnabled && (config.daysBeforeMonthEnd < 1 || config.daysBeforeMonthEnd > 10)}
                                        helperText={isEnabled && (config.daysBeforeMonthEnd < 1 || config.daysBeforeMonthEnd > 10) ? '1-10' : ' '}
                                    />
                                )}
                                {config.timingType === TIMING_TYPES.monthEnd && (
                                    <Box
                                        sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            paddingInline: 1.5,
                                            paddingBlock: 0.75,
                                            borderRadius: 'var(--radius-pill)',
                                            background: 'var(--accent-leaf-soft)',
                                            color: 'var(--accent-leaf)',
                                            fontWeight: 700,
                                            fontSize: 12,
                                        }}
                                    >
                                        月末当日に通知
                                    </Box>
                                )}
                                <TextField
                                    label="最大送信回数"
                                    type="number"
                                    size="small"
                                    slotProps={{ htmlInput: { min: 1, max: 10 } }}
                                    value={config.max}
                                    onChange={(e) => handleAlertChange(alert.key, 'max', e.target.value)}
                                    sx={{ width: 160 }}
                                    disabled={!isEnabled}
                                    error={isEnabled && (config.max < 1 || config.max > 10)}
                                    helperText={isEnabled && (config.max < 1 || config.max > 10) ? '1-10' : ' '}
                                />
                            </Stack>
                        </Section>
                    );
                })}
            </Stack>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
            <AdminConfirmDialog
                open={resetConfirmOpen}
                title="初期値に戻しますか？"
                message="現在のアラート設定を標準設定で上書きします。元に戻すことはできません。"
                confirmLabel="初期値に戻す"
                confirmColor="warning"
                onCancel={() => setResetConfirmOpen(false)}
                onConfirm={handleReset}
            />
        </PageScaffold>
    );
}

export default ReminderSettings;
