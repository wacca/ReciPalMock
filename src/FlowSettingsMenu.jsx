import { Container, Typography, Box, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function FlowSettingsMenu() {
    const navigate = useNavigate();
    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                    申請フロー設定
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Button variant="contained" color="primary" size="large" onClick={() => navigate('/approval-flow-settings')}>
                        経費承認フロー設定
                    </Button>
                    <Button variant="contained" color="secondary" size="large" onClick={() => navigate('/leave-approval-flow-settings')}>
                        有給承認フロー設定
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}

export default FlowSettingsMenu;

