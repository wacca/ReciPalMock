import { useEffect, useState } from 'react';
import { TextField, Button, Box, Typography, Stack, InputAdornment } from '@mui/material';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';
import { SideRailLogo } from './ui/SideRail.jsx';

const MOCK_USER_NAME = '由仁場 技朗';

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
            onLogin(MOCK_USER_NAME, userId);
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
                                落ち着いた呼吸で、一日の業務を整えましょう。
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
                            boxShadow: 'var(--shadow-glow)',
                        }}
                    >
                        ログイン
                    </Button>

                    <Typography variant="caption" sx={{ color: 'var(--ink-muted)', textAlign: 'center', lineHeight: 1.6 }}>
                        Recrova はモック環境です。<br />
                        実データは保存されません。
                    </Typography>
                </Stack>
            </Box>
        </Box>
    );
}

export default Login;
