import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ApprovalIcon from '@mui/icons-material/ThumbUp';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import SettingsIcon from '@mui/icons-material/Settings';

const primaryActions = [
    {
        title: '勤怠を入力',
        description: '今月のタイムシートをまとめて入力します。',
        path: '/attendance-input',
        icon: <AccessTimeIcon />,
        tone: 'primary',
    },
    {
        title: '経費を申請',
        description: '領収書と明細を入力して下書き保存できます。',
        path: '/application',
        icon: <AssignmentIcon />,
        tone: 'secondary',
    },
    {
        title: '休暇を申請',
        description: '有給・遅刻・早退などの勤怠申請を作成します。',
        path: '/leave-application',
        icon: <EventAvailableIcon />,
        tone: 'warning',
    },
    {
        title: '承認を確認',
        description: '経費と休暇の承認待ちを確認します。',
        path: '/approvals',
        icon: <ApprovalIcon />,
        tone: 'neutral',
    },
];

const statusCards = [
    { label: '勤怠入力', value: '2日', caption: 'サンプル入力済み' },
    { label: '経費申請', value: '2件', caption: '申請済みモック' },
    { label: '承認待ち', value: '2件', caption: '経費承認画面に反映' },
    { label: '休暇申請', value: '3件', caption: 'ローカル保存対象' },
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
                    startIcon={<AccessTimeIcon />}
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
                                onClick={() => navigate(action.path)}
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
