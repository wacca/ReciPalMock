import { useState } from 'react';
import { Container, Typography, Box, Button, TextField, Paper, Snackbar, Alert } from '@mui/material';

function ReminderSettings() {
    const [alertConfigs, setAlertConfigs] = useState({
        forget: { enabled: true, day: 25, max: 2 },
        deadline: { enabled: false, day: 28, max: 1 },
        approvalDelay: { enabled: false, day: 27, max: 1 },
        monthlySummary: { enabled: false, day: 20, max: 1 }
    });
    const [open, setOpen] = useState(false);

    const handleSave = () => {
        setOpen(true);
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

    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    アラート設定
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {[
                        { key: 'forget', label: '申請忘れアラート' },
                        { key: 'deadline', label: '申請締切アラート' },
                        { key: 'approvalDelay', label: '承認遅延アラート' },
                        { key: 'monthlySummary', label: '月次未申請サマリーアラート' }
                    ].map(alert => (
                        <Paper key={alert.key} sx={{ p: 2, mb: 1 }} variant="outlined">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={alertConfigs[alert.key].enabled}
                                        onChange={e => handleAlertChange(alert.key, 'enabled', e.target.checked)}
                                    />
                                    {alert.label}
                                </label>
                                <TextField
                                    label="毎月何日から"
                                    type="number"
                                    size="small"
                                    inputProps={{ min: 1, max: 31 }}
                                    value={alertConfigs[alert.key].day}
                                    onChange={e => handleAlertChange(alert.key, 'day', e.target.value)}
                                    sx={{ width: 120 }}
                                    disabled={!alertConfigs[alert.key].enabled}
                                />
                                <TextField
                                    label="最大送信回数"
                                    type="number"
                                    size="small"
                                    inputProps={{ min: 1, max: 10 }}
                                    value={alertConfigs[alert.key].max}
                                    onChange={e => handleAlertChange(alert.key, 'max', e.target.value)}
                                    sx={{ width: 140 }}
                                    disabled={!alertConfigs[alert.key].enabled}
                                />
                            </Box>
                        </Paper>
                    ))}
                    <Button variant="contained" color="primary" onClick={handleSave}>
                        保存
                    </Button>
                </Box>
            </Paper>
            <Snackbar open={open} autoHideDuration={3000} onClose={() => setOpen(false)}>
                <Alert severity="success" sx={{ width: '100%' }}>
                    設定を保存しました
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default ReminderSettings;
