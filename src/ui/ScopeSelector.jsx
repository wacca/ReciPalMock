import { ToggleButton, ToggleButtonGroup, Stack, Typography } from '@mui/material';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import CorporateFareRoundedIcon from '@mui/icons-material/CorporateFareRounded';

export const SCOPE_OPTIONS = [
    { value: 'self', label: '自分', icon: <PersonRoundedIcon fontSize="small" /> },
    { value: 'department', label: '部署', icon: <GroupRoundedIcon fontSize="small" /> },
    { value: 'all', label: '全社', icon: <CorporateFareRoundedIcon fontSize="small" /> },
];

export const filterByScope = (rows, { scope, userId, department }) => {
    if (scope === 'self') return rows.filter((row) => row.applicantId === userId);
    if (scope === 'department') return rows.filter((row) => row.applicantDepartment === department);
    return rows;
};

const ScopeSelector = ({ value, onChange, hint, options = SCOPE_OPTIONS }) => (
    <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
        <ToggleButtonGroup
            exclusive
            size="small"
            value={value}
            onChange={(_, next) => { if (next) onChange(next); }}
            sx={{
                background: 'var(--surface-raised)',
                borderRadius: 'var(--radius-pill)',
                padding: 0.5,
                boxShadow: 'var(--shadow-1)',
                '& .MuiToggleButton-root': {
                    border: 0,
                    borderRadius: 'var(--radius-pill) !important',
                    paddingInline: 1.75,
                    paddingBlock: 0.5,
                    color: 'var(--ink-tertiary)',
                    fontWeight: 700,
                    fontSize: 12.5,
                    gap: 0.5,
                    '&.Mui-selected': {
                        background: 'var(--accent-primary)',
                        color: 'var(--surface-raised)',
                        '&:hover': { background: 'var(--accent-primary)' },
                    },
                },
            }}
        >
            {options.map((opt) => (
                <ToggleButton key={opt.value} value={opt.value}>
                    {opt.icon}
                    {opt.label}
                </ToggleButton>
            ))}
        </ToggleButtonGroup>
        {hint && (
            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                {hint}
            </Typography>
        )}
    </Stack>
);

export default ScopeSelector;
