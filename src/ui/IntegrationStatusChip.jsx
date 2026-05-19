import { Stack, Typography } from '@mui/material';
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded';
import CloudSyncRoundedIcon from '@mui/icons-material/CloudSyncRounded';
import CloudOffRoundedIcon from '@mui/icons-material/CloudOffRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';

export const INTEGRATION_STATUS = {
    not_applicable: { label: '連携対象外', bg: 'transparent', fg: 'var(--ink-muted)',     border: 'var(--surface-border)', icon: CloudOffRoundedIcon },
    pending:        { label: '連携待ち',   bg: 'var(--accent-amber-soft)', fg: 'var(--accent-amber)', border: 'transparent', icon: CloudSyncRoundedIcon },
    synced:         { label: '連携済',     bg: 'var(--accent-leaf-soft)',  fg: 'var(--accent-leaf)',  border: 'transparent', icon: CloudDoneRoundedIcon },
    error:          { label: '連携エラー', bg: 'var(--accent-rose-soft)',  fg: 'var(--accent-rose)',  border: 'transparent', icon: ErrorOutlineRoundedIcon },
    closed:         { label: '締め済',     bg: 'var(--accent-slate-soft)', fg: 'var(--accent-slate)', border: 'transparent', icon: LockRoundedIcon },
};

export const INTEGRATION_TARGET_LABELS = {
    expense: '経費 SaaS',
    leave: '勤怠 SaaS',
    attendance: '給与 SaaS',
};

export const IntegrationStatusChip = ({ status = 'not_applicable', target, size = 'md', sx, showLabel = true }) => {
    const cfg = INTEGRATION_STATUS[status] || INTEGRATION_STATUS.not_applicable;
    const Icon = cfg.icon;
    const dims = size === 'sm'
        ? { iconSize: 13, padY: 2, padX: 7, font: 11 }
        : { iconSize: 15, padY: 3, padX: 9, font: 12 };
    const baseLabel = cfg.label;
    const fullLabel = target && status !== 'not_applicable'
        ? `${INTEGRATION_TARGET_LABELS[target] || target} ${baseLabel}`
        : baseLabel;
    return (
        <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{
                display: 'inline-flex',
                background: cfg.bg,
                color: cfg.fg,
                border: cfg.border === 'transparent' ? 'none' : `1px solid ${cfg.border}`,
                borderRadius: 'var(--radius-pill)',
                paddingInline: `${dims.padX}px`,
                paddingBlock: `${dims.padY}px`,
                fontSize: dims.font,
                fontWeight: 700,
                lineHeight: 1,
                whiteSpace: 'nowrap',
                ...sx,
            }}
        >
            <Icon sx={{ fontSize: dims.iconSize }} />
            {showLabel && (
                <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 'inherit', lineHeight: 'inherit' }}>
                    {fullLabel}
                </Typography>
            )}
        </Stack>
    );
};

export default IntegrationStatusChip;
