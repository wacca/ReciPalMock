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
} from '@mui/material';
import { Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DoneIcon from '@mui/icons-material/Done';
import ApprovalIcon from '@mui/icons-material/ThumbUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Settings, ListAlt } from '@mui/icons-material';

import Login from './Login';

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
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogin = (username, userId) => {
        setUsername(username);
        setUserId(userId);
        setIsLoggedIn(true);
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

    const menuItems = [
        { label: '経費申請', path: '/application', icon: <AssignmentIcon /> },
        { label: '経費申請済', path: '/submitted', icon: <DoneIcon /> },
        { label: '経費承認', path: '/approvals', icon: <ApprovalIcon /> },
        { divider: true },
        { label: '休暇申請', path: '/leave-application', icon: <AssignmentIcon /> },
        { label: '休暇申請済', path: '/leave-submitted', icon: <DoneIcon /> },
        { label: '休暇承認', path: '/leave-approvals', icon: <ApprovalIcon /> },
        { label: '勤怠入力', path: '/attendance-input', icon: <AccessTimeIcon /> },
        { divider: true },
        {
            label: '申請フロー設定',
            path: '/flow-settings-menu',
            icon: <Settings />,
            matchPaths: ['/flow-settings-menu', '/approval-flow-settings', '/leave-approval-flow-settings'],
        },
        { label: 'アラート設定', path: '/reminder-settings', icon: <ListAlt /> },
        { label: 'アカウント管理', path: '/account-management', icon: <AccountCircleIcon /> },
        { label: 'マスタ管理', path: '/master-settings', icon: <Settings /> },
        { label: '権限設定', path: '/permission-settings', icon: <Settings /> },
    ];

    if (!isLoggedIn) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <>
            <AppBar position="fixed" elevation={0} className="appBar">
                <Toolbar sx={{ minHeight: 64 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: drawerWidth - 24 }}>
                        <RecrovaLogo />
                        <Typography variant="h6" noWrap component="div" sx={{ ml: 1, fontWeight: 'bold', letterSpacing: 1 }}>
                            Recrova
                        </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.78)' }}>
                        申請・承認モック
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
            <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                <Drawer
                    variant="permanent"
                    className="drawer"
                    sx={{
                        width: drawerWidth,
                        flexShrink: 0,
                        zIndex: (theme) => theme.zIndex.appBar - 1,
                        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
                    }}
                >
                    <Toolbar />
                    <List sx={{ px: 1.5, py: 2 }}>
                        {menuItems.map((item, idx) => {
                            if (item.divider) {
                                return <Divider key={`divider-${idx}`} sx={{ my: 1 }} />;
                            }
                            const matchPaths = item.matchPaths || [item.path];
                            const isActive = matchPaths.some(path => location.pathname === path || location.pathname.startsWith(`${path}/`));
                            return (
                                <ListItem
                                    key={item.path}
                                    disablePadding
                                    className={isActive ? 'active' : ''}
                                >
                                    <ListItemButton
                                        selected={isActive}
                                        onClick={() => navigate(item.path)}
                                    >
                                        <ListItemIcon>{item.icon}</ListItemIcon>
                                        <ListItemText primary={item.label} />
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}
                    </List>
                </Drawer>
                <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, minWidth: 0 }}>
                    <Toolbar />
                    <Suspense
                        fallback={
                            <Box sx={{ py: 4, color: 'text.secondary' }}>
                                読み込み中...
                            </Box>
                        }
                    >
                        <Routes>
                            <Route path="/" element={<Navigate to="/application" replace />} />
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
                            <Route path="*" element={<Navigate to="/application" replace />} />
                        </Routes>
                    </Suspense>
                </Box>
            </Box>
        </>
    );
}

export default App;
