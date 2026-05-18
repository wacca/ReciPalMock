import { Suspense, lazy, useState } from 'react';
import './App.css';
import {
    Typography,
    Box,
    AppBar,
    Toolbar,
    IconButton,
    Menu,
    MenuItem,
    Avatar,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventNoteIcon from '@mui/icons-material/EventNote';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PunchClockIcon from '@mui/icons-material/PunchClock';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import TuneIcon from '@mui/icons-material/Tune';

import Login from './Login';

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

const drawerWidth = 236;

const menuGroups = [
    {
        title: 'ホーム',
        items: [
            { label: 'ダッシュボード', path: '/dashboard', icon: <DashboardIcon />, subtitle: '業務の入口' },
        ],
    },
    {
        title: '申請',
        items: [
            { label: '経費申請', path: '/application', icon: <RequestQuoteIcon />, subtitle: '経費の作成' },
            { label: '経費申請済', path: '/submitted', icon: <AssignmentTurnedInIcon />, subtitle: '経費の履歴' },
            { label: '経費承認', path: '/approvals', icon: <FactCheckIcon />, subtitle: '経費の承認' },
            { label: '休暇申請', path: '/leave-application', icon: <EventAvailableIcon />, subtitle: '休暇の作成' },
            { label: '休暇申請済', path: '/leave-submitted', icon: <EventNoteIcon />, subtitle: '休暇の履歴' },
            { label: '休暇承認', path: '/leave-approvals', icon: <HowToRegIcon />, subtitle: '休暇の承認' },
        ],
    },
    {
        title: '勤怠',
        items: [
            { label: '勤怠入力', path: '/attendance-input', icon: <PunchClockIcon />, subtitle: '月次タイムシート' },
        ],
    },
    {
        title: '管理',
        items: [
            {
                label: '申請フロー設定',
                path: '/flow-settings-menu',
                icon: <AccountTreeIcon />,
                subtitle: '経費/休暇の承認経路',
                matchPaths: ['/flow-settings-menu', '/approval-flow-settings', '/leave-approval-flow-settings'],
            },
            { label: 'アラート設定', path: '/reminder-settings', icon: <NotificationsActiveIcon />, subtitle: '通知条件' },
            { label: 'アカウント管理', path: '/account-management', icon: <ManageAccountsIcon />, subtitle: '利用者管理' },
            { label: 'マスタ管理', path: '/master-settings', icon: <TuneIcon />, subtitle: '部署/役職' },
            { label: '権限設定', path: '/permission-settings', icon: <AdminPanelSettingsIcon />, subtitle: 'ロール管理' },
        ],
    },
];

const allMenuItems = menuGroups.flatMap(group => group.items);

const matchesPath = (item, pathname) => {
    const matchPaths = item.matchPaths || [item.path];
    return matchPaths.some(path => pathname === path || pathname.startsWith(`${path}/`));
};

// RecrovaロゴSVG
const RecrovaLogo = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#1abc9c" />
        <path d="M10 22c0-4 2-8 6-8s6 4 6 8" stroke="#fff" strokeWidth="2" fill="none"/>
        <circle cx="16" cy="13" r="3" fill="#fff"/>
        <path d="M12 10c1-2 7-2 8 0" stroke="#fff" strokeWidth="1.5" fill="none"/>
    </svg>
);

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [userId, setUserId] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    const handleLogin = (username, userId) => {
        setUsername(username);
        setUserId(userId);
        setIsLoggedIn(true);
        navigate('/dashboard', { replace: true });
    };

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        handleMenuClose();
    };

    const activeItem = allMenuItems.find(item => matchesPath(item, location.pathname)) || allMenuItems[0];

    const handleNavigate = (path) => {
        navigate(path);
        setMobileDrawerOpen(false);
    };

    const drawerContent = (
        <>
            <Toolbar />
            <Box className="drawerContent">
                {menuGroups.map((group, groupIndex) => (
                    <Box key={group.title} className="navGroup">
                        {groupIndex > 0 && <Divider sx={{ my: 1.25 }} />}
                        <Typography className="navGroupLabel" variant="caption">
                            {group.title}
                        </Typography>
                        <List disablePadding>
                            {group.items.map(item => {
                                const isActive = matchesPath(item, location.pathname);
                                return (
                                    <ListItem
                                        key={item.path}
                                        disablePadding
                                        className={isActive ? 'active' : ''}
                                    >
                                        <ListItemButton
                                            selected={isActive}
                                            onClick={() => handleNavigate(item.path)}
                                        >
                                            <ListItemIcon>{item.icon}</ListItemIcon>
                                            <ListItemText primary={item.label} />
                                        </ListItemButton>
                                    </ListItem>
                                );
                            })}
                        </List>
                    </Box>
                ))}
            </Box>
        </>
    );

    if (!isLoggedIn) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <>
            <AppBar position="fixed" elevation={0} className="appBar">
                <Toolbar sx={{ minHeight: 64 }}>
                    {!isDesktop && (
                        <IconButton
                            color="inherit"
                            edge="start"
                            onClick={() => setMobileDrawerOpen(true)}
                            aria-label="メニューを開く"
                            sx={{ mr: 1 }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}
                    <Box className="brandBlock">
                        <RecrovaLogo />
                        <Typography variant="h6" noWrap component="div" sx={{ ml: 1, fontWeight: 'bold', letterSpacing: 1 }}>
                            Recrova
                        </Typography>
                    </Box>
                    <Box className="topBarTitle">
                        <Typography variant="subtitle1">
                            {activeItem.label}
                        </Typography>
                        <Typography variant="caption">
                            {activeItem.subtitle}
                        </Typography>
                    </Box>
                    <Box sx={{ flexGrow: 1 }} />
                    <Box className="userMenuBlock">
                        <Typography variant="body2" noWrap sx={{ maxWidth: { xs: 160, sm: 320 } }}>
                            {username} ({userId})
                        </Typography>
                        <IconButton color="inherit" onClick={handleMenuOpen} aria-label="ユーザーメニューを開く">
                            <Avatar className="userAvatar">
                                <AccountCircleIcon sx={{ width: 32, height: 32 }} />
                            </Avatar>
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleMenuClose}
                        >
                            <MenuItem onClick={handleLogout}>ログアウト</MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </AppBar>
            <Box className="appShell">
                <Drawer
                    variant={isDesktop ? 'permanent' : 'temporary'}
                    open={isDesktop || mobileDrawerOpen}
                    onClose={() => setMobileDrawerOpen(false)}
                    className="drawer"
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        width: drawerWidth,
                        flexShrink: 0,
                        display: { xs: 'block' },
                        zIndex: (theme) => isDesktop ? theme.zIndex.appBar - 1 : theme.zIndex.drawer + 2,
                        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
                    }}
                >
                    {drawerContent}
                </Drawer>
                <Box component="main" className="pageViewport">
                    <Toolbar />
                    <Suspense
                        fallback={
                            <Box className="contentLoading">
                                読み込み中...
                            </Box>
                        }
                    >
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
        </>
    );
}

export default App;
