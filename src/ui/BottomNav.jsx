import { Box, Stack, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { usePendingCounts, tonePending } from './PendingPulse.jsx';

const tabs = [
    { id: 'home', label: 'ホーム', icon: DashboardRoundedIcon, kind: 'route', path: '/dashboard', match: ['/dashboard'] },
    { id: 'apply', label: '申請', icon: EditNoteRoundedIcon, kind: 'route', path: '/application', match: ['/application', '/leave-application', '/attendance-input'] },
    { id: 'approve', label: '承認', icon: TaskAltRoundedIcon, kind: 'route', path: '/approvals', match: ['/approvals', '/leave-approvals'] },
    { id: 'search', label: '検索', icon: SearchRoundedIcon, kind: 'action', match: [] },
];

export const BottomNav = ({ onOpenPalette }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const counts = usePendingCounts();

    const isActive = (tab) => tab.kind === 'route' && tab.match.some((p) => location.pathname === p || location.pathname.startsWith(`${p}/`));

    return (
        <Box
            component="nav"
            sx={{
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 30,
                paddingInline: 1,
                paddingBlock: 1,
                paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
                background: 'var(--surface-rail-top)',
                backdropFilter: 'blur(20px) saturate(140%)',
                WebkitBackdropFilter: 'blur(20px) saturate(140%)',
                borderTop: '1px solid var(--ink-line)',
                display: { xs: 'block', md: 'none' },
            }}
            aria-label="下部ナビゲーション"
        >
            <Stack direction="row" justifyContent="space-around">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = isActive(tab);
                    const badge = tab.id === 'approve' ? counts.expense + counts.leave : 0;
                    return (
                        <Box
                            key={tab.id}
                            component="button"
                            onClick={() => (tab.kind === 'action' ? onOpenPalette?.() : navigate(tab.path))}
                            sx={{
                                all: 'unset',
                                cursor: 'pointer',
                                minHeight: 56,
                                minWidth: 64,
                                paddingInline: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 0.25,
                                position: 'relative',
                                color: active ? 'var(--accent-primary)' : 'var(--ink-tertiary)',
                                transition: 'var(--motion-fast)',
                            }}
                            aria-label={tab.label}
                        >
                            <Box sx={{ position: 'relative' }}>
                                <Icon sx={{ fontSize: 22 }} />
                                {badge > 0 && (() => {
                                    const t = tonePending(badge);
                                    return (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                top: -4,
                                                right: -10,
                                                minWidth: 16,
                                                height: 16,
                                                paddingInline: 0.5,
                                                borderRadius: 'var(--radius-pill)',
                                                background: t.solid,
                                                color: '#fff',
                                                fontSize: 10,
                                                fontWeight: 800,
                                                display: 'grid',
                                                placeItems: 'center',
                                            }}
                                        >
                                            {badge}
                                        </Box>
                                    );
                                })()}
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 11, lineHeight: 1 }}>
                                {tab.label}
                            </Typography>
                            {active && (
                                <Box
                                    aria-hidden
                                    sx={{
                                        position: 'absolute',
                                        top: 4,
                                        height: 3,
                                        width: 24,
                                        borderRadius: 2,
                                        background: 'var(--accent-primary)',
                                    }}
                                />
                            )}
                        </Box>
                    );
                })}
            </Stack>
        </Box>
    );
};

export default BottomNav;
