import { useMemo } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import BeenhereRoundedIcon from '@mui/icons-material/BeenhereRounded';
import PunchClockRoundedIcon from '@mui/icons-material/PunchClockRounded';
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CloudSyncRoundedIcon from '@mui/icons-material/CloudSyncRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';

import PageScaffold from './ui/PageScaffold.jsx';
import Section from './ui/Section.jsx';
import FocusCard from './ui/FocusCard.jsx';
import { KeyHint } from './ui/KeyHint.jsx';
import { usePendingCounts } from './ui/PendingPulse.jsx';
import { loadExpenseApplications, getExpenseIntegrationStatus } from './expenseApplicationStore';
import { loadLeaveApplications, getLeaveIntegrationStatus } from './leaveApplicationStore';
import { loadAttendanceTimesheets, getAttendanceIntegrationStatus } from './attendanceStore';
import { PERMISSIONS, ROLE_LABELS, ROLES, hasPermission } from './permissions';

const INTEGRATION_DOMAINS = [
    { key: 'expense',    label: '経費',  target: '経費 SaaS',    path: '/expense-search',        icon: <RequestQuoteRoundedIcon /> },
    { key: 'leave',      label: '勤怠申請', target: '勤怠 SaaS',    path: '/leave-search',          icon: <EventAvailableRoundedIcon /> },
    { key: 'attendance', label: '月次勤怠', target: '給与 SaaS',    path: '/attendance-management', icon: <PunchClockRoundedIcon /> },
];

const INTEGRATION_DOMAIN_PERMS = {
    expense: PERMISSIONS.MANAGE_EXPENSE,
    leave: PERMISSIONS.MANAGE_LEAVE,
    attendance: PERMISSIONS.MANAGE_ATTENDANCE,
};

const greetingByHour = () => {
    const h = new Date().getHours();
    if (h < 5) return 'お疲れさまです';
    if (h < 11) return 'おはようございます';
    if (h < 17) return 'こんにちは';
    return 'お疲れさまです';
};

const focusCandidate = ({ counts, role }) => {
    const h = new Date().getHours();
    const day = new Date().getDate();
    const monthEnd = day >= 25;
    const canApprove = hasPermission(role, PERMISSIONS.APPROVE_EXPENSE) || hasPermission(role, PERMISSIONS.APPROVE_LEAVE);

    if (canApprove && counts.expense + counts.leave >= 3) {
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
    if (monthEnd && hasPermission(role, PERMISSIONS.APPLY_EXPENSE)) {
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
    if (h < 11 && hasPermission(role, PERMISSIONS.APPLY_ATTENDANCE)) {
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
    if (hasPermission(role, PERMISSIONS.APPLY_EXPENSE)) {
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
    }
    return {
        key: 'dashboard',
        eyebrow: 'ようこそ',
        title: 'ダッシュボードへようこそ',
        description: 'メニューから業務を始めてください。',
        cta: '',
        path: '',
        icon: <SettingsRoundedIcon />,
        accent: 'primary',
    };
};

const buildPrimaryActions = ({ role, counts }) => {
    const list = [];
    if (hasPermission(role, PERMISSIONS.APPLY_ATTENDANCE)) {
        list.push({
            title: '勤怠を入力', description: '今月のタイムシート',
            path: '/attendance-input', icon: <PunchClockRoundedIcon />, tone: 'primary',
        });
    }
    if (hasPermission(role, PERMISSIONS.APPLY_EXPENSE)) {
        list.push({
            title: '経費を申請', description: '領収書付きで下書き保存',
            path: '/application', state: { startNew: true }, icon: <RequestQuoteRoundedIcon />, tone: 'iris',
        });
    }
    if (hasPermission(role, PERMISSIONS.APPLY_LEAVE)) {
        list.push({
            title: '勤怠を申請', description: '休暇・時間休・遅刻・早退',
            path: '/leave-application', state: { startNew: true }, icon: <EventAvailableRoundedIcon />, tone: 'amber',
        });
    }
    if (hasPermission(role, PERMISSIONS.APPROVE_EXPENSE)) {
        list.push({
            title: '経費承認',
            description: counts.expense > 0 ? `${counts.expense}件の承認待ち` : '承認待ちなし',
            path: '/approvals', icon: <FactCheckRoundedIcon />, tone: 'leaf', badge: counts.expense,
        });
    }
    if (hasPermission(role, PERMISSIONS.APPROVE_LEAVE)) {
        list.push({
            title: '勤怠申請承認',
            description: counts.leave > 0 ? `${counts.leave}件の承認待ち` : '承認待ちなし',
            path: '/leave-approvals', icon: <BeenhereRoundedIcon />, tone: 'leaf', badge: counts.leave,
        });
    }
    if (hasPermission(role, PERMISSIONS.APPROVE_ATTENDANCE)) {
        list.push({
            title: '勤怠承認', description: '部下の月次勤怠を承認',
            path: '/attendance-approvals', icon: <HowToRegRoundedIcon />, tone: 'leaf',
        });
    }
    return list;
};

const ADMIN_ITEMS = [
    { permission: PERMISSIONS.ADMIN_FLOW,       label: '申請フロー設定', path: '/flow-settings-menu' },
    { permission: PERMISSIONS.ADMIN_REMINDER,   label: 'アラート設定',   path: '/reminder-settings' },
    { permission: PERMISSIONS.ADMIN_ACCOUNT,    label: 'アカウント管理', path: '/account-management' },
    { permission: PERMISSIONS.ADMIN_MASTER,     label: 'マスタ管理',     path: '/master-settings' },
    { permission: PERMISSIONS.ADMIN_PERMISSION, label: '権限設定',       path: '/permission-settings' },
];

const tones = {
    primary: { bg: 'var(--accent-primary-soft)', fg: 'var(--accent-primary)' },
    iris:    { bg: 'var(--accent-iris-soft)',    fg: 'var(--accent-iris)' },
    amber:   { bg: 'var(--accent-amber-soft)',   fg: 'var(--accent-amber)' },
    leaf:    { bg: 'var(--accent-leaf-soft)',    fg: 'var(--accent-leaf)' },
};

function Dashboard({ username = '', role = ROLES.EMPLOYEE }) {
    const navigate = useNavigate();
    const counts = usePendingCounts();

    const focus = useMemo(() => focusCandidate({ counts, role }), [counts, role]);

    const integrationStats = useMemo(() => {
        const countList = (list, s) => list.filter((x) => x === s).length;
        const exp = loadExpenseApplications().map(getExpenseIntegrationStatus);
        const lv = loadLeaveApplications().map(getLeaveIntegrationStatus);
        const att = loadAttendanceTimesheets().map(getAttendanceIntegrationStatus);
        return {
            expense:    { pending: countList(exp, 'pending'), error: countList(exp, 'error') },
            leave:      { pending: countList(lv, 'pending'),  error: countList(lv, 'error') },
            attendance: { pending: countList(att, 'pending'), error: countList(att, 'error') },
        };
    }, []);

    const visibleIntegrationDomains = INTEGRATION_DOMAINS.filter(
        (d) => hasPermission(role, INTEGRATION_DOMAIN_PERMS[d.key]),
    );
    const showIntegrationSection = visibleIntegrationDomains.length > 0;
    const totalPending = visibleIntegrationDomains.reduce((s, d) => s + integrationStats[d.key].pending, 0);
    const totalErrors  = visibleIntegrationDomains.reduce((s, d) => s + integrationStats[d.key].error, 0);

    const visibleAdminItems = ADMIN_ITEMS.filter((item) => hasPermission(role, item.permission));
    const showAdminSection = visibleAdminItems.length > 0;

    const primaryActions = useMemo(() => buildPrimaryActions({ role, counts }), [role, counts]);

    const metrics = useMemo(() => {
        const list = [];
        if (hasPermission(role, PERMISSIONS.APPROVE_EXPENSE)) {
            list.push({ label: '承認待ち 経費', value: counts.expense, unit: '件', tone: counts.expense ? 'amber' : 'leaf' });
        }
        if (hasPermission(role, PERMISSIONS.APPROVE_LEAVE)) {
            list.push({ label: '承認待ち 勤怠申請', value: counts.leave, unit: '件', tone: counts.leave ? 'amber' : 'leaf' });
        }
        list.push({ label: '進行中 下書き', value: counts.drafts, unit: '件', tone: 'iris' });
        list.push({
            label: '本日',
            value: new Date().toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' }),
            unit: '',
            tone: 'primary',
        });
        return list;
    }, [role, counts]);

    return (
        <PageScaffold
            eyebrow={`${greetingByHour()} ・ ${ROLE_LABELS[role]}`}
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
                onAction={focus.path ? () => navigate(focus.path, focus.state ? { state: focus.state } : undefined) : undefined}
            />

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: `repeat(${Math.min(4, metrics.length)}, minmax(0, 1fr))` },
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

            {showIntegrationSection && (
                <Section
                    title="外部 SaaS 連携状況"
                    subtitle={
                        totalPending + totalErrors === 0
                            ? 'すべて連携済です。'
                            : `連携待ち ${totalPending} 件 / 連携エラー ${totalErrors} 件 — 該当する画面で「CSV 出力」「連携済にマーク」を実行できます。`
                    }
                    icon={<CloudSyncRoundedIcon />}
                >
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: `repeat(${Math.min(3, visibleIntegrationDomains.length)}, minmax(0, 1fr))` },
                            gap: 1.5,
                        }}
                    >
                        {visibleIntegrationDomains.map((d) => {
                            const s = integrationStats[d.key];
                            const hasIssue = s.pending + s.error > 0;
                            return (
                                <Box
                                    key={d.key}
                                    component="button"
                                    onClick={() => navigate(d.path)}
                                    sx={{
                                        all: 'unset',
                                        cursor: 'pointer',
                                        display: 'block',
                                        padding: 2,
                                        borderRadius: 'var(--radius-lg)',
                                        background: 'var(--surface-raised)',
                                        boxShadow: 'var(--shadow-1)',
                                        transition: 'var(--motion-base)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&:hover': { transform: 'translateY(-2px)', boxShadow: 'var(--shadow-2)' },
                                        '&:focus-visible': { outline: 'none', boxShadow: 'var(--shadow-glow)' },
                                    }}
                                >
                                    <Box
                                        aria-hidden
                                        sx={{
                                            position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
                                            background: hasIssue ? 'var(--accent-amber)' : 'var(--accent-leaf)', opacity: 0.7,
                                        }}
                                    />
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Box sx={{
                                                width: 36, height: 36, borderRadius: 'var(--radius-md)',
                                                display: 'grid', placeItems: 'center',
                                                background: hasIssue ? 'var(--accent-amber-soft)' : 'var(--accent-leaf-soft)',
                                                color: hasIssue ? 'var(--accent-amber)' : 'var(--accent-leaf)',
                                            }}>
                                                {d.icon}
                                            </Box>
                                            <Box sx={{ textAlign: 'left' }}>
                                                <Typography sx={{ fontWeight: 700, color: 'var(--ink-primary)' }}>{d.label}</Typography>
                                                <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                                                    {d.target}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                        <ArrowForwardRoundedIcon sx={{ color: 'var(--ink-muted)', fontSize: 18 }} />
                                    </Stack>
                                    <Stack direction="row" spacing={3} sx={{ mt: 1.5 }}>
                                        <Box>
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <CloudSyncRoundedIcon sx={{ fontSize: 14, color: 'var(--accent-amber)' }} />
                                                <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', fontWeight: 700 }}>連携待ち</Typography>
                                            </Stack>
                                            <Typography sx={{
                                                fontWeight: 800, fontSize: 22, lineHeight: 1,
                                                color: s.pending > 0 ? 'var(--accent-amber)' : 'var(--ink-tertiary)',
                                                fontVariantNumeric: 'tabular-nums',
                                            }}>
                                                {s.pending}
                                                <Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'var(--ink-tertiary)', fontWeight: 600 }}>件</Typography>
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <ErrorOutlineRoundedIcon sx={{ fontSize: 14, color: 'var(--accent-rose)' }} />
                                                <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', fontWeight: 700 }}>エラー</Typography>
                                            </Stack>
                                            <Typography sx={{
                                                fontWeight: 800, fontSize: 22, lineHeight: 1,
                                                color: s.error > 0 ? 'var(--accent-rose)' : 'var(--ink-tertiary)',
                                                fontVariantNumeric: 'tabular-nums',
                                            }}>
                                                {s.error}
                                                <Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'var(--ink-tertiary)', fontWeight: 600 }}>件</Typography>
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            );
                        })}
                    </Box>
                </Section>
            )}

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: showAdminSection ? { xs: '1fr', lg: 'minmax(0, 1.4fr) minmax(0, 1fr)' } : '1fr',
                    gap: 3,
                }}
            >
                {primaryActions.length > 0 && (
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
                            {primaryActions.map((action, idx) => {
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
                )}

                {showAdminSection && (
                    <Section
                        title="システム設定"
                        subtitle="初期設定・運用ルール"
                        icon={<SettingsRoundedIcon />}
                    >
                        <Stack spacing={1}>
                            {visibleAdminItems.map((item) => (
                                <Button
                                    key={item.label}
                                    variant="text"
                                    onClick={() => navigate(item.path)}
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
                                    {item.label}
                                </Button>
                            ))}
                        </Stack>
                    </Section>
                )}
            </Box>
        </PageScaffold>
    );
}

export default Dashboard;
