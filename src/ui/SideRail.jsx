import { Box, Drawer, Stack, Tooltip, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePendingCounts } from './PendingPulse.jsx';
import { useUiPreferences } from './UiPreferencesContext.jsx';

export const SideRailLogo = () => (
    <Stack direction="row" alignItems="center" spacing={1.25}>
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="rc-grad" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="var(--accent-primary)" />
                    <stop offset="1" stopColor="var(--accent-iris)" />
                </linearGradient>
            </defs>
            <rect x="0" y="0" width="34" height="34" rx="10" fill="url(#rc-grad)" />
            <path d="M11 22.5c0-4.5 2.5-8 6-8s6 3.5 6 8" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <circle cx="17" cy="13.5" r="3.3" fill="white" />
            <path d="M12.4 10.5c1.4-2.3 7.8-2.3 9.2 0" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </svg>
        <Stack sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, letterSpacing: 0.3, color: 'var(--ink-primary)', lineHeight: 1 }}>
                Recrova
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', fontWeight: 600, lineHeight: 1.1 }}>
                働く脳のためのHR
            </Typography>
        </Stack>
    </Stack>
);

export const SideRailContent = ({ groups, matchesPath, onNavigate, location }) => {
    const counts = usePendingCounts();

    const badgeFor = (path) => {
        if (path === '/approvals') return counts.expense;
        if (path === '/leave-approvals') return counts.leave;
        return 0;
    };

    return (
        <Stack
            sx={{
                height: '100%',
                paddingBlock: 2,
                paddingInline: 1.5,
                background: 'var(--surface-sunken)',
                gap: 2.5,
                overflowY: 'auto',
            }}
        >
            <Box sx={{ paddingInline: 1, paddingBlock: 1 }}>
                <SideRailLogo />
            </Box>
            {groups.map((group) => (
                <Box key={group.title}>
                    <Typography
                        variant="caption"
                        sx={{
                            paddingInline: 1.5,
                            color: 'var(--ink-muted)',
                            fontWeight: 700,
                            letterSpacing: 1.4,
                            textTransform: 'uppercase',
                            display: 'block',
                            mb: 0.75,
                        }}
                    >
                        {group.title}
                    </Typography>
                    <Stack spacing={0.5}>
                        {group.items.map((item) => {
                            const isActive = matchesPath(item, location.pathname);
                            const badge = badgeFor(item.path);
                            return (
                                <Tooltip key={item.path} title={item.subtitle || ''} placement="right" arrow>
                                    <Box
                                        component="button"
                                        onClick={() => onNavigate(item.path)}
                                        sx={{
                                            all: 'unset',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.25,
                                            paddingBlock: 1,
                                            paddingInline: 1.5,
                                            borderRadius: 'var(--radius-md)',
                                            color: isActive ? 'var(--accent-primary)' : 'var(--ink-secondary)',
                                            background: isActive ? 'var(--accent-primary-soft)' : 'transparent',
                                            position: 'relative',
                                            transition: 'var(--motion-fast)',
                                            fontWeight: isActive ? 700 : 500,
                                            fontSize: 14,
                                            minHeight: 40,
                                            '&:hover': {
                                                background: isActive ? 'var(--accent-primary-soft)' : 'var(--surface-raised)',
                                                color: 'var(--ink-primary)',
                                            },
                                            '&::before': isActive
                                                ? {
                                                      content: '""',
                                                      position: 'absolute',
                                                      left: -8,
                                                      top: 8,
                                                      bottom: 8,
                                                      width: 4,
                                                      borderRadius: 'var(--radius-pill)',
                                                      background: 'var(--accent-primary)',
                                                  }
                                                : undefined,
                                        }}
                                    >
                                        <Box
                                            aria-hidden
                                            sx={{
                                                display: 'grid',
                                                placeItems: 'center',
                                                width: 28,
                                                height: 28,
                                                borderRadius: 'var(--radius-sm)',
                                                color: 'inherit',
                                                background: isActive ? 'var(--surface-raised)' : 'transparent',
                                                transition: 'var(--motion-fast)',
                                                '& svg': { fontSize: 18 },
                                            }}
                                        >
                                            {item.icon}
                                        </Box>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography
                                                component="span"
                                                sx={{
                                                    display: 'block',
                                                    fontWeight: 'inherit',
                                                    fontSize: 14,
                                                    lineHeight: 1.2,
                                                    color: 'inherit',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                            >
                                                {item.label}
                                            </Typography>
                                        </Box>
                                        {badge > 0 && (
                                            <Box
                                                aria-label={`${badge}件の承認待ち`}
                                                sx={{
                                                    minWidth: 22,
                                                    height: 22,
                                                    paddingInline: 0.75,
                                                    borderRadius: 'var(--radius-pill)',
                                                    background: 'var(--accent-amber)',
                                                    color: '#fff',
                                                    display: 'grid',
                                                    placeItems: 'center',
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {badge}
                                            </Box>
                                        )}
                                    </Box>
                                </Tooltip>
                            );
                        })}
                    </Stack>
                </Box>
            ))}
        </Stack>
    );
};

export const SideRail = ({ groups, matchesPath, mobileOpen, onMobileClose, isDesktop, drawerWidth = 248 }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { prefs } = useUiPreferences();

    const handleNavigate = (path) => {
        navigate(path);
        if (!isDesktop) onMobileClose?.();
    };

    const content = (
        <SideRailContent
            groups={groups}
            matchesPath={matchesPath}
            onNavigate={handleNavigate}
            location={location}
        />
    );

    const width = prefs.density === 'compact' ? 220 : drawerWidth;

    if (isDesktop) {
        return (
            <Box
                component="aside"
                sx={{
                    width,
                    flexShrink: 0,
                    height: '100vh',
                    position: 'sticky',
                    top: 0,
                    background: 'var(--surface-sunken)',
                }}
            >
                {content}
            </Box>
        );
    }

    return (
        <Drawer
            anchor="left"
            open={mobileOpen}
            onClose={onMobileClose}
            ModalProps={{ keepMounted: true }}
            PaperProps={{
                sx: {
                    width: 280,
                    background: 'var(--surface-sunken)',
                    backgroundImage: 'none',
                    border: 'none',
                },
            }}
        >
            {content}
        </Drawer>
    );
};

export default SideRail;
