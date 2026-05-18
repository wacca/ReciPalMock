import { useState } from 'react';
import { Container, TextField, Button, Box, Typography, Paper, Stack, InputAdornment } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockIcon from '@mui/icons-material/Lock';

const MOCK_USER_NAME = '由仁場 技朗';

function Login({ onLogin }) {
    const [userId, setUserId] = useState('univatech@univa.tech');
    const [password, setPassword] = useState('1111111');

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
                px: 2,
                background: 'linear-gradient(135deg, #eef7f5 0%, #f7f9fc 50%, #eef3fb 100%)',
            }}
        >
            <Container maxWidth="xs">
                <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                    <Stack component="form" spacing={2.5} onSubmit={handleLogin}>
                        <Box>
                            <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                                Recrova
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                モック環境にログイン
                            </Typography>
                        </Box>
                        <TextField
                            fullWidth
                            label="ユーザーID"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            required
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <AccountCircleIcon fontSize="small" />
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
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            type="submit"
                            fullWidth
                            size="large"
                            disabled={!userId || !password}
                        >
                            ログイン
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}

export default Login;
