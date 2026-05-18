import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

function AdminConfirmDialog({
    open,
    title,
    message,
    confirmLabel = '実行',
    confirmColor = 'error',
    onCancel,
    onConfirm,
}) {
    return (
        <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary">
                    {message}
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button variant="outlined" color="inherit" onClick={onCancel}>
                    キャンセル
                </Button>
                <Button variant="contained" color={confirmColor} onClick={onConfirm}>
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AdminConfirmDialog;
