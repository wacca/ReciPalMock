import { Suspense, lazy, useMemo, useState } from 'react';
import './App.css';
import { Box, Skeleton, Stack, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import BeenhereRoundedIcon from '@mui/icons-material/BeenhereRounded';
import ContentPasteSearchRoundedIcon from '@mui/icons-material/ContentPasteSearchRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import ManageSearchRoundedIcon from '@mui/icons-material/ManageSearchRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import PunchClockRoundedIcon from '@mui/icons-material/PunchClockRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import WorkHistoryRoundedIcon from '@mui/icons-material/WorkHistoryRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';

import Login from './features/auth/Login';
import { SideRail } from './shared/ui/SideRail.jsx';
import { TopStrip } from './shared/ui/TopStrip.jsx';
import { CommandPalette, useCommandPalette } from './shared/ui/CommandPalette.jsx';
import { BottomNav } from './shared/ui/BottomNav.jsx';
import { PERMISSIONS, hasAnyPermission, hasPermission } from './shared/utils/permissions';
import { getUserRole } from './shared/utils/userDirectory';

const Dashboard = lazy(() => import('./features/dashboard/Dashboard'));
const ApplicationForm = lazy(() => import('./features/expense/ApplicationForm'));
const SubmittedApplications = lazy(() => import('./features/expense/SubmittedApplications'));
const Approvals = lazy(() => import('./features/expense/Approvals'));
const ApprovalFlowSettings = lazy(() => import('./features/expense/ApprovalFlowSettings'));
const ReminderSettings = lazy(() => import('./features/settings/ReminderSettings'));
const AccountManagement = lazy(() => import('./features/settings/AccountManagement'));
const MasterSettings = lazy(() => import('./features/settings/MasterSettings'));
const LeaveApplication = lazy(() => import('./features/leave/LeaveApplication'));
const LeaveSubmitted = lazy(() => import('./features/leave/LeaveSubmitted'));
const LeaveApprovals = lazy(() => import('./features/leave/LeaveApprovals'));
const AttendanceInput = lazy(() => import('./features/attendance/AttendanceInput'));
const LeaveApprovalFlowSettings = lazy(() => import('./features/leave/LeaveApprovalFlowSettings'));
const FlowSettingsMenu = lazy(() => import('./features/settings/FlowSettingsMenu'));
const PermissionSettings = lazy(() => import('./features/settings/PermissionSettings'));
const ExpenseSearch = lazy(() => import('./features/expense/ExpenseSearch'));
const LeaveSearch = lazy(() => import('./features/leave/LeaveSearch'));
const AttendanceApprovals = lazy(() => import('./features/attendance/AttendanceApprovals'));
const AttendanceManagement = lazy(() => import('./features/attendance/AttendanceManagement'));
const HolidaySettings = lazy(() => import('./features/settings/HolidaySettings'));

const menuGroups = [
    {
        title: 'ホーム',
        items: [
            { label: 'ダッシュボード', path: '/dashboard', icon: <DashboardRoundedIcon />, subtitle: '業務の入口', keywords: 'home hub', permissions: [PERMISSIONS.VIEW_DASHBOARD] },
        ],
    },
    {
        title: '自分の申請',
        items: [
            { label: '経費申請', path: '/application', icon: <RequestQuoteRoundedIcon />, subtitle: '経費の作成・下書き', keywords: 'expense application form', permissions: [PERMISSIONS.APPLY_EXPENSE] },
            { label: '経費履歴', path: '/submitted', icon: <ReceiptLongRoundedIcon />, subtitle: '自分の経費申請の履歴・状態確認', keywords: 'expense history submitted', permissions: [PERMISSIONS.APPLY_EXPENSE] },
            { label: '勤怠申請', path: '/leave-application', icon: <EventAvailableRoundedIcon />, subtitle: '休暇・時間休・遅刻・早退の作成', keywords: 'attendance leave application form', permissions: [PERMISSIONS.APPLY_LEAVE] },
            { label: '勤怠申請履歴', path: '/leave-submitted', icon: <EventNoteRoundedIcon />, subtitle: '自分の勤怠申請の履歴', keywords: 'attendance leave history submitted', permissions: [PERMISSIONS.APPLY_LEAVE] },
            { label: '月次タイムシート', path: '/attendance-input', icon: <PunchClockRoundedIcon />, subtitle: '月次勤怠の入力・参照（過去月も含む）', keywords: 'attendance timesheet monthly history input 月次勤怠 履歴', permissions: [PERMISSIONS.APPLY_ATTENDANCE] },
        ],
    },
    {
        title: '承認業務',
        items: [
            { label: '経費承認', path: '/approvals', icon: <FactCheckRoundedIcon />, subtitle: '経費の承認/差戻し', keywords: 'expense approval', permissions: [PERMISSIONS.APPROVE_EXPENSE] },
            { label: '勤怠申請承認', path: '/leave-approvals', icon: <BeenhereRoundedIcon />, subtitle: '休暇・時間休・遅刻・早退の承認/差戻し', keywords: 'attendance leave approval', permissions: [PERMISSIONS.APPROVE_LEAVE] },
            { label: '月次勤怠承認', path: '/attendance-approvals', icon: <HowToRegRoundedIcon />, subtitle: '部下の月次タイムシートを承認', keywords: 'attendance monthly approval', permissions: [PERMISSIONS.APPROVE_ATTENDANCE] },
        ],
    },
    {
        title: '管理業務',
        items: [
            { label: '経費申請検索', path: '/expense-search', icon: <ManageSearchRoundedIcon />, subtitle: '経費の横断検索・外部 SaaS 連携', keywords: 'search expense history admin', permissions: [PERMISSIONS.MANAGE_EXPENSE] },
            { label: '勤怠申請検索', path: '/leave-search', icon: <ContentPasteSearchRoundedIcon />, subtitle: '勤怠申請の横断検索・外部 SaaS 連携', keywords: 'search attendance leave history admin', permissions: [PERMISSIONS.MANAGE_LEAVE] },
            { label: '月次勤怠管理', path: '/attendance-management', icon: <WorkHistoryRoundedIcon />, subtitle: '全社の月次タイムシート参照・締め状況確認', keywords: 'attendance management hr monthly', permissions: [PERMISSIONS.MANAGE_ATTENDANCE] },
        ],
    },
    {
        title: 'システム設定',
        items: [
            {
                label: '申請フロー設定',
                path: '/flow-settings-menu',
                icon: <AccountTreeRoundedIcon />,
                subtitle: '経費/休暇の承認経路',
                matchPaths: ['/flow-settings-menu', '/approval-flow-settings', '/leave-approval-flow-settings'],
                keywords: 'flow settings',
                permissions: [PERMISSIONS.ADMIN_FLOW],
            },
            { label: 'アラート設定', path: '/reminder-settings', icon: <NotificationsActiveRoundedIcon />, subtitle: '通知条件', keywords: 'alert reminder', permissions: [PERMISSIONS.ADMIN_REMINDER] },
            { label: 'アカウント管理', path: '/account-management', icon: <ManageAccountsRoundedIcon />, subtitle: '利用者管理', keywords: 'account user', permissions: [PERMISSIONS.ADMIN_ACCOUNT] },
            { label: 'マスタ管理', path: '/master-settings', icon: <TuneRoundedIcon />, subtitle: '部署/役職', keywords: 'master department position', permissions: [PERMISSIONS.ADMIN_MASTER] },
            { label: '祝日マスタ', path: '/holiday-settings', icon: <CalendarMonthRoundedIcon />, subtitle: '法定祝日・会社休業日', keywords: 'holiday calendar master 祝日 休業日', permissions: [PERMISSIONS.ADMIN_HOLIDAY] },
            { label: '権限設定', path: '/permission-settings', icon: <AdminPanelSettingsRoundedIcon />, subtitle: 'ロール管理', keywords: 'permission role', permissions: [PERMISSIONS.ADMIN_PERMISSION] },
        ],
    },
];

const allMenuItems = menuGroups.flatMap((group) => group.items);

const matchesPath = (item, pathname) => {
    const matchPaths = item.matchPaths || [item.path];
    return matchPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
};

const findActiveGroup = (item, groups) => groups.find((g) => g.items.includes(item));

const Guard = ({ role, permission, children }) => (
    hasPermission(role, permission) ? children : <Navigate to="/dashboard" replace />
);

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [userId, setUserId] = useState('');
    const [roleOverride, setRoleOverride] = useState(null);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    const baseRole = getUserRole(userId);
    const effectiveRole = roleOverride || baseRole;

    const handleLogin = (name, id) => {
        setUsername(name);
        setUserId(id);
        setRoleOverride(null);
        setIsLoggedIn(true);
        navigate('/dashboard', { replace: true });
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setRoleOverride(null);
    };

    const visibleMenuGroups = useMemo(() => (
        menuGroups
            .map((group) => ({
                ...group,
                items: group.items.filter((item) => hasAnyPermission(effectiveRole, item.permissions || [])),
            }))
            .filter((group) => group.items.length > 0)
    ), [effectiveRole]);

    const visibleMenuItems = visibleMenuGroups.flatMap((group) => group.items);

    const activeItem = visibleMenuItems.find((item) => matchesPath(item, location.pathname))
        || allMenuItems.find((item) => matchesPath(item, location.pathname))
        || visibleMenuItems[0];
    const activeGroup = activeItem ? findActiveGroup(activeItem, visibleMenuGroups) || findActiveGroup(activeItem, menuGroups) : null;
    const breadcrumb = activeGroup ? activeGroup.title : '';

    const commands = useMemo(
        () => {
            const routeCmds = visibleMenuItems.map((item) => ({
                id: item.path,
                kind: 'route',
                label: item.label,
                subtitle: item.subtitle,
                keywords: item.keywords,
                icon: () => item.icon,
                run: () => navigate(item.path),
            }));
            const actionCmds = [];
            if (hasPermission(effectiveRole, PERMISSIONS.APPLY_EXPENSE)) {
                actionCmds.push({
                    id: 'action:new-expense',
                    kind: 'action',
                    label: '新規 経費申請を作成',
                    subtitle: '経費申請画面で新しい下書きを開く',
                    keywords: 'new create expense draft',
                    icon: () => <RequestQuoteRoundedIcon />,
                    run: () => navigate('/application', { state: { startNew: true } }),
                });
            }
            if (hasPermission(effectiveRole, PERMISSIONS.APPLY_LEAVE)) {
                actionCmds.push({
                    id: 'action:new-leave',
                    kind: 'action',
                    label: '新規 勤怠申請を作成',
                    subtitle: '勤怠申請画面で新しい下書きを開く',
                    keywords: 'new create leave draft',
                    icon: () => <EventAvailableRoundedIcon />,
                    run: () => navigate('/leave-application', { state: { startNew: true } }),
                });
            }
            if (hasPermission(effectiveRole, PERMISSIONS.APPLY_ATTENDANCE)) {
                actionCmds.push({
                    id: 'action:attendance',
                    kind: 'action',
                    label: '今月のタイムシートを開く',
                    subtitle: '月次タイムシート',
                    keywords: 'attendance timesheet',
                    icon: () => <PunchClockRoundedIcon />,
                    run: () => navigate('/attendance-input'),
                });
            }
            return routeCmds.concat(actionCmds);
        },
        [effectiveRole, navigate, visibleMenuItems],
    );

    if (!isLoggedIn) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-base)' }}>
            <SideRail
                groups={visibleMenuGroups}
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
                    baseRole={baseRole}
                    effectiveRole={effectiveRole}
                    onRoleChange={setRoleOverride}
                    isRoleOverridden={Boolean(roleOverride) && roleOverride !== baseRole}
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
                            <Route path="/dashboard" element={<Dashboard username={username} userId={userId} role={effectiveRole} />} />
                            <Route path="/application" element={<Guard role={effectiveRole} permission={PERMISSIONS.APPLY_EXPENSE}><ApplicationForm userId={userId} /></Guard>} />
                            <Route path="/submitted" element={<Guard role={effectiveRole} permission={PERMISSIONS.APPLY_EXPENSE}><SubmittedApplications userId={userId} /></Guard>} />
                            <Route path="/approvals" element={<Guard role={effectiveRole} permission={PERMISSIONS.APPROVE_EXPENSE}><Approvals /></Guard>} />
                            <Route path="/flow-settings-menu" element={<Guard role={effectiveRole} permission={PERMISSIONS.ADMIN_FLOW}><FlowSettingsMenu /></Guard>} />
                            <Route path="/approval-flow-settings" element={<Guard role={effectiveRole} permission={PERMISSIONS.ADMIN_FLOW}><ApprovalFlowSettings /></Guard>} />
                            <Route path="/leave-approval-flow-settings" element={<Guard role={effectiveRole} permission={PERMISSIONS.ADMIN_FLOW}><LeaveApprovalFlowSettings /></Guard>} />
                            <Route path="/reminder-settings" element={<Guard role={effectiveRole} permission={PERMISSIONS.ADMIN_REMINDER}><ReminderSettings /></Guard>} />
                            <Route path="/account-management" element={<Guard role={effectiveRole} permission={PERMISSIONS.ADMIN_ACCOUNT}><AccountManagement /></Guard>} />
                            <Route path="/master-settings" element={<Guard role={effectiveRole} permission={PERMISSIONS.ADMIN_MASTER}><MasterSettings /></Guard>} />
                            <Route path="/holiday-settings" element={<Guard role={effectiveRole} permission={PERMISSIONS.ADMIN_HOLIDAY}><HolidaySettings /></Guard>} />
                            <Route path="/leave-application" element={<Guard role={effectiveRole} permission={PERMISSIONS.APPLY_LEAVE}><LeaveApplication userId={userId} /></Guard>} />
                            <Route path="/leave-submitted" element={<Guard role={effectiveRole} permission={PERMISSIONS.APPLY_LEAVE}><LeaveSubmitted userId={userId} /></Guard>} />
                            <Route path="/leave-approvals" element={<Guard role={effectiveRole} permission={PERMISSIONS.APPROVE_LEAVE}><LeaveApprovals /></Guard>} />
                            <Route path="/attendance-input" element={<Guard role={effectiveRole} permission={PERMISSIONS.APPLY_ATTENDANCE}><AttendanceInput username={username} userId={userId} /></Guard>} />
                            <Route path="/attendance-approvals" element={<Guard role={effectiveRole} permission={PERMISSIONS.APPROVE_ATTENDANCE}><AttendanceApprovals /></Guard>} />
                            <Route path="/attendance-management" element={<Guard role={effectiveRole} permission={PERMISSIONS.MANAGE_ATTENDANCE}><AttendanceManagement userId={userId} /></Guard>} />
                            <Route path="/permission-settings" element={<Guard role={effectiveRole} permission={PERMISSIONS.ADMIN_PERMISSION}><PermissionSettings /></Guard>} />
                            <Route path="/expense-search" element={<Guard role={effectiveRole} permission={PERMISSIONS.MANAGE_EXPENSE}><ExpenseSearch userId={userId} /></Guard>} />
                            <Route path="/leave-search" element={<Guard role={effectiveRole} permission={PERMISSIONS.MANAGE_LEAVE}><LeaveSearch userId={userId} /></Guard>} />
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
