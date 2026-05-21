import { useEffect, useState } from 'react';
import { TextField, Button, Box, Typography, Stack, InputAdornment } from '@mui/material';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';
import { SideRailLogo } from '../../shared/ui/SideRail.jsx';
import { USER_DIRECTORY, getUserProfile } from '../../shared/utils/userDirectory';
import { ROLE_LABELS } from '../../shared/utils/permissions';

function Login({ onLogin }) {
    const [userId, setUserId] = useState('univatech@univa.tech');
    const [password, setPassword] = useState('1111111');
    const [capsLock, setCapsLock] = useState(false);

    useEffect(() => {
        const onKey = (e) => {
            if (typeof e.getModifierState === 'function') {
                setCapsLock(e.getModifierState('CapsLock'));
            }
        };
        window.addEventListener('keydown', onKey);
        window.addEventListener('keyup', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('keyup', onKey);
        };
    }, []);

    const handleLogin = (event) => {
        event.preventDefault();
        if (userId && password) {
            const profile = getUserProfile(userId);
            onLogin(profile.name, profile.id);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'grid',
                placeItems: 'center',
                paddingInline: 2,
                position: 'relative',
                overflow: 'hidden',
                background:
                    'radial-gradient(circle at 18% 14%, var(--accent-primary-soft), transparent 45%),' +
                    'radial-gradient(circle at 82% 90%, var(--accent-iris-soft), transparent 50%),' +
                    'var(--surface-base)',
            }}
        >
            <Box
                aria-hidden
                sx={{
                    position: 'absolute',
                    inset: 0,
                    background:
                        'radial-gradient(circle at 50% 50%, transparent 0%, rgba(15,23,42,0.04) 70%, rgba(15,23,42,0.06) 100%)',
                    pointerEvents: 'none',
                }}
            />
            <Box
                component="form"
                onSubmit={handleLogin}
                sx={{
                    position: 'relative',
                    width: 'min(420px, 100%)',
                    background: 'var(--surface-raised)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow-3)',
                    padding: { xs: 3, md: 4 },
                    animation: 'recrovaFloatIn 360ms cubic-bezier(.2,.8,.2,1)',
                }}
            >
                <Stack spacing={3.5}>
                    <Stack spacing={2.5} alignItems="flex-start">
                        <SideRailLogo />
                        <Box>
                            <Typography
                                variant="overline"
                                sx={{ color: 'var(--accent-primary)', fontWeight: 700, letterSpacing: 1.4 }}
                            >
                                Welcome back
                            </Typography>
                            <Typography
                                variant="h5"
                                sx={{ fontWeight: 800, lineHeight: 1.2, mt: 0.5, color: 'var(--ink-primary)' }}
                            >
                                おかえりなさい
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'var(--ink-tertiary)', mt: 0.5 }}>
                                ログインして業務を始めましょう。
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            label="ユーザーID"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            required
                            autoComplete="username"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <AccountCircleRoundedIcon sx={{ color: 'var(--ink-tertiary)' }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            fullWidth
                            label="パスワード"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockRoundedIcon sx={{ color: 'var(--ink-tertiary)' }} />
                                    </InputAdornment>
                                ),
                            }}
                            helperText={capsLock ? 'CapsLock が ON になっています。' : ' '}
                            FormHelperTextProps={{
                                sx: { color: capsLock ? 'var(--accent-amber)' : 'transparent' },
                            }}
                        />
                    </Stack>

                    <Button
                        variant="contained"
                        color="primary"
                        type="submit"
                        fullWidth
                        size="large"
                        disabled={!userId || !password}
                        endIcon={<KeyboardArrowRightRoundedIcon />}
                        sx={{
                            paddingBlock: 1.4,
                            fontSize: 16,
                            borderRadius: 'var(--radius-pill)',
                            boxShadow: 'var(--shadow-2)',
                            '&:hover': { boxShadow: 'var(--shadow-2)' },
                            '&:focus-visible': { boxShadow: 'var(--shadow-glow)' },
                        }}
                    >
                        ログイン
                    </Button>

                    <Box sx={{
                        background: 'var(--surface-sunken)',
                        borderRadius: 'var(--radius-md)',
                        padding: 1.5,
                    }}>
                        <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', fontWeight: 700, letterSpacing: 0.5, display: 'block', mb: 0.75 }}>
                            デモアカウント（任意の ID でログイン可）
                        </Typography>
                        <Stack spacing={0.5}>
                            {USER_DIRECTORY.map((u) => (
                                <Box
                                    key={u.id}
                                    component="button"
                                    type="button"
                                    onClick={() => setUserId(u.id)}
                                    sx={{
                                        all: 'unset',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: 1,
                                        padding: 0.5,
                                        paddingInline: 0.75,
                                        borderRadius: 'var(--radius-sm)',
                                        '&:hover': { background: 'var(--surface-raised)' },
                                    }}
                                >
                                    <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                        <Typography variant="caption" sx={{ color: 'var(--ink-primary)', fontWeight: 600, lineHeight: 1.2 }}>
                                            {u.name}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', fontSize: 11, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {u.id}
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" sx={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: 10, whiteSpace: 'nowrap' }}>
                                        {ROLE_LABELS[u.role]}
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>
                    </Box>

                    <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', textAlign: 'center', lineHeight: 1.6 }}>
                        Recrova はモック環境です。<br />
                        実データは保存されません。
                    </Typography>
                </Stack>
            </Box>
        </Box>
    );
}

export default Login;
