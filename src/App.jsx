import { useState } from 'react';
import './App.css';
import { Typography, Box, AppBar, Toolbar, IconButton, Menu, MenuItem, Avatar, Badge, Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Route, Routes, NavLink, useNavigate, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/ArrowBackIosNew';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DoneIcon from '@mui/icons-material/Done';
import ApprovalIcon from '@mui/icons-material/ThumbUp';
import { Settings, ListAlt } from '@mui/icons-material';

import Login from './Login';
import ApplicationForm from './ApplicationForm';
import SubmittedApplications from './SubmittedApplications';
import Approvals from './Approvals';
import ApprovalFlowSettings from './ApprovalFlowSettings';
import ReminderSettings from './ReminderSettings';
import AccountManagement from './AccountManagement';
import MasterSettings from './MasterSettings';
import LeaveApplication from './LeaveApplication';
import LeaveSubmitted from './LeaveSubmitted';
import LeaveApprovals from './LeaveApprovals';
import LeaveApprovalFlowSettings from './LeaveApprovalFlowSettings';
import FlowSettingsMenu from './FlowSettingsMenu';
import PermissionSettings from './PermissionSettings';

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
        { label: '休暇申請', path: '/leave-application', icon: <AssignmentIcon /> },
        { label: '休暇申請済', path: '/leave-submitted', icon: <DoneIcon /> },
        { label: '休暇承認', path: '/leave-approvals', icon: <ApprovalIcon /> },
        { label: '申請フロー設定', path: '/flow-settings-menu', icon: <Settings /> },
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
            <AppBar position="fixed">
                <Toolbar>
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                        <RecrovaLogo />
                        <Typography variant="h6" noWrap component="div" sx={{ ml: 1, fontWeight: 'bold', letterSpacing: 1 }}>
                            Recrova
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                        <IconButton color="inherit" onClick={handleMenuOpen}>
                            <Avatar>
                                <AccountCircleIcon sx={{ width: 32, height: 32 }} />
                            </Avatar>
                        </IconButton>
                        <Typography variant="body1" sx={{ mr: 2 }}>
                            {username} ({userId})
                        </Typography>
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
            <Box sx={{ display: 'flex', height: '100vh' }}>
                <Drawer
                    variant="permanent"
                    className="drawer"
                    sx={{
                        width: 220,
                        flexShrink: 0,
                        zIndex: (theme) => theme.zIndex.appBar - 1,
                        [`& .MuiDrawer-paper`]: { width: 220, boxSizing: 'border-box' },
                    }}
                >
                    <Toolbar />
                    <List>
                        {menuItems.map((item, idx) => {
                            const isActive = location.pathname.startsWith(item.path.replace(/-menu$/, ''));
                            return (
                                <ListItem
                                    button
                                    key={item.path}
                                    selected={isActive}
                                    onClick={() => navigate(item.path)}
                                    className={`MuiListItem-root${isActive ? ' active' : ''}`}
                                >
                                    <ListItemIcon className="MuiListItemIcon-root">{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.label} className="MuiListItemText-primary" />
                                </ListItem>
                            );
                        })}
                    </List>
                </Drawer>
                <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                    <Toolbar />
                    <Routes>
                        <Route path="/application" element={<ApplicationForm username={username} />} />
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
                        <Route path="/permission-settings" element={<PermissionSettings />} />
                    </Routes>
                </Box>
            </Box>
        </>
    );
}

export default App;
