import {
    Avatar,
    Box,
    IconButton,
    Menu,
    MenuItem,
    Stack,
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
import { useUiPreferences } from './UiPreferencesContext.jsx';
import { PendingPulse } from './PendingPulse.jsx';
import { KeyHint } from './KeyHint.jsx';

const isMacLike = () =>
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '');

const ThemeToggle = () => {
    const { prefs, setMode } = useUiPreferences();
    const cycle = () => {
        const order = ['auto', 'light', 'dark'];
        const i = order.indexOf(prefs.mode);
        setMode(order[(i + 1) % order.length]);
    };
    const labelMap = { auto: '自動', light: 'ライト', dark: 'ダーク' };
    const Icon = prefs.mode === 'auto' ? AutoModeRoundedIcon : prefs.mode === 'dark' ? DarkModeRoundedIcon : LightModeRoundedIcon;
    return (
        <Tooltip title={`テーマ：${labelMap[prefs.mode]}（クリックで切替）`} arrow>
            <IconButton size="small" onClick={cycle} aria-label="テーマ切替"
                sx={{
                    width: 36, height: 36,
                    color: 'var(--ink-secondary)',
                    '&:hover': { background: 'var(--surface-sunken)', color: 'var(--ink-primary)' },
                }}
            >
                <Icon fontSize="small" />
            </IconButton>
        </Tooltip>
    );
};

const DensityToggle = () => {
    const { prefs, setDensity } = useUiPreferences();
    const isCompact = prefs.density === 'compact';
    return (
        <Tooltip title={isCompact ? '密度：コンパクト' : '密度：コンフォート'} arrow>
            <IconButton size="small" onClick={() => setDensity(isCompact ? 'comfortable' : 'compact')}
                aria-label="密度切替"
                sx={{
                    width: 36, height: 36,
                    color: 'var(--ink-secondary)',
                    '&:hover': { background: 'var(--surface-sunken)', color: 'var(--ink-primary)' },
                }}
            >
                {isCompact ? <DensitySmallRoundedIcon fontSize="small" /> : <DensityMediumRoundedIcon fontSize="small" />}
            </IconButton>
        </Tooltip>
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
}) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const mac = isMacLike();

    return (
        <Box
            component="header"
            sx={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                paddingInline: { xs: 1.5, md: 3 },
                paddingBlock: 1.25,
                background: 'var(--surface-rail-top)',
                backdropFilter: 'blur(16px) saturate(140%)',
                WebkitBackdropFilter: 'blur(16px) saturate(140%)',
                borderBottom: '1px solid var(--ink-line)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                minHeight: 60,
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
            <DensityToggle />
            <ThemeToggle />
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
                PaperProps={{ sx: { mt: 0.5, minWidth: 220, p: 0.5 } }}
            >
                <Box sx={{ paddingInline: 1.5, paddingBlock: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {username}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                        {userId}
                    </Typography>
                </Box>
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
