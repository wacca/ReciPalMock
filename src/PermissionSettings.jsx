import { useState, useEffect } from 'react';
import {
    Container, Typography, Paper, Grid, List, ListItem, ListItemText, Switch, Box, Tabs, Tab, Button, TextField, Select, MenuItem, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const SCREENS = [
    { key: 'application', label: '経費申請' },
    { key: 'submitted', label: '経費申請済' },
    { key: 'approvals', label: '経費承認' },
    { key: 'leave-application', label: '休暇申請' },
    { key: 'leave-submitted', label: '休暇申請済' },
    { key: 'leave-approvals', label: '休暇承認' },
    { key: 'flow-settings-menu', label: '申請フロー設定' },
    { key: 'reminder-settings', label: 'アラート設定' },
    { key: 'account-management', label: 'アカウント管理' },
    { key: 'master-settings', label: 'マスタ管理' },
    { key: 'permission-settings', label: '権限設定' },
];

const INITIAL_ROLES = [
    { key: 'admin', label: '管理者' },
    { key: 'approver', label: '承認者' },
    { key: 'user', label: '一般ユーザー' },
];

function PermissionSettings() {
    const [currentTab, setCurrentTab] = useState(0);
    const [accounts, setAccounts] = useState([]);

    // Roles state
    const [definedRoles, setDefinedRoles] = useState(INITIAL_ROLES);
    const [selectedRoleKey, setSelectedRoleKey] = useState(INITIAL_ROLES[0].key);
    const [rolesPermissions, setRolesPermissions] = useState({}); // { roleKey: { screenKey: true/false } }
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null); // { key: string, label: string } or null for new
    const [roleNameInput, setRoleNameInput] = useState('');

    // User role assignment state
    const [userRoles, setUserRoles] = useState({}); // { userId: roleKey }

    useEffect(() => {
        const accData = JSON.parse(localStorage.getItem('accounts') || '[]');
        setAccounts(accData);

        const savedDefinedRoles = JSON.parse(localStorage.getItem('definedRoles') || JSON.stringify(INITIAL_ROLES));
        setDefinedRoles(savedDefinedRoles);
        if (savedDefinedRoles.length > 0 && !savedDefinedRoles.find(r => r.key === selectedRoleKey)) {
            setSelectedRoleKey(savedDefinedRoles[0].key);
        }

        const savedRolesPermissions = JSON.parse(localStorage.getItem('rolesPermissions') || '{}');
        setRolesPermissions(savedRolesPermissions);

        const savedUserRoles = JSON.parse(localStorage.getItem('userRoles') || '{}');
        setUserRoles(savedUserRoles);
    }, []);

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    // --- Role Settings Tab Logic ---
    const handleSelectRole = (roleKey) => {
        setSelectedRoleKey(roleKey);
    };

    const handleRolePermissionChange = (screenKey, canAccess) => {
        setRolesPermissions(prev => ({
            ...prev,
            [selectedRoleKey]: {
                ...(prev[selectedRoleKey] || {}),
                [screenKey]: canAccess,
            },
        }));
    };

    const openRoleDialog = (role = null) => {
        setEditingRole(role);
        setRoleNameInput(role ? role.label : '');
        setRoleDialogOpen(true);
    };
    const closeRoleDialog = () => {
        setRoleDialogOpen(false);
        setEditingRole(null);
        setRoleNameInput('');
    };

    const handleSaveRole = () => {
        if (!roleNameInput.trim()) return;
        const newRoleKey = editingRole ? editingRole.key : roleNameInput.toLowerCase().replace(/\s+/g, '_');
        let newDefinedRoles;
        if (editingRole) {
            newDefinedRoles = definedRoles.map(r => r.key === editingRole.key ? { ...r, label: roleNameInput } : r);
        } else {
            if (definedRoles.find(r => r.key === newRoleKey)) {
                alert('同じキーのロールが既に存在します。');
                return;
            }
            newDefinedRoles = [...definedRoles, { key: newRoleKey, label: roleNameInput }];
        }
        setDefinedRoles(newDefinedRoles);
        localStorage.setItem('definedRoles', JSON.stringify(newDefinedRoles));
        if (!editingRole) {
             setSelectedRoleKey(newRoleKey); // 新規作成時は新しいロールを選択状態にする
        }
        closeRoleDialog();
    };

    const handleDeleteRole = (roleKeyToDelete) => {
        if (definedRoles.length <= 1) {
            alert('最低1つのロールが必要です。');
            return;
        }
        if (window.confirm(`ロール「${definedRoles.find(r=>r.key === roleKeyToDelete)?.label}」を削除しますか？このロールが割り当てられているユーザーはデフォルトロール（最初のロール）になります。`)) {
            const newDefinedRoles = definedRoles.filter(r => r.key !== roleKeyToDelete);
            setDefinedRoles(newDefinedRoles);
            localStorage.setItem('definedRoles', JSON.stringify(newDefinedRoles));

            const newRolesPermissions = { ...rolesPermissions };
            delete newRolesPermissions[roleKeyToDelete];
            setRolesPermissions(newRolesPermissions);
            localStorage.setItem('rolesPermissions', JSON.stringify(newRolesPermissions));

            const defaultRoleKey = newDefinedRoles.length > 0 ? newDefinedRoles[0].key : '';
            const newUserRoles = { ...userRoles };
            Object.keys(newUserRoles).forEach(userId => {
                if (newUserRoles[userId] === roleKeyToDelete) {
                    newUserRoles[userId] = defaultRoleKey;
                }
            });
            setUserRoles(newUserRoles);
            localStorage.setItem('userRoles', JSON.stringify(newUserRoles));

            if (selectedRoleKey === roleKeyToDelete) {
                setSelectedRoleKey(defaultRoleKey);
            }
        }
    };

    useEffect(() => {
        // Save rolesPermissions whenever it changes
        localStorage.setItem('rolesPermissions', JSON.stringify(rolesPermissions));
    }, [rolesPermissions]);

    // --- User Role Assignment Tab Logic ---
    const handleUserRoleChange = (userId, newRoleKey) => {
        setUserRoles(prev => ({
            ...prev,
            [userId]: newRoleKey,
        }));
    };

    useEffect(() => {
        // Save userRoles whenever it changes
        localStorage.setItem('userRoles', JSON.stringify(userRoles));
    }, [userRoles]);


    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                権限設定
            </Typography>
            <Paper>
                <Tabs value={currentTab} onChange={handleTabChange} centered>
                    <Tab label="ロール設定" />
                    <Tab label="ユーザーへのロール割り当て" />
                </Tabs>

                {/* ロール設定タブ */}
                {currentTab === 0 && (
                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Typography variant="h6" sx={{ mb: 1 }}>ロール一覧</Typography>
                                <Button startIcon={<AddIcon />} onClick={() => openRoleDialog()} sx={{ mb: 1 }}>ロール追加</Button>
                                <List component="nav" className="permission-role-list">
                                    {definedRoles.map(role => (
                                        <ListItem
                                            button
                                            key={role.key}
                                            selected={selectedRoleKey === role.key}
                                            onClick={() => handleSelectRole(role.key)}
                                            sx={{
                                                border: selectedRoleKey === role.key ? '2px solid #1abc9c' : '2px solid transparent',
                                                backgroundColor: selectedRoleKey === role.key ? '#e0f7fa' : 'inherit',
                                                borderRadius: '8px',
                                                mb: 1,
                                                transition: 'border 0.2s, background 0.2s',
                                                boxShadow: selectedRoleKey === role.key ? '0 0 8px #1abc9c44' : 'none',
                                            }}
                                        >
                                            <ListItemText
                                                primary={role.label}
                                                primaryTypographyProps={{
                                                    fontWeight: selectedRoleKey === role.key ? 'bold' : 'normal',
                                                    color: selectedRoleKey === role.key ? '#1abc9c' : 'inherit',
                                                }}
                                            />
                                            <IconButton edge="end" aria-label="edit" onClick={e => { e.stopPropagation(); openRoleDialog(role); }}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton edge="end" aria-label="delete" onClick={e => { e.stopPropagation(); handleDeleteRole(role.key); }} disabled={definedRoles.length <= 1}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </ListItem>
                                    ))}
                                </List>
                            </Grid>
                            <Grid item xs={12} md={8}>
                                {selectedRoleKey && definedRoles.find(r => r.key === selectedRoleKey) ? (
                                    <Box>
                                        <Typography variant="h6" sx={{ mb: 2 }}>
                                            「{definedRoles.find(r => r.key === selectedRoleKey)?.label}」の画面アクセス権限
                                        </Typography>
                                        <Grid container spacing={1}>
                                            {SCREENS.map(screen => {
                                                const canAccess = rolesPermissions[selectedRoleKey]?.[screen.key] || false;
                                                return (
                                                    <Grid item xs={12} sm={6} md={4} key={screen.key}>
                                                        <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <Typography variant="body2">{screen.label}</Typography>
                                                            <Switch checked={canAccess} onChange={(e) => handleRolePermissionChange(screen.key, e.target.checked)} />
                                                        </Paper>
                                                    </Grid>
                                                );
                                            })}
                                        </Grid>
                                    </Box>
                                ) : (
                                    <Typography>ロールを選択してください。</Typography>
                                )}
                            </Grid>
                        </Grid>
                    </Box>
                )}

                {/* ユーザーロール割り当てタブ */}
                {currentTab === 1 && (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>ユーザーへのロール割り当て</Typography>
                        {accounts.length > 0 ? (
                            <List>
                                {accounts.map(acc => (
                                    <ListItem key={acc.userId} divider>
                                        <Grid container alignItems="center" spacing={2}>
                                            <Grid item xs={12} sm={4}>
                                                <ListItemText primary={`${acc.name} (${acc.userId})`} />
                                            </Grid>
                                            <Grid item xs={12} sm={8}>
                                                <FormControl fullWidth size="small">
                                                    <InputLabel>ロール</InputLabel>
                                                    <Select
                                                        value={userRoles[acc.userId] || (definedRoles.length > 0 ? definedRoles[0].key : '')}
                                                        label="ロール"
                                                        onChange={(e) => handleUserRoleChange(acc.userId, e.target.value)}
                                                    >
                                                        {definedRoles.map(role => (
                                                            <MenuItem key={role.key} value={role.key}>{role.label}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                        </Grid>
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography>登録されているアカウントがありません。</Typography>
                        )}
                    </Box>
                )}
            </Paper>

            {/* ロール追加/編集ダイアログ */}
            <Dialog open={roleDialogOpen} onClose={closeRoleDialog} maxWidth="xs" fullWidth>
                <DialogTitle>{editingRole ? 'ロール編集' : 'ロール追加'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="ロール名"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={roleNameInput}
                        onChange={(e) => setRoleNameInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveRole()}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeRoleDialog}>キャンセル</Button>
                    <Button onClick={handleSaveRole}>保存</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default PermissionSettings;
