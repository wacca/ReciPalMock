import { useMemo } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import PunchClockRoundedIcon from '@mui/icons-material/PunchClockRounded';
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

import PageScaffold from './ui/PageScaffold.jsx';
import Section from './ui/Section.jsx';
import FocusCard from './ui/FocusCard.jsx';
import { KeyHint } from './ui/KeyHint.jsx';
import { usePendingCounts } from './ui/PendingPulse.jsx';

const greetingByHour = () => {
    const h = new Date().getHours();
    if (h < 5) return 'お疲れさまです';
    if (h < 11) return 'おはようございます';
    if (h < 17) return 'こんにちは';
    return 'お疲れさまです';
};

const focusCandidate = ({ counts }) => {
    const h = new Date().getHours();
    const day = new Date().getDate();
    const monthEnd = day >= 25;

    if (counts.expense + counts.leave >= 3) {
        return {
            key: 'approve',
            eyebrow: '承認待ちが溜まっています',
            title: `承認待ちが ${counts.expense + counts.leave} 件あります`,
            description: '滞りなく業務を回すため、まずは承認を片付けるのが効率的です。',
            cta: '承認画面へ',
            path: counts.expense >= counts.leave ? '/approvals' : '/leave-approvals',
            icon: <FactCheckRoundedIcon />,
            accent: 'amber',
        };
    }
    if (monthEnd) {
        return {
            key: 'expense',
            eyebrow: '月末の経費まとめ',
            title: '今月分の経費申請を仕上げましょう',
            description: '締め日が近づいています。下書きを開いて、領収書と金額をチェック。',
            cta: '経費申請を開く',
            path: '/application',
            icon: <RequestQuoteRoundedIcon />,
            accent: 'primary',
        };
    }
    if (h < 11) {
        return {
            key: 'attendance',
            eyebrow: '今日の入口',
            title: '勤怠を入力して一日を始めましょう',
            description: '前日までの未入力があれば一括反映で素早く整えられます。',
            cta: '勤怠入力へ',
            path: '/attendance-input',
            icon: <PunchClockRoundedIcon />,
            accent: 'primary',
        };
    }
    return {
        key: 'expense',
        eyebrow: '今日できる小さな一歩',
        title: '経費の下書きを進めましょう',
        description: '記憶が鮮明な今日のうちに、明細だけでも作っておくと後がラクです。',
        cta: '経費申請を開く',
        path: '/application',
        icon: <RequestQuoteRoundedIcon />,
        accent: 'iris',
    };
};

const buildPrimaryActions = (counts) => [
    {
        title: '勤怠を入力',
        description: '今月のタイムシート',
        path: '/attendance-input',
        icon: <PunchClockRoundedIcon />,
        tone: 'primary',
    },
    {
        title: '経費を申請',
        description: '領収書付きで下書き保存',
        path: '/application',
        state: { startNew: true },
        icon: <RequestQuoteRoundedIcon />,
        tone: 'iris',
    },
    {
        title: '休暇を申請',
        description: '有給・遅刻・早退',
        path: '/leave-application',
        state: { startNew: true },
        icon: <EventAvailableRoundedIcon />,
        tone: 'amber',
    },
    {
        title: '経費承認',
        description: counts.expense > 0 ? `${counts.expense}件の承認待ち` : '承認待ちなし',
        path: '/approvals',
        icon: <FactCheckRoundedIcon />,
        tone: 'leaf',
        badge: counts.expense,
    },
    {
        title: '休暇承認',
        description: counts.leave > 0 ? `${counts.leave}件の承認待ち` : '承認待ちなし',
        path: '/leave-approvals',
        icon: <HowToRegRoundedIcon />,
        tone: 'leaf',
        badge: counts.leave,
    },
];

const adminItems = [
    ['申請フロー設定', '/flow-settings-menu'],
    ['アラート設定', '/reminder-settings'],
    ['アカウント管理', '/account-management'],
    ['マスタ管理', '/master-settings'],
    ['権限設定', '/permission-settings'],
];

const tones = {
    primary: { bg: 'var(--accent-primary-soft)', fg: 'var(--accent-primary)' },
    iris:    { bg: 'var(--accent-iris-soft)',    fg: 'var(--accent-iris)' },
    amber:   { bg: 'var(--accent-amber-soft)',   fg: 'var(--accent-amber)' },
    leaf:    { bg: 'var(--accent-leaf-soft)',    fg: 'var(--accent-leaf)' },
};

function Dashboard({ username = '' }) {
    const navigate = useNavigate();
    const counts = usePendingCounts();

    const focus = useMemo(() => focusCandidate({ counts }), [counts]);

    const metrics = [
        { label: '承認待ち 経費', value: counts.expense, unit: '件', tone: counts.expense ? 'amber' : 'leaf' },
        { label: '承認待ち 休暇', value: counts.leave,   unit: '件', tone: counts.leave   ? 'amber' : 'leaf' },
        { label: '進行中 下書き', value: counts.drafts,  unit: '件', tone: 'iris' },
        {
            label: '本日',
            value: new Date().toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' }),
            unit: '',
            tone: 'primary',
        },
    ];

    return (
        <PageScaffold
            eyebrow={greetingByHour()}
            title={username ? `${username}さん、おかえりなさい` : 'おかえりなさい'}
            subtitle="今やるべきことを一つに絞ってお見せします。落ち着いて、目の前のひとつから。"
        >
            <FocusCard
                eyebrow={focus.eyebrow}
                title={focus.title}
                description={focus.description}
                cta={focus.cta}
                icon={focus.icon}
                accent={focus.accent}
                onAction={() => navigate(focus.path, focus.state ? { state: focus.state } : undefined)}
            />

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
                    gap: 2,
                }}
            >
                {metrics.map((m) => {
                    const tone = tones[m.tone];
                    return (
                        <Box
                            key={m.label}
                            sx={{
                                padding: 2.25,
                                borderRadius: 'var(--radius-lg)',
                                background: 'var(--surface-raised)',
                                boxShadow: 'var(--shadow-1)',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            <Box
                                aria-hidden
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: 3,
                                    bottom: 0,
                                    background: tone.fg,
                                    opacity: 0.7,
                                }}
                            />
                            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', fontWeight: 700, letterSpacing: 0.6 }}>
                                {m.label}
                            </Typography>
                            <Stack direction="row" alignItems="baseline" spacing={0.75} sx={{ mt: 0.5 }}>
                                <Typography
                                    sx={{
                                        fontSize: typeof m.value === 'number' ? 32 : 18,
                                        fontWeight: 800,
                                        lineHeight: 1,
                                        color: tone.fg,
                                        fontVariantNumeric: 'tabular-nums',
                                    }}
                                >
                                    {m.value}
                                </Typography>
                                {m.unit && (
                                    <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', fontWeight: 600 }}>
                                        {m.unit}
                                    </Typography>
                                )}
                            </Stack>
                        </Box>
                    );
                })}
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.4fr) minmax(0, 1fr)' },
                    gap: 3,
                }}
            >
                <Section
                    title="主要アクション"
                    subtitle="迷ったらここから。脳のステップを1つに絞ります。"
                    actions={<KeyHint keys={['Mod', 'K']} />}
                >
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' },
                            gap: 1.5,
                        }}
                    >
                        {buildPrimaryActions(counts).map((action, idx) => {
                            const tone = tones[action.tone];
                            const badge = action.badge;
                            return (
                                <Box
                                    key={action.title}
                                    component="button"
                                    onClick={() => navigate(action.path, action.state ? { state: action.state } : undefined)}
                                    sx={{
                                        all: 'unset',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        padding: 2,
                                        borderRadius: 'var(--radius-lg)',
                                        background: 'var(--surface-raised)',
                                        boxShadow: 'var(--shadow-1)',
                                        transition: 'var(--motion-base)',
                                        minHeight: 96,
                                        position: 'relative',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: 'var(--shadow-2)',
                                        },
                                        '&:focus-visible': {
                                            outline: 'none',
                                            boxShadow: 'var(--shadow-glow)',
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 'var(--radius-md)',
                                            background: tone.bg,
                                            color: tone.fg,
                                            display: 'grid',
                                            placeItems: 'center',
                                            flexShrink: 0,
                                            position: 'relative',
                                            '& svg': { fontSize: 22 },
                                        }}
                                    >
                                        {action.icon}
                                        {badge > 0 && (
                                            <Box
                                                aria-label={`${badge}件の承認待ち`}
                                                sx={{
                                                    position: 'absolute',
                                                    top: -6,
                                                    right: -6,
                                                    minWidth: 20,
                                                    height: 20,
                                                    paddingInline: 0.5,
                                                    borderRadius: 'var(--radius-pill)',
                                                    background: 'var(--accent-amber)',
                                                    color: '#fff',
                                                    fontSize: 11,
                                                    fontWeight: 800,
                                                    display: 'grid',
                                                    placeItems: 'center',
                                                    boxShadow: 'var(--shadow-1)',
                                                    animation: 'recrovaPulse 1800ms ease-in-out infinite',
                                                }}
                                            >
                                                {badge}
                                            </Box>
                                        )}
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                                        <Stack direction="row" alignItems="center" spacing={0.75}>
                                            <Typography sx={{ fontWeight: 700, color: 'var(--ink-primary)' }}>
                                                {action.title}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: 'var(--ink-muted)',
                                                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                                                    fontSize: 10,
                                                }}
                                            >
                                                {idx + 1}
                                            </Typography>
                                        </Stack>
                                        <Typography variant="body2" sx={{
                                            color: badge > 0 ? 'var(--accent-amber)' : 'var(--ink-tertiary)',
                                            fontWeight: badge > 0 ? 600 : 400,
                                        }}>
                                            {action.description}
                                        </Typography>
                                    </Box>
                                    <ArrowForwardRoundedIcon
                                        sx={{
                                            color: 'var(--ink-muted)',
                                            transition: 'var(--motion-fast)',
                                            'button:hover &': { transform: 'translateX(2px)', color: tone.fg },
                                        }}
                                    />
                                </Box>
                            );
                        })}
                    </Box>
                </Section>

                <Section
                    title="管理メニュー"
                    subtitle="初期設定・運用ルール"
                    icon={<SettingsRoundedIcon />}
                >
                    <Stack spacing={1}>
                        {adminItems.map(([label, path]) => (
                            <Button
                                key={label}
                                variant="text"
                                onClick={() => navigate(path)}
                                endIcon={<ArrowForwardRoundedIcon />}
                                sx={{
                                    justifyContent: 'space-between',
                                    color: 'var(--ink-primary)',
                                    paddingInline: 1.5,
                                    paddingBlock: 1.1,
                                    fontWeight: 600,
                                    background: 'var(--surface-sunken)',
                                    '&:hover': {
                                        background: 'var(--accent-primary-soft)',
                                        color: 'var(--accent-primary-ink)',
                                    },
                                }}
                            >
                                {label}
                            </Button>
                        ))}
                    </Stack>
                </Section>
            </Box>
        </PageScaffold>
    );
}

export default Dashboard;
