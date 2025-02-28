import { useState } from 'react';
import { Container, TextField, Button, Box, Typography } from '@mui/material';

function Login({ onLogin }) {
    const username = useState('由仁場 技朗');
    const [userId, setUserId] = useState('univatech@univa.tech');
    const [password, setPassword] = useState('1111111');

    const handleLogin = () => {
        if (username && password) {
            onLogin(username, userId);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    ログイン
                </Typography>
                <TextField
                    fullWidth
                    margin="normal"
                    label="ユーザーID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    required
                />
                <TextField
                    fullWidth
                    margin="normal"
                    label="パスワード"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleLogin}
                    fullWidth
                    sx={{ mt: 2 }}
                >
                    ログイン
                </Button>
            </Box>
        </Container>
    );
}

export default Login;