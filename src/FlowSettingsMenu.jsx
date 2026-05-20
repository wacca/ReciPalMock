import { Box, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import PageScaffold from './ui/PageScaffold.jsx';

const choices = [
    {
        path: '/approval-flow-settings',
        icon: <AccountTreeRoundedIcon />,
        tone: { bg: 'var(--accent-primary-soft)', fg: 'var(--accent-primary)' },
        title: '経費 承認フロー',
        description: '経費申請の個人・部署別フローを編集します。',
    },
    {
        path: '/leave-approval-flow-settings',
        icon: <EventAvailableRoundedIcon />,
        tone: { bg: 'var(--accent-iris-soft)', fg: 'var(--accent-iris)' },
        title: '勤怠申請 承認フロー',
        description: '勤怠申請（休暇・時間休・遅刻・早退）の承認者と順序を編集します。',
    },
];

function FlowSettingsMenu() {
    const navigate = useNavigate();
    return (
        <PageScaffold
            eyebrow="管理"
            title="申請フロー設定"
            subtitle="申請種別ごとの承認経路を設定します。組織変更時はこちらから整えます。"
        >
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                    gap: 2.5,
                }}
            >
                {choices.map((c) => (
                    <Box
                        key={c.path}
                        component="button"
                        onClick={() => navigate(c.path)}
                        sx={{
                            all: 'unset',
                            cursor: 'pointer',
                            position: 'relative',
                            padding: 3,
                            borderRadius: 'var(--radius-xl)',
                            background: 'var(--surface-raised)',
                            boxShadow: 'var(--shadow-1)',
                            transition: 'var(--motion-base)',
                            minHeight: 140,
                            overflow: 'hidden',
                            '&:hover': {
                                transform: 'translateY(-3px)',
                                boxShadow: 'var(--shadow-2)',
                            },
                            '&:focus-visible': { outline: 'none', boxShadow: 'var(--shadow-glow)' },
                        }}
                    >
                        <Box
                            aria-hidden
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                background: `linear-gradient(135deg, ${c.tone.bg} 0%, transparent 65%)`,
                                opacity: 0.6,
                                pointerEvents: 'none',
                            }}
                        />
                        <Stack direction="row" alignItems="center" spacing={2.5} sx={{ position: 'relative' }}>
                            <Box
                                sx={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 'var(--radius-lg)',
                                    background: 'var(--surface-raised)',
                                    color: c.tone.fg,
                                    display: 'grid',
                                    placeItems: 'center',
                                    boxShadow: 'var(--shadow-1)',
                                    flexShrink: 0,
                                    '& svg': { fontSize: 28 },
                                }}
                            >
                                {c.icon}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'var(--ink-primary)' }}>
                                    {c.title}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'var(--ink-secondary)', mt: 0.5 }}>
                                    {c.description}
                                </Typography>
                            </Box>
                            <ArrowForwardRoundedIcon sx={{ color: c.tone.fg }} />
                        </Stack>
                    </Box>
                ))}
            </Box>
        </PageScaffold>
    );
}

export default FlowSettingsMenu;
