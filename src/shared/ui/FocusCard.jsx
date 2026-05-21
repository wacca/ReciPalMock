import { Box, Button, Stack, Typography } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useUiPreferences } from './UiPreferencesContext.jsx';

export const FocusCard = ({
    eyebrow = '今フォーカスすると効率的',
    title,
    description,
    cta,
    onAction,
    icon,
    accent = 'primary',
    secondaryActions,
}) => {
    const { prefs } = useUiPreferences();
    const isCompact = prefs?.density === 'compact';
    const showEyebrow = !isCompact && Boolean(eyebrow);
    const showDescription = !isCompact && Boolean(description);

    const tone = accent === 'iris'
        ? { soft: 'var(--accent-iris-soft)', solid: 'var(--accent-iris)', ink: 'var(--accent-iris)' }
        : accent === 'amber'
            ? { soft: 'var(--accent-amber-soft)', solid: 'var(--accent-amber)', ink: 'var(--accent-amber)' }
            : { soft: 'var(--accent-primary-soft)', solid: 'var(--accent-primary)', ink: 'var(--accent-primary-ink)' };

    return (
        <Box
            sx={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 'var(--radius-xl)',
                background: `linear-gradient(135deg, ${tone.soft} 0%, var(--surface-raised) 70%)`,
                boxShadow: 'var(--shadow-2)',
                padding: isCompact ? { xs: 2.25, md: 2.75 } : { xs: 3, md: 4 },
            }}
        >
            <Box
                aria-hidden
                sx={{
                    position: 'absolute',
                    right: -60,
                    top: -60,
                    width: 220,
                    height: 220,
                    borderRadius: '50%',
                    background: tone.solid,
                    opacity: 0.10,
                    filter: 'blur(8px)',
                    transform: 'translateZ(0)',
                    willChange: 'filter',
                }}
            />
            <Box
                aria-hidden
                sx={{
                    position: 'absolute',
                    left: -40,
                    bottom: -40,
                    width: 160,
                    height: 160,
                    borderRadius: '50%',
                    background: tone.solid,
                    opacity: 0.06,
                    filter: 'blur(6px)',
                    transform: 'translateZ(0)',
                    willChange: 'filter',
                }}
            />
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={3}
                alignItems={{ xs: 'flex-start', md: 'center' }}
                justifyContent="space-between"
                sx={{ position: 'relative' }}
            >
                <Stack direction="row" spacing={2.5} alignItems="center" sx={{ minWidth: 0 }}>
                    {icon && (
                        <Box
                            sx={{
                                width: isCompact ? 44 : 56,
                                height: isCompact ? 44 : 56,
                                borderRadius: 'var(--radius-lg)',
                                display: 'grid',
                                placeItems: 'center',
                                background: 'var(--surface-raised)',
                                color: tone.solid,
                                boxShadow: 'var(--shadow-1)',
                                flexShrink: 0,
                                '& svg': { fontSize: isCompact ? 24 : 30 },
                            }}
                        >
                            {icon}
                        </Box>
                    )}
                    <Box sx={{ minWidth: 0 }}>
                        {showEyebrow && (
                            <Typography
                                variant="overline"
                                sx={{ color: tone.ink, fontWeight: 700, letterSpacing: 1.2 }}
                            >
                                {eyebrow}
                            </Typography>
                        )}
                        <Typography
                            component="h2"
                            variant="h5"
                            sx={{
                                fontWeight: 700,
                                lineHeight: 1.2,
                                color: 'var(--ink-primary)',
                                mt: showEyebrow ? 0.5 : 0,
                                m: 0,
                                fontSize: isCompact ? { xs: 17, md: 19 } : { xs: 20, md: 24 },
                            }}
                        >
                            {title}
                        </Typography>
                        {showDescription && (
                            <Typography variant="body2" sx={{ color: 'var(--ink-secondary)', mt: 0.75, maxWidth: 720 }}>
                                {description}
                            </Typography>
                        )}
                    </Box>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexShrink: 0, flexWrap: 'wrap' }}>
                    {secondaryActions}
                    {cta && (
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            onClick={onAction}
                            endIcon={<ArrowForwardRoundedIcon />}
                            sx={{
                                minHeight: 48,
                                paddingInline: 3,
                                borderRadius: 'var(--radius-pill)',
                                background: tone.solid,
                                '&:hover': { background: tone.solid, filter: 'brightness(1.05)' },
                            }}
                        >
                            {cta}
                        </Button>
                    )}
                </Stack>
            </Stack>
        </Box>
    );
};

export default FocusCard;
