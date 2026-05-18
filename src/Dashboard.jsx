import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import PunchClockIcon from '@mui/icons-material/PunchClock';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import SettingsIcon from '@mui/icons-material/Settings';

const primaryActions = [
    {
        title: '勤怠を入力',
        description: '今月のタイムシートをまとめて入力します。',
        path: '/attendance-input',
        icon: <PunchClockIcon />,
        tone: 'primary',
    },
    {
        title: '経費を申請',
        description: '領収書と明細を入力して下書き保存できます。',
        path: '/application',
        state: { startNew: true },
        icon: <RequestQuoteIcon />,
        tone: 'secondary',
    },
    {
        title: '休暇を申請',
        description: '有給・遅刻・早退などの勤怠申請を作成します。',
        path: '/leave-application',
        state: { startNew: true },
        icon: <EventAvailableIcon />,
        tone: 'warning',
    },
    {
        title: '経費承認',
        description: '経費申請の承認待ちを確認します。',
        path: '/approvals',
        icon: <FactCheckIcon />,
        tone: 'neutral',
    },
    {
        title: '休暇承認',
        description: '休暇申請の承認待ちを確認します。',
        path: '/leave-approvals',
        icon: <HowToRegIcon />,
        tone: 'neutral',
    },
];

const statusCards = [
    { label: '勤怠入力', value: '2日', caption: 'サンプル入力済み' },
    { label: '経費申請', value: '2件', caption: '申請済みモック' },
    { label: '休暇申請', value: '3件', caption: 'ローカル保存対象' },
    { label: '経費承認待ち', value: '2件', caption: '経費承認画面に反映' },
    { label: '休暇承認待ち', value: '1件', caption: '休暇承認画面に反映' },
];

function Dashboard({ username = '' }) {
    const navigate = useNavigate();

    return (
        <Box className="dashboardPage">
            <Box className="pageHero">
                <Box>
                    <Typography variant="overline" color="text.secondary">
                        Recrova Mock
                    </Typography>
                    <Typography variant="h5">
                        {username ? `${username}さんのワークスペース` : 'ワークスペース'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        申請、承認、勤怠入力をここから開始できます。
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<PunchClockIcon />}
                    onClick={() => navigate('/attendance-input')}
                >
                    勤怠入力へ
                </Button>
            </Box>

            <Box className="dashboardMetrics">
                {statusCards.map(card => (
                    <Paper key={card.label} className="metricCard">
                        <Typography variant="caption" color="text.secondary">
                            {card.label}
                        </Typography>
                        <Typography variant="h5">
                            {card.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {card.caption}
                        </Typography>
                    </Paper>
                ))}
            </Box>

            <Box className="dashboardGrid">
                <Paper className="workflowPanel">
                    <Box className="panelHeader">
                        <Box>
                            <Typography variant="h6">
                                よく使う操作
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                入力作業にすぐ移動できます。
                            </Typography>
                        </Box>
                    </Box>
                    <Box className="actionGrid">
                        {primaryActions.map(action => (
                            <Button
                                key={action.title}
                                className={`quickAction quickAction-${action.tone}`}
                                onClick={() => navigate(action.path, action.state ? { state: action.state } : undefined)}
                            >
                                <Box className="quickActionIcon">
                                    {action.icon}
                                </Box>
                                <Box className="quickActionText">
                                    <Typography variant="subtitle1">
                                        {action.title}
                                    </Typography>
                                    <Typography variant="body2">
                                        {action.description}
                                    </Typography>
                                </Box>
                            </Button>
                        ))}
                    </Box>
                </Paper>

                <Paper className="workflowPanel sidePanel">
                    <Box className="panelHeader">
                        <Box>
                            <Typography variant="h6">
                                管理メニュー
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                初期設定と権限を確認します。
                            </Typography>
                        </Box>
                        <SettingsIcon color="primary" />
                    </Box>
                    <Stack spacing={1.25}>
                        {[
                            ['申請フロー設定', '/flow-settings-menu'],
                            ['アラート設定', '/reminder-settings'],
                            ['アカウント管理', '/account-management'],
                            ['マスタ管理', '/master-settings'],
                            ['権限設定', '/permission-settings'],
                        ].map(([label, path]) => (
                            <Button
                                key={label}
                                variant="outlined"
                                color="inherit"
                                onClick={() => navigate(path)}
                                sx={{ justifyContent: 'space-between' }}
                            >
                                {label}
                                <Chip label="設定" size="small" />
                            </Button>
                        ))}
                    </Stack>
                </Paper>
            </Box>
        </Box>
    );
}

export default Dashboard;
