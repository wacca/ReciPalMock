import { Box } from '@mui/material';
import { statusBarColor } from './StatusChip.jsx';

export const ApplicationCard = ({ statusKey, onClick, children, sx, hoverable = true }) => (
    <Box
        onClick={onClick}
        sx={{
            position: 'relative',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--surface-raised)',
            boxShadow: 'var(--shadow-1)',
            overflow: 'hidden',
            transition: 'var(--motion-fast)',
            cursor: onClick ? 'pointer' : 'default',
            ...(hoverable && { '&:hover': { boxShadow: 'var(--shadow-2)' } }),
            ...sx,
        }}
    >
        <Box
            aria-hidden
            sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 4,
                background: statusBarColor(statusKey),
            }}
        />
        {children}
    </Box>
);

export default ApplicationCard;
