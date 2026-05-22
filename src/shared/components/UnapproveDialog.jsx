import { useState, useEffect } from 'react';
import {
    Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography,
} from '@mui/material';
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';

function UnapproveDialog({
    open,
    title = '承認を取り消しますか？',
    description = '取り消すと申請のステータスは「申請中」に戻り、関係者へ通知されます。',
    onCancel,
    onConfirm,
}) {
    const [reason, setReason] = useState('');
    const [touched, setTouched] = useState(false);

    useEffect(() => {
        if (open) {
            setReason('');
            setTouched(false);
        }
    }, [open]);

    const trimmed = reason.trim();
    const valid = trimmed.length > 0;

    const handleConfirm = () => {
        if (!valid) {
            setTouched(true);
            return;
        }
        onConfirm(trimmed);
    };

    return (
        <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ pb: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                        sx={{
                            width: 40, height: 40,
                            borderRadius: 'var(--radius-md)',
                            display: 'grid', placeItems: 'center',
                            background: 'var(--accent-amber-soft)',
                            color: 'var(--accent-amber)',
                            flexShrink: 0,
                        }}
                    >
                        <UndoRoundedIcon />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'var(--ink-primary)' }}>
                        {title}
                    </Typography>
                </Stack>
            </DialogTitle>
            <DialogContent sx={{ pt: 0 }}>
                <Typography variant="body2" sx={{ color: 'var(--ink-secondary)', lineHeight: 1.6, mb: 1.5 }}>
                    {description}
                </Typography>
                <TextField
                    autoFocus
                    fullWidth
                    multiline
                    minRows={2}
                    label="取消理由（必須）"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    onBlur={() => setTouched(true)}
                    error={touched && !valid}
                    helperText={touched && !valid ? '取消理由を入力してください' : '操作履歴に残り、承認者・申請者双方から参照できます。'}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button variant="text" color="inherit" onClick={onCancel} sx={{ color: 'var(--ink-tertiary)' }}>
                    キャンセル
                </Button>
                <Button variant="contained" color="warning" startIcon={<UndoRoundedIcon />} onClick={handleConfirm}>
                    承認を取り消す
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default UnapproveDialog;
