import { Box, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUiPreferences } from './UiPreferencesContext.jsx';
import { loadExpenseApplications } from '../expenseApplicationStore.js';
import { loadLeaveApplications, loadLeaveDrafts } from '../leaveApplicationStore.js';

const countPendingExpense = () => {
    try {
        const apps = loadExpenseApplications();
        let count = 0;
        for (const app of apps) {
            const details = app?.details || [];
            for (const row of details) {
                if (row?.status === '申請中') count += 1;
            }
        }
        return count;
    } catch {
        return 0;
    }
};

const countPendingLeave = () => {
    try {
        const apps = loadLeaveApplications();
        return apps.filter((a) => a?.status === '申請中').length;
    } catch {
        return 0;
    }
};

const countDrafts = () => {
    try {
        let e = 0;
        try {
            e = JSON.parse(localStorage.getItem('expenseDrafts') || '[]').length;
        } catch {
            /* ignore */
        }
        const leave = loadLeaveDrafts();
        return e + (Array.isArray(leave) ? leave.length : 0);
    } catch {
        return 0;
    }
};

const sample = () => ({
    expense: countPendingExpense(),
    leave: countPendingLeave(),
    drafts: countDrafts(),
});

export const PENDING_OVERLOAD_THRESHOLD = 9;

export const tonePending = (count) => {
    if (!count || count <= 0) {
        return {
            level: 'idle',
            fg: 'var(--ink-tertiary)',
            bg: 'var(--surface-sunken)',
            solid: 'var(--accent-leaf)',
        };
    }
    if (count >= PENDING_OVERLOAD_THRESHOLD) {
        return {
            level: 'overload',
            fg: 'var(--accent-amber)',
            bg: 'var(--accent-amber-soft)',
            solid: 'var(--accent-amber)',
        };
    }
    return {
        level: 'active',
        fg: 'var(--accent-iris)',
        bg: 'var(--accent-iris-soft)',
        solid: 'var(--accent-iris)',
    };
};

export const usePendingCounts = () => {
    const [counts, setCounts] = useState(() => sample());

    useEffect(() => {
        const refresh = () => setCounts(sample());
        const t = window.setInterval(refresh, 2500);
        const onFocus = () => refresh();
        const onStorage = () => refresh();
        window.addEventListener('focus', onFocus);
        window.addEventListener('storage', onStorage);
        return () => {
            window.clearInterval(t);
            window.removeEventListener('focus', onFocus);
            window.removeEventListener('storage', onStorage);
        };
    }, []);

    return counts;
};

export const PendingPulse = () => {
    const navigate = useNavigate();
    const { prefs } = useUiPreferences();
    const counts = usePendingCounts();
    const total = counts.expense + counts.leave;
    const tone = tonePending(total);
    const pulsing = prefs.pulse && tone.level === 'overload';

    const dest = useMemo(() => (counts.expense >= counts.leave ? '/approvals' : '/leave-approvals'), [counts]);

    if (total === 0) {
        return (
            <Stack
                direction="row"
                alignItems="center"
                spacing={0.75}
                sx={{
                    paddingInline: 1.25,
                    paddingBlock: 0.5,
                    borderRadius: 'var(--radius-pill)',
                    background: tone.bg,
                    color: tone.fg,
                    fontSize: 12,
                    fontWeight: 600,
                }}
            >
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: tone.solid }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>承認待ち 0</Typography>
            </Stack>
        );
    }

    return (
        <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            onClick={() => navigate(dest)}
            sx={{
                cursor: 'pointer',
                paddingInline: 1.25,
                paddingBlock: 0.5,
                borderRadius: 'var(--radius-pill)',
                background: tone.bg,
                color: tone.fg,
                transition: 'var(--motion-base)',
                '&:hover': { transform: 'translateY(-1px)', boxShadow: 'var(--shadow-1)' },
            }}
        >
            <Box
                aria-hidden
                sx={{
                    position: 'relative',
                    width: 8,
                    height: 8,
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background: tone.solid,
                        animation: pulsing ? 'recrovaPulse 1800ms ease-in-out infinite' : 'none',
                    },
                }}
            />
            <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
                承認待ち {total}件
            </Typography>
        </Stack>
    );
};

export default PendingPulse;
