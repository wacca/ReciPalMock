import { useState } from 'react';
import './App.css';
import { Typography, Box, AppBar, Toolbar, Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, Menu, MenuItem, Avatar, Badge } from '@mui/material';
import { Route, Routes, NavLink  } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/ArrowBackIosNew';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DoneIcon from '@mui/icons-material/Done';
import ApprovalIcon from '@mui/icons-material/ThumbUp';

import Login from './Login';
import ApplicationForm from './ApplicationForm';
import SubmittedApplications from './SubmittedApplications';
import Approvals from './Approvals';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [userId, setUserId] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    const handleLogin = (username, userId) => {
        setUsername(username);
        setUsername(username);
        setUserId(userId);
        setIsLoggedIn(true);
    };

    const toggleDrawer = () => {
        setDrawerOpen(!drawerOpen);
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


    if (!isLoggedIn) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <>
            <AppBar position="fixed">
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={toggleDrawer}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div">
                        ReciPal
                    </Typography>
                    （Receipt + Pal「レシートの相棒」 by ChatGPT）
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                        <IconButton color="inherit" onClick={handleMenuOpen}>
                            <Avatar >
                                <AccountCircleIcon sx={{ width: 32, height: 32 }}/>
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
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

                <Drawer
                    variant="temporary"
                    open={drawerOpen}
                    onClose={toggleDrawer}
                    classes={{ paper: 'drawer' }}
                    sx={{
                        width: 240,
                        flexShrink: 0,
                        [`& .MuiDrawer-paper`]: { width: 240, boxSizing: 'border-box' },
                    }}
                >
                    <Toolbar sx={{ justifyContent: 'flex-end' }}>
                        <IconButton onClick={toggleDrawer}>
                            <CloseIcon />
                        </IconButton>
                    </Toolbar>
                    <Box sx={{ overflow: 'auto' }} >
                        <List>
                            <ListItem button component={NavLink} to="/application">
                                <ListItemIcon>
                                    <AssignmentIcon />
                                </ListItemIcon>
                                <ListItemText primary="申請" className="MuiListItemText-primary" />
                            </ListItem>
                            <ListItem button component={NavLink} to="/submitted">
                                <ListItemIcon>
                                    <DoneIcon />
                                </ListItemIcon>
                                <ListItemText primary="申請済" className="MuiListItemText-primary" />
                            </ListItem>
                            <ListItem button component={NavLink} to="/approvals">
                                <ListItemIcon>
                                    <ApprovalIcon />
                                </ListItemIcon>
                                <ListItemText primary="承認" className="MuiListItemText-primary" />
                                <Badge badgeContent={6} color="secondary" />
                            </ListItem>
                        </List>
                    </Box>
                </Drawer>
                <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                    <Toolbar />
                    <Routes>
                        <Route path="/application" element={<ApplicationForm username={username} />} />
                        <Route path="/submitted" element={<SubmittedApplications />} />
                        <Route path="/approvals" element={<Approvals />} />
                    </Routes>
                </Box>
            </Box>
        </>
    );
}

export default App;