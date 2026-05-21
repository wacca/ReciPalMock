import {
    Avatar,
    Box,
    Divider,
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import AutoModeRoundedIcon from '@mui/icons-material/AutoModeRounded';
import DensitySmallRoundedIcon from '@mui/icons-material/DensitySmallRounded';
import DensityMediumRoundedIcon from '@mui/icons-material/DensityMediumRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import { useUiPreferences } from './UiPreferencesContext.jsx';
import { PendingPulse } from './PendingPulse.jsx';
import { KeyHint } from './KeyHint.jsx';
import { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_ACCENTS, ROLE_ORDER } from '../permissions';

const isMacLike = () =>
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '');

const DisplayPreferences = () => {
    const { prefs, setMode, setDensity } = useUiPreferences();
    const toggleSx = {
        flex: 1,
        textTransform: 'none',
        paddingBlock: 0.5,
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--ink-secondary)',
        borderColor: 'var(--ink-line)',
        gap: 0.5,
        '&.Mui-selected': {
            background: 'var(--accent-primary-soft)',
            color: 'var(--accent-primary-ink)',
            borderColor: 'var(--accent-primary-soft)',
        },
        '&.Mui-selected:hover': { background: 'var(--accent-primary-soft)' },
    };
    return (
        <Stack spacing={1.25} sx={{ paddingInline: 1.5, paddingBlock: 1 }}>
            <Box>
                <Typography
                    variant="caption"
                    sx={{ color: 'var(--ink-tertiary)', fontWeight: 700, letterSpacing: 0.5, display: 'block', mb: 0.5 }}
                >
                    テーマ
                </Typography>
                <ToggleButtonGroup
                    size="small"
                    value={prefs.mode}
                    exclusive
                    onChange={(_, v) => v && setMode(v)}
                    fullWidth
                    aria-label="テーマ"
                >
                    <ToggleButton value="auto" sx={toggleSx} aria-label="自動">
                        <AutoModeRoundedIcon sx={{ fontSize: 14 }} />自動
                    </ToggleButton>
                    <ToggleButton value="light" sx={toggleSx} aria-label="ライト">
                        <LightModeRoundedIcon sx={{ fontSize: 14 }} />ライト
                    </ToggleButton>
                    <ToggleButton value="dark" sx={toggleSx} aria-label="ダーク">
                        <DarkModeRoundedIcon sx={{ fontSize: 14 }} />ダーク
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>
            <Box>
                <Typography
                    variant="caption"
                    sx={{ color: 'var(--ink-tertiary)', fontWeight: 700, letterSpacing: 0.5, display: 'block', mb: 0.5 }}
                >
                    密度
                </Typography>
                <ToggleButtonGroup
                    size="small"
                    value={prefs.density}
                    exclusive
                    onChange={(_, v) => v && setDensity(v)}
                    fullWidth
                    aria-label="密度"
                >
                    <ToggleButton value="comfortable" sx={toggleSx} aria-label="ふつう">
                        <DensityMediumRoundedIcon sx={{ fontSize: 14 }} />ふつう
                    </ToggleButton>
                    <ToggleButton value="compact" sx={toggleSx} aria-label="コンパクト">
                        <DensitySmallRoundedIcon sx={{ fontSize: 14 }} />コンパクト
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>
        </Stack>
    );
};

export const TopStrip = ({
    activeItem,
    breadcrumb,
    username,
    userId,
    onLogout,
    onOpenMobileNav,
    onOpenPalette,
    isDesktop,
    baseRole = ROLES.EMPLOYEE,
    effectiveRole = ROLES.EMPLOYEE,
    onRoleChange,
    isRoleOverridden = false,
}) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const mac = isMacLike();
    const roleAccent = ROLE_ACCENTS[effectiveRole] || ROLE_ACCENTS[ROLES.EMPLOYEE];

    const handleRoleSelect = (role) => {
        if (!onRoleChange) return;
        // baseRole に戻すときは null を渡して override を解除
        onRoleChange(role === baseRole ? null : role);
        setAnchorEl(null);
    };

    return (
        <Box
            component="header"
            sx={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                paddingInline: { xs: 1.5, md: 3 },
                paddingBlock: 1,
                background: 'var(--surface-rail-top)',
                backdropFilter: 'blur(16px) saturate(140%)',
                WebkitBackdropFilter: 'blur(16px) saturate(140%)',
                borderBottom: '1px solid var(--ink-line)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                minHeight: 'var(--top-strip-h)',
                height: 'var(--top-strip-h)',
            }}
        >
            {!isDesktop && (
                <IconButton onClick={onOpenMobileNav} aria-label="メニューを開く" sx={{ color: 'var(--ink-primary)' }}>
                    <MenuRoundedIcon />
                </IconButton>
            )}
            <Box sx={{ minWidth: 0, flexShrink: 1 }}>
                {breadcrumb && (
                    <Typography
                        variant="caption"
                        sx={{
                            color: 'var(--ink-tertiary)',
                            fontWeight: 600,
                            letterSpacing: 0.4,
                            display: 'block',
                            lineHeight: 1.1,
                        }}
                    >
                        {breadcrumb}
                    </Typography>
                )}
                <Typography
                    variant="subtitle1"
                    sx={{
                        fontWeight: 800,
                        color: 'var(--ink-primary)',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {activeItem?.label || ''}
                </Typography>
            </Box>
            <Box sx={{ flex: 1 }} />
            <Box
                component="button"
                onClick={onOpenPalette}
                sx={{
                    display: { xs: 'none', sm: 'inline-flex' },
                    alignItems: 'center',
                    gap: 1,
                    background: 'var(--surface-sunken)',
                    border: '1px solid transparent',
                    color: 'var(--ink-tertiary)',
                    paddingInline: 1.5,
                    paddingBlock: 0.75,
                    borderRadius: 'var(--radius-pill)',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    transition: 'var(--motion-fast)',
                    minWidth: { sm: 240, md: 320 },
                    '&:hover': { borderColor: 'var(--accent-primary)', color: 'var(--ink-secondary)' },
                }}
                aria-label="コマンドパレットを開く"
            >
                <SearchRoundedIcon sx={{ fontSize: 18 }} />
                <Box sx={{ flex: 1, textAlign: 'left' }}>画面・操作を検索…</Box>
                <KeyHint keys={[mac ? 'Mod' : 'Ctrl', 'K']} />
            </Box>
            <IconButton
                onClick={onOpenPalette}
                aria-label="検索"
                sx={{
                    display: { xs: 'inline-flex', sm: 'none' },
                    color: 'var(--ink-secondary)',
                }}
            >
                <SearchRoundedIcon />
            </IconButton>
            <PendingPulse />
            <Tooltip title={isRoleOverridden ? `ロール切替中: ${ROLE_LABELS[effectiveRole]} (本来 ${ROLE_LABELS[baseRole]})` : ROLE_LABELS[effectiveRole]} arrow>
                <Box
                    sx={{
                        display: { xs: 'none', md: 'inline-flex' },
                        alignItems: 'center',
                        gap: 0.5,
                        background: roleAccent.bg,
                        color: roleAccent.fg,
                        paddingInline: 1.25,
                        paddingBlock: 0.5,
                        borderRadius: 'var(--radius-pill)',
                        fontSize: 12,
                        fontWeight: 700,
                        border: isRoleOverridden ? `1px dashed ${roleAccent.fg}` : 'none',
                    }}
                >
                    {isRoleOverridden && <SwapHorizRoundedIcon sx={{ fontSize: 14 }} />}
                    {ROLE_LABELS[effectiveRole]}
                </Box>
            </Tooltip>
            <Tooltip title={`${username} (${userId})`} arrow>
                <IconButton
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    aria-label="ユーザーメニュー"
                    sx={{ p: 0.5 }}
                >
                    <Avatar
                        sx={{
                            width: 36,
                            height: 36,
                            background: 'var(--accent-primary-soft)',
                            color: 'var(--accent-primary)',
                            fontWeight: 700,
                            fontSize: 14,
                        }}
                    >
                        {(username && username[0]) || <AccountCircleRoundedIcon />}
                    </Avatar>
                </IconButton>
            </Tooltip>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: { mt: 0.5, minWidth: 280, p: 0.5 } }}
            >
                <Box sx={{ paddingInline: 1.5, paddingBlock: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {username}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                        {userId}
                    </Typography>
                    <Box sx={{ mt: 0.75 }}>
                        <Box sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            background: roleAccent.bg,
                            color: roleAccent.fg,
                            paddingInline: 1,
                            paddingBlock: 0.25,
                            borderRadius: 'var(--radius-pill)',
                            fontSize: 11,
                            fontWeight: 700,
                            border: isRoleOverridden ? `1px dashed ${roleAccent.fg}` : 'none',
                        }}>
                            {ROLE_LABELS[effectiveRole]}{isRoleOverridden ? '（切替中）' : ''}
                        </Box>
                    </Box>
                </Box>
                <Divider sx={{ my: 0.5 }} />
                <Box sx={{ paddingInline: 1.5, paddingBlock: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', fontWeight: 700, letterSpacing: 0.5 }}>
                        表示
                    </Typography>
                </Box>
                <DisplayPreferences />
                <Divider sx={{ my: 0.5 }} />
                <Box sx={{ paddingInline: 1.5, paddingBlock: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', fontWeight: 700, letterSpacing: 0.5 }}>
                        ロール切替（デモ用）
                    </Typography>
                </Box>
                {ROLE_ORDER.map((role) => {
                    const accent = ROLE_ACCENTS[role];
                    const selected = effectiveRole === role;
                    const isBase = role === baseRole;
                    return (
                        <MenuItem
                            key={role}
                            onClick={() => handleRoleSelect(role)}
                            selected={selected}
                            sx={{
                                borderRadius: 'var(--radius-md)',
                                marginBlock: 0.25,
                                '&.Mui-selected': { background: 'var(--surface-sunken)' },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 28, color: selected ? accent.fg : 'var(--ink-muted)' }}>
                                {selected ? <CheckRoundedIcon fontSize="small" /> : <Box sx={{ width: 18 }} />}
                            </ListItemIcon>
                            <ListItemText
                                primary={(
                                    <Stack direction="row" alignItems="center" spacing={0.75}>
                                        <Typography variant="body2" sx={{ fontWeight: selected ? 700 : 500 }}>
                                            {ROLE_LABELS[role]}
                                        </Typography>
                                        {isBase && (
                                            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', fontSize: 11, fontWeight: 600 }}>
                                                本来
                                            </Typography>
                                        )}
                                    </Stack>
                                )}
                                secondary={(
                                    <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', fontSize: 11, display: 'block', lineHeight: 1.3 }}>
                                        {ROLE_DESCRIPTIONS[role]}
                                    </Typography>
                                )}
                            />
                        </MenuItem>
                    );
                })}
                <Divider sx={{ my: 0.5 }} />
                <MenuItem onClick={() => { setAnchorEl(null); onLogout?.(); }} sx={{ borderRadius: 'var(--radius-md)' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <LogoutRoundedIcon fontSize="small" sx={{ color: 'var(--ink-tertiary)' }} />
                        <Typography variant="body2">ログアウト</Typography>
                    </Stack>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default TopStrip;
