import { Container, Typography, Box, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

function FlowSettingsMenu() {
    const navigate = useNavigate();
    return (
        <Container>
            <Paper>
                <Typography variant="h6">
                    申請フロー設定
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    申請種別ごとの承認経路を設定します。
                </Typography>
                <Box className="settingsChoiceGrid">
                    <Button className="settingsChoice" onClick={() => navigate('/approval-flow-settings')}>
                        <Box className="settingsChoiceIcon">
                            <AccountTreeIcon />
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                経費承認フロー設定
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                経費申請の個人・部署別フローを編集します。
                            </Typography>
                        </Box>
                    </Button>
                    <Button className="settingsChoice" onClick={() => navigate('/leave-approval-flow-settings')}>
                        <Box className="settingsChoiceIcon secondary">
                            <EventAvailableIcon />
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                休暇承認フロー設定
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                休暇申請の承認者と順序を編集します。
                            </Typography>
                        </Box>
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}

export default FlowSettingsMenu;

