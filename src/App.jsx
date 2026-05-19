import { Suspense, lazy, useMemo, useState } from 'react';
import './App.css';
import { Box, Skeleton, Stack, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import PunchClockRoundedIcon from '@mui/icons-material/PunchClockRounded';
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';

import Login from './Login';
import { SideRail } from './ui/SideRail.jsx';
import { TopStrip } from './ui/TopStrip.jsx';
import { CommandPalette, useCommandPalette } from './ui/CommandPalette.jsx';
import { BottomNav } from './ui/BottomNav.jsx';

const Dashboard = lazy(() => import('./Dashboard'));
const ApplicationForm = lazy(() => import('./ApplicationForm'));
const SubmittedApplications = lazy(() => import('./SubmittedApplications'));
const Approvals = lazy(() => import('./Approvals'));
const ApprovalFlowSettings = lazy(() => import('./ApprovalFlowSettings'));
const ReminderSettings = lazy(() => import('./ReminderSettings'));
const AccountManagement = lazy(() => import('./AccountManagement'));
const MasterSettings = lazy(() => import('./MasterSettings'));
const LeaveApplication = lazy(() => import('./LeaveApplication'));
const LeaveSubmitted = lazy(() => import('./LeaveSubmitted'));
const LeaveApprovals = lazy(() => import('./LeaveApprovals'));
const AttendanceInput = lazy(() => import('./AttendanceInput'));
const LeaveApprovalFlowSettings = lazy(() => import('./LeaveApprovalFlowSettings'));
const FlowSettingsMenu = lazy(() => import('./FlowSettingsMenu'));
const PermissionSettings = lazy(() => import('./PermissionSettings'));

const menuGroups = [
    {
        title: 'ホーム',
        items: [
            { label: 'ダッシュボード', path: '/dashboard', icon: <DashboardRoundedIcon />, subtitle: '業務の入口', keywords: 'home hub' },
        ],
    },
    {
        title: '申請',
        items: [
            { label: '経費申請', path: '/application', icon: <RequestQuoteRoundedIcon />, subtitle: '経費の作成・下書き', keywords: 'expense application form' },
            { label: '経費申請済', path: '/submitted', icon: <AssignmentTurnedInRoundedIcon />, subtitle: '経費の履歴・状態確認', keywords: 'expense submitted history' },
            { label: '経費承認', path: '/approvals', icon: <FactCheckRoundedIcon />, subtitle: '経費の承認/差戻し', keywords: 'expense approval' },
            { label: '休暇申請', path: '/leave-application', icon: <EventAvailableRoundedIcon />, subtitle: '休暇・遅刻・早退の作成', keywords: 'leave application' },
            { label: '休暇申請済', path: '/leave-submitted', icon: <EventNoteRoundedIcon />, subtitle: '休暇の履歴', keywords: 'leave history' },
            { label: '休暇承認', path: '/leave-approvals', icon: <HowToRegRoundedIcon />, subtitle: '休暇の承認/差戻し', keywords: 'leave approval' },
        ],
    },
    {
        title: '勤怠',
        items: [
            { label: '勤怠入力', path: '/attendance-input', icon: <PunchClockRoundedIcon />, subtitle: '月次タイムシート', keywords: 'attendance timesheet' },
        ],
    },
    {
        title: '管理',
        items: [
            {
                label: '申請フロー設定',
                path: '/flow-settings-menu',
                icon: <AccountTreeRoundedIcon />,
                subtitle: '経費/休暇の承認経路',
                matchPaths: ['/flow-settings-menu', '/approval-flow-settings', '/leave-approval-flow-settings'],
                keywords: 'flow settings',
            },
            { label: 'アラート設定', path: '/reminder-settings', icon: <NotificationsActiveRoundedIcon />, subtitle: '通知条件', keywords: 'alert reminder' },
            { label: 'アカウント管理', path: '/account-management', icon: <ManageAccountsRoundedIcon />, subtitle: '利用者管理', keywords: 'account user' },
            { label: 'マスタ管理', path: '/master-settings', icon: <TuneRoundedIcon />, subtitle: '部署/役職', keywords: 'master department position' },
            { label: '権限設定', path: '/permission-settings', icon: <AdminPanelSettingsRoundedIcon />, subtitle: 'ロール管理', keywords: 'permission role' },
        ],
    },
];

const allMenuItems = menuGroups.flatMap((group) => group.items);

const matchesPath = (item, pathname) => {
    const matchPaths = item.matchPaths || [item.path];
    return matchPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
};

const findActiveGroup = (item) => menuGroups.find((g) => g.items.includes(item));

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [userId, setUserId] = useState('');
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    const handleLogin = (name, id) => {
        setUsername(name);
        setUserId(id);
        setIsLoggedIn(true);
        navigate('/dashboard', { replace: true });
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
    };

    const activeItem = allMenuItems.find((item) => matchesPath(item, location.pathname)) || allMenuItems[0];
    const activeGroup = findActiveGroup(activeItem);
    const breadcrumb = activeGroup ? activeGroup.title : '';

    const commands = useMemo(
        () =>
            allMenuItems
                .map((item) => ({
                    id: item.path,
                    kind: 'route',
                    label: item.label,
                    subtitle: item.subtitle,
                    keywords: item.keywords,
                    icon: () => item.icon,
                    run: () => navigate(item.path),
                }))
                .concat([
                    {
                        id: 'action:new-expense',
                        kind: 'action',
                        label: '新規 経費申請を作成',
                        subtitle: '経費申請画面で新しい下書きを開く',
                        keywords: 'new create expense draft',
                        icon: () => <RequestQuoteRoundedIcon />,
                        run: () => navigate('/application', { state: { startNew: true } }),
                    },
                    {
                        id: 'action:new-leave',
                        kind: 'action',
                        label: '新規 休暇申請を作成',
                        subtitle: '休暇申請画面で新しい下書きを開く',
                        keywords: 'new create leave draft',
                        icon: () => <EventAvailableRoundedIcon />,
                        run: () => navigate('/leave-application', { state: { startNew: true } }),
                    },
                    {
                        id: 'action:attendance',
                        kind: 'action',
                        label: '今月の勤怠を入力',
                        subtitle: '月次タイムシートを開く',
                        keywords: 'attendance timesheet',
                        icon: () => <PunchClockRoundedIcon />,
                        run: () => navigate('/attendance-input'),
                    },
                ]),
        [navigate],
    );

    if (!isLoggedIn) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-base)' }}>
            <SideRail
                groups={menuGroups}
                matchesPath={matchesPath}
                mobileOpen={mobileNavOpen}
                onMobileClose={() => setMobileNavOpen(false)}
                isDesktop={isDesktop}
            />
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <TopStrip
                    activeItem={activeItem}
                    breadcrumb={breadcrumb}
                    username={username}
                    userId={userId}
                    onLogout={handleLogout}
                    onOpenMobileNav={() => setMobileNavOpen(true)}
                    onOpenPalette={() => setPaletteOpen(true)}
                    isDesktop={isDesktop}
                />
                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        minWidth: 0,
                        paddingInline: { xs: 1.5, md: 3 },
                        paddingBlock: { xs: 2, md: 3 },
                        paddingBottom: { xs: 12, md: 4 },
                        background:
                            'radial-gradient(ellipse 600px 380px at 20% -80px, var(--accent-primary-soft), transparent 70%), var(--surface-base)',
                    }}
                >
                    <Suspense fallback={<PageSkeleton />}>
                        <Routes>
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/dashboard" element={<Dashboard username={username} />} />
                            <Route path="/application" element={<ApplicationForm />} />
                            <Route path="/submitted" element={<SubmittedApplications />} />
                            <Route path="/approvals" element={<Approvals />} />
                            <Route path="/flow-settings-menu" element={<FlowSettingsMenu />} />
                            <Route path="/approval-flow-settings" element={<ApprovalFlowSettings />} />
                            <Route path="/leave-approval-flow-settings" element={<LeaveApprovalFlowSettings />} />
                            <Route path="/reminder-settings" element={<ReminderSettings />} />
                            <Route path="/account-management" element={<AccountManagement />} />
                            <Route path="/master-settings" element={<MasterSettings />} />
                            <Route path="/leave-application" element={<LeaveApplication />} />
                            <Route path="/leave-submitted" element={<LeaveSubmitted />} />
                            <Route path="/leave-approvals" element={<LeaveApprovals />} />
                            <Route path="/attendance-input" element={<AttendanceInput username={username} userId={userId} />} />
                            <Route path="/permission-settings" element={<PermissionSettings />} />
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </Suspense>
                </Box>
            </Box>
            <BottomNav onOpenPalette={() => setPaletteOpen(true)} />
            <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
        </Box>
    );
}

const PageSkeleton = () => (
    <Stack spacing={2}>
        <Skeleton variant="rounded" height={120} sx={{ borderRadius: 'var(--radius-lg)' }} />
        <Stack direction="row" spacing={2}>
            <Skeleton variant="rounded" height={120} sx={{ flex: 1, borderRadius: 'var(--radius-lg)' }} />
            <Skeleton variant="rounded" height={120} sx={{ flex: 1, borderRadius: 'var(--radius-lg)' }} />
        </Stack>
        <Skeleton variant="rounded" height={280} sx={{ borderRadius: 'var(--radius-lg)' }} />
    </Stack>
);

export default App;
