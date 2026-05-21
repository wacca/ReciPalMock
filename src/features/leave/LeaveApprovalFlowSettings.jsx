import { FlowSettingsScreen } from '../expense/ApprovalFlowSettings.jsx';

const SAMPLE_FLOWS = [
    {
        type: 'user',
        target: '由仁場 技朗',
        steps: [
            { role: '申請者', name: '由仁場 技朗', email: 'univatech@univa.tech' },
            { role: '一次承認者', name: '油ニ 和平', email: 'univapay@univa.tech' },
            { role: '最終承認者', name: '由引 安人', email: 'ubiast@univa.tech' },
        ],
    },
];

const PAGE = {
    eyebrow: '管理 ・ フロー',
    title: '勤怠申請 承認フロー設定',
    subtitle: '個人または部署ごとに勤怠申請（休暇・時間休・遅刻・早退）の承認経路を設定します。',
};

function LeaveApprovalFlowSettings() {
    return <FlowSettingsScreen storageKey="leaveApprovalFlows" page={PAGE} sampleFlows={SAMPLE_FLOWS} />;
}

export default LeaveApprovalFlowSettings;
