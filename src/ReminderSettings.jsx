import { useEffect, useState } from 'react';
import { Container, Typography, Box, Button, TextField, Paper, Snackbar, Alert, Switch, FormControlLabel, Chip } from '@mui/material';

const STORAGE_KEY = 'reminderSettings';

const ALERT_ITEMS = [
    {
        key: 'forget',
        label: '申請忘れアラート',
        description: '月末前に未申請の利用者へ通知します。',
        defaultConfig: { enabled: true, day: 25, max: 2 },
    },
    {
        key: 'deadline',
        label: '申請締切アラート',
        description: '締切日が近い申請者へ通知します。',
        defaultConfig: { enabled: false, day: 28, max: 1 },
    },
    {
        key: 'approvalDelay',
        label: '承認遅延アラート',
        description: '承認待ちのまま残っている承認者へ通知します。',
        defaultConfig: { enabled: false, day: 27, max: 1 },
    },
    {
        key: 'monthlySummary',
        label: '月次未申請サマリーアラート',
        description: '月次の未申請状況を管理者へ集計通知します。',
        defaultConfig: { enabled: false, day: 20, max: 1 },
    },
];

const createDefaultConfigs = () => (
    ALERT_ITEMS.reduce((configs, item) => ({
        ...configs,
        [item.key]: { ...item.defaultConfig },
    }), {})
);

const normalizeConfigs = (configs) => (
    ALERT_ITEMS.reduce((next, item) => ({
        ...next,
        [item.key]: {
            ...item.defaultConfig,
            ...(configs?.[item.key] || {}),
        },
    }), {})
);

function ReminderSettings() {
    const [alertConfigs, setAlertConfigs] = useState(createDefaultConfigs);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            if (saved) setAlertConfigs(normalizeConfigs(saved));
        } catch {
            setAlertConfigs(createDefaultConfigs());
        }
    }, []);

    const handleSave = () => {
        const invalidItem = ALERT_ITEMS.find(item => {
            const config = alertConfigs[item.key];
            return config.enabled && (
                !Number.isInteger(config.day) ||
                config.day < 1 ||
                config.day > 31 ||
                !Number.isInteger(config.max) ||
                config.max < 1 ||
                config.max > 10
            );
        });
        if (invalidItem) {
            setSnackbar({ open: true, message: `${invalidItem.label}の日付または送信回数を確認してください`, severity: 'warning' });
            return;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(alertConfigs));
        setSnackbar({ open: true, message: 'アラート設定を保存しました', severity: 'success' });
    };

    const handleReset = () => {
        if (!window.confirm('アラート設定を初期値に戻しますか？')) return;
        const defaults = createDefaultConfigs();
        setAlertConfigs(defaults);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
        setSnackbar({ open: true, message: 'アラート設定を初期値に戻しました', severity: 'success' });
    };

    const handleAlertChange = (type, field, value) => {
        setAlertConfigs({
            ...alertConfigs,
            [type]: {
                ...alertConfigs[type],
                [field]: field === 'enabled' ? value : Number(value)
            }
        });
    };

    const enabledCount = ALERT_ITEMS.filter(item => alertConfigs[item.key].enabled).length;

    return (
        <Container>
            <Paper>
                <Box className="pageHeaderRow">
                    <Box>
                        <Typography variant="h6">
                            アラート設定
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            申請忘れや承認遅延の通知タイミングを調整します。
                        </Typography>
                    </Box>
                    <Box className="pageActionBar">
                        <Button variant="outlined" color="inherit" onClick={handleReset}>
                            初期値に戻す
                        </Button>
                        <Button variant="contained" color="primary" onClick={handleSave}>
                            保存
                        </Button>
                    </Box>
                </Box>
                <Box className="expenseSummaryStrip">
                    <Box>
                        <Typography variant="caption" color="text.secondary">アラート数</Typography>
                        <Typography variant="subtitle1">{ALERT_ITEMS.length}件</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">有効</Typography>
                        <Typography variant="subtitle1">{enabledCount}件</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">無効</Typography>
                        <Typography variant="subtitle1">{ALERT_ITEMS.length - enabledCount}件</Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {ALERT_ITEMS.map(alert => {
                        const config = alertConfigs[alert.key];
                        const isEnabled = config.enabled;
                        return (
                            <Paper key={alert.key} className={`alertSettingCard ${isEnabled ? '' : 'isDisabled'}`} variant="outlined">
                                <Box className="alertSettingHeader">
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={isEnabled}
                                                onChange={e => handleAlertChange(alert.key, 'enabled', e.target.checked)}
                                            />
                                        }
                                        label={alert.label}
                                    />
                                    <Chip size="small" label={isEnabled ? '有効' : '無効'} color={isEnabled ? 'primary' : 'default'} variant={isEnabled ? 'filled' : 'outlined'} />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {alert.description}
                                </Typography>
                                <Box className="alertSettingFields">
                                    <TextField
                                        label="毎月何日から"
                                        type="number"
                                        size="small"
                                        slotProps={{ htmlInput: { min: 1, max: 31 } }}
                                        value={config.day}
                                        onChange={e => handleAlertChange(alert.key, 'day', e.target.value)}
                                        sx={{ width: 120 }}
                                        disabled={!isEnabled}
                                        error={isEnabled && (config.day < 1 || config.day > 31)}
                                        helperText={isEnabled && (config.day < 1 || config.day > 31) ? '1-31' : ' '}
                                    />
                                    <TextField
                                        label="最大送信回数"
                                        type="number"
                                        size="small"
                                        slotProps={{ htmlInput: { min: 1, max: 10 } }}
                                        value={config.max}
                                        onChange={e => handleAlertChange(alert.key, 'max', e.target.value)}
                                        sx={{ width: 140 }}
                                        disabled={!isEnabled}
                                        error={isEnabled && (config.max < 1 || config.max > 10)}
                                        helperText={isEnabled && (config.max < 1 || config.max > 10) ? '1-10' : ' '}
                                    />
                                </Box>
                            </Paper>
                        );
                    })}
                </Box>
            </Paper>
            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default ReminderSettings;
