import { Box, Stack, Typography } from '@mui/material';

export const PageScaffold = ({
    eyebrow,
    title,
    subtitle,
    actions,
    children,
    sx,
    headline,
}) => (
    <Box
        sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: headline ? 2 : 3,
            width: '100%',
            maxWidth: 'var(--page-max-w)',
            marginInline: 'auto',
            animation: 'recrovaFloatIn 220ms cubic-bezier(.2,.8,.2,1)',
            ...sx,
        }}
    >
        {headline ? (
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                justifyContent="space-between"
                gap={{ xs: 1, sm: 2 }}
            >
                <Typography
                    component="p"
                    sx={{
                        fontSize: { xs: 13, md: 14 },
                        fontWeight: 600,
                        color: 'var(--ink-secondary)',
                        lineHeight: 1.4,
                        m: 0,
                    }}
                >
                    {headline}
                </Typography>
                {actions && (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0, flexWrap: 'wrap' }}>
                        {actions}
                    </Stack>
                )}
            </Stack>
        ) : (
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                alignItems={{ xs: 'stretch', md: 'flex-end' }}
                justifyContent="space-between"
                gap={{ xs: 2, md: 3 }}
            >
                <Box sx={{ minWidth: 0 }}>
                    {eyebrow && (
                        <Typography
                            variant="overline"
                            sx={{
                                color: 'var(--accent-primary)',
                                fontWeight: 700,
                                display: 'block',
                                mb: 0.5,
                            }}
                        >
                            {eyebrow}
                        </Typography>
                    )}
                    <Typography component="h1" variant="h4" sx={{ fontSize: { xs: 22, md: 28 }, lineHeight: 1.2, color: 'var(--ink-primary)', m: 0 }}>
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="body2" sx={{ color: 'var(--ink-tertiary)', mt: 0.5, maxWidth: 720 }}>
                            {subtitle}
                        </Typography>
                    )}
                </Box>
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

export default PageScaffold;
