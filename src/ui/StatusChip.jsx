import { Box, Stack, Typography } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded';
import DraftsRoundedIcon from '@mui/icons-material/DraftsRounded';

const statusMap = {
    pending:   { label: '申請中',   bg: 'var(--accent-iris-soft)',   fg: 'var(--accent-iris)',   icon: HourglassTopRoundedIcon },
    approved:  { label: '承認済',   bg: 'var(--accent-leaf-soft)',   fg: 'var(--accent-leaf)',   icon: CheckCircleRoundedIcon },
    rejected:  { label: '差戻し',   bg: 'var(--accent-rose-soft)',   fg: 'var(--accent-rose)',   icon: AssignmentReturnRoundedIcon },
    cancelled: { label: '取消',     bg: 'var(--accent-slate-soft)',  fg: 'var(--accent-slate)',  icon: RemoveCircleOutlineRoundedIcon },
    draft:     { label: '下書き',   bg: 'var(--surface-sunken)',     fg: 'var(--ink-tertiary)',  icon: DraftsRoundedIcon },
    active:    { label: '有効',     bg: 'var(--accent-primary-soft)',fg: 'var(--accent-primary)',icon: CheckCircleRoundedIcon },
    inactive:  { label: '無効',     bg: 'var(--accent-slate-soft)',  fg: 'var(--accent-slate)',  icon: RemoveCircleOutlineRoundedIcon },
};

const aliasMap = {
    '申請中': 'pending', '承認済': 'approved', '差戻し': 'rejected', '非承認': 'rejected', '却下': 'rejected',
    '取消': 'cancelled', '取り消し': 'cancelled', '下書き': 'draft',
    '有効': 'active', '無効': 'inactive',
};

const resolveKey = (status) => {
    if (!status) return 'pending';
    if (statusMap[status]) return status;
    if (aliasMap[status]) return aliasMap[status];
    return 'pending';
};

export const StatusChip = ({ status, label, size = 'md', sx }) => {
    const key = resolveKey(status);
    const cfg = statusMap[key];
    const Icon = cfg.icon;
    const dims = size === 'sm'
        ? { iconSize: 14, padY: 2, padX: 8, font: 11.5 }
        : { iconSize: 16, padY: 4, padX: 10, font: 12.5 };
    return (
        <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{
                display: 'inline-flex',
                background: cfg.bg,
                color: cfg.fg,
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
            <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 'inherit', lineHeight: 'inherit' }}>
                {label ?? cfg.label}
            </Typography>
        </Stack>
    );
};

export const statusBarColor = (status) => {
    const cfg = statusMap[resolveKey(status)];
    return cfg.fg;
};

export const StatusBar = ({ status, width = 4 }) => (
    <Box
        aria-hidden
        sx={{
            width,
            borderRadius: 'var(--radius-pill)',
            background: statusBarColor(status),
            alignSelf: 'stretch',
            flexShrink: 0,
        }}
    />
);

export default StatusChip;
