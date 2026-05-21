import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';

const toneVisual = {
    error:   { bg: 'var(--accent-rose-soft)',   fg: 'var(--accent-rose)',   Icon: DeleteOutlineRoundedIcon },
    warning: { bg: 'var(--accent-amber-soft)',  fg: 'var(--accent-amber)',  Icon: WarningAmberRoundedIcon },
    primary: { bg: 'var(--accent-primary-soft)',fg: 'var(--accent-primary)',Icon: HelpOutlineRoundedIcon },
    info:    { bg: 'var(--accent-iris-soft)',   fg: 'var(--accent-iris)',   Icon: HelpOutlineRoundedIcon },
};

function AdminConfirmDialog({
    open,
    title,
    message,
    confirmLabel = '実行',
    cancelLabel = 'キャンセル',
    confirmColor = 'error',
    onCancel,
    onConfirm,
}) {
    const visual = toneVisual[confirmColor] || toneVisual.warning;
    const Icon = visual.Icon;
    return (
        <Dialog
            open={open}
            onClose={onCancel}
            maxWidth="xs"
            fullWidth
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 'var(--radius-md)',
                            display: 'grid',
                            placeItems: 'center',
                            background: visual.bg,
                            color: visual.fg,
                            flexShrink: 0,
                        }}
                    >
                        <Icon />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'var(--ink-primary)' }}>
                        {title}
                    </Typography>
                </Stack>
            </DialogTitle>
            <DialogContent sx={{ pt: 0 }}>
                <Typography variant="body2" sx={{ color: 'var(--ink-secondary)', lineHeight: 1.6 }}>
                    {message}
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button variant="text" color="inherit" onClick={onCancel} sx={{ color: 'var(--ink-tertiary)' }}>
                    {cancelLabel}
                </Button>
                <Button variant="contained" color={confirmColor} onClick={onConfirm}>
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AdminConfirmDialog;
