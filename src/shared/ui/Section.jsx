import { Box, Stack, Typography } from '@mui/material';

const toneMap = {
    raised: { bg: 'var(--surface-raised)', accent: null },
    sunken: { bg: 'var(--surface-sunken)', accent: null },
    primary: { bg: 'var(--accent-primary-soft)', accent: 'var(--accent-primary)' },
    iris: { bg: 'var(--accent-iris-soft)', accent: 'var(--accent-iris)' },
    amber: { bg: 'var(--accent-amber-soft)', accent: 'var(--accent-amber)' },
    leaf: { bg: 'var(--accent-leaf-soft)', accent: 'var(--accent-leaf)' },
};

export const Section = ({
    title,
    subtitle,
    actions,
    tone = 'raised',
    padded = true,
    children,
    sx,
    headerSx,
    elevation = 1,
    icon,
}) => {
    const t = toneMap[tone] || toneMap.raised;
    const shadowMap = { 0: 'none', 1: 'var(--shadow-1)', 2: 'var(--shadow-2)', 3: 'var(--shadow-3)' };
    return (
        <Box
            sx={{
                background: t.bg,
                borderRadius: 'var(--radius-lg)',
                boxShadow: shadowMap[elevation] ?? shadowMap[1],
                padding: padded ? { xs: 2, md: 3 } : 0,
                position: 'relative',
                overflow: 'hidden',
                ...sx,
            }}
        >
            {t.accent && (
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: 'none',
                        borderTop: `2px solid ${t.accent}`,
                        borderRadius: 'inherit',
                        opacity: 0.7,
                    }}
                />
            )}
            {(title || actions) && (
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    justifyContent="space-between"
                    gap={{ xs: 1, sm: 2 }}
                    sx={{ mb: padded ? 2 : 0, ...headerSx }}
                >
                    <Stack direction="row" gap={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                        {icon && (
                            <Box
                                sx={{
                                    width: 36,
                                    height: 36,
                                    display: 'grid',
                                    placeItems: 'center',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--accent-primary-soft)',
                                    color: 'var(--accent-primary)',
                                    flexShrink: 0,
                                }}
                            >
                                {icon}
                            </Box>
                        )}
                        <Box sx={{ minWidth: 0 }}>
                            {title && (
                                <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700, color: 'var(--ink-primary)', m: 0 }}>
                                    {title}
                                </Typography>
                            )}
                            {subtitle && (
                                <Typography variant="body2" sx={{ color: 'var(--ink-tertiary)' }}>
                                    {subtitle}
                                </Typography>
                            )}
                        </Box>
                    </Stack>
                    {actions && (
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0, flexWrap: 'wrap' }}>
                            {actions}
                        </Stack>
                    )}
                </Stack>
            )}
            {children}
        </Box>
    );
};

export default Section;
