import { Box, Stack, Typography } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import { getHistoryEventLabel, sortHistoryAsc } from '../utils/applicationHistory';

const ICON_BY_EVENT = {
    submit:    { Icon: HourglassTopRoundedIcon,        bg: 'var(--accent-iris-soft)',  fg: 'var(--accent-iris)' },
    approve:   { Icon: CheckCircleRoundedIcon,         bg: 'var(--accent-leaf-soft)',  fg: 'var(--accent-leaf)' },
    reject:    { Icon: AssignmentReturnRoundedIcon,    bg: 'var(--accent-rose-soft)',  fg: 'var(--accent-rose)' },
    sendback:  { Icon: AssignmentReturnRoundedIcon,    bg: 'var(--accent-rose-soft)',  fg: 'var(--accent-rose)' },
    withdraw:  { Icon: RemoveCircleOutlineRoundedIcon, bg: 'var(--accent-slate-soft)', fg: 'var(--accent-slate)' },
    unapprove: { Icon: UndoRoundedIcon,                bg: 'var(--accent-amber-soft)', fg: 'var(--accent-amber)' },
    edit:      { Icon: EditNoteRoundedIcon,            bg: 'var(--surface-sunken)',    fg: 'var(--ink-tertiary)' },
};

const DEFAULT_VISUAL = { Icon: EditNoteRoundedIcon, bg: 'var(--surface-sunken)', fg: 'var(--ink-tertiary)' };

function ApplicationHistoryTimeline({ history, dense = false }) {
    const items = sortHistoryAsc(history);
    if (items.length === 0) {
        return (
            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                操作履歴はまだ記録されていません。
            </Typography>
        );
    }
    const pad = dense ? 0.25 : 0.5;
    return (
        <Stack spacing={dense ? 0.75 : 1} sx={{ position: 'relative' }}>
            {items.map((evt, idx) => {
                const visual = ICON_BY_EVENT[evt.eventType] || DEFAULT_VISUAL;
                const Icon = visual.Icon;
                const isLast = idx === items.length - 1;
                return (
                    <Stack key={evt.id || idx} direction="row" spacing={1.25} alignItems="flex-start">
                        <Box sx={{ position: 'relative', flexShrink: 0 }}>
                            <Box
                                sx={{
                                    width: 24, height: 24,
                                    borderRadius: '50%',
                                    display: 'grid', placeItems: 'center',
                                    background: visual.bg,
                                    color: visual.fg,
                                }}
                            >
                                <Icon sx={{ fontSize: 14 }} />
                            </Box>
                            {!isLast && (
                                <Box
                                    aria-hidden
                                    sx={{
                                        position: 'absolute',
                                        left: '50%', top: 24, bottom: -8,
                                        transform: 'translateX(-50%)',
                                        width: 2,
                                        background: 'var(--ink-line)',
                                    }}
                                />
                            )}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0, paddingBottom: pad }}>
                            <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap">
                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'var(--ink-primary)' }}>
                                    {getHistoryEventLabel(evt.eventType)}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                                    {evt.at ? new Date(evt.at).toLocaleString() : ''}
                                </Typography>
                            </Stack>
                            <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)', display: 'block' }}>
                                {evt.actorLabel || '-'}
                                {evt.fromStatus && evt.toStatus && (
                                    <Box component="span" sx={{ ml: 1, color: 'var(--ink-muted)' }}>
                                        {evt.fromStatus} → {evt.toStatus}
                                    </Box>
                                )}
                            </Typography>
                            {evt.comment && (
                                <Typography variant="caption" sx={{ color: 'var(--ink-secondary)', display: 'block', mt: 0.25, whiteSpace: 'pre-wrap' }}>
                                    理由: {evt.comment}
                                </Typography>
                            )}
                        </Box>
                    </Stack>
                );
            })}
        </Stack>
    );
}

export default ApplicationHistoryTimeline;
