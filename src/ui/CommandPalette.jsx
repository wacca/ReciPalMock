import { Backdrop, Box, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import { KeyHint } from './KeyHint.jsx';

const HISTORY_KEY = 'recrova:cmdk:history:v1';

const fuzzyMatch = (query, target) => {
    if (!query) return { score: 0, matched: true };
    const q = query.toLowerCase();
    const t = target.toLowerCase();
    if (t.includes(q)) {
        const idx = t.indexOf(q);
        return { score: 200 - idx + q.length * 3, matched: true };
    }
    let ti = 0;
    let score = 0;
    for (const ch of q) {
        const found = t.indexOf(ch, ti);
        if (found === -1) return { score: 0, matched: false };
        score += 5 - Math.min(4, found - ti);
        ti = found + 1;
    }
    return { score, matched: true };
};

const readHistory = () => {
    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        if (!raw) return [];
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr.slice(0, 8) : [];
    } catch {
        return [];
    }
};

const writeHistory = (paths) => {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(paths.slice(0, 8)));
    } catch {
        /* ignore */
    }
};

export const useCommandPalette = () => {
    const [open, setOpen] = useState(false);
    useEffect(() => {
        const onKey = (e) => {
            const mod = e.metaKey || e.ctrlKey;
            if (mod && (e.key === 'k' || e.key === 'K')) {
                e.preventDefault();
                setOpen((v) => !v);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);
    return { open, setOpen };
};

export const CommandPalette = ({ open, onClose, commands }) => {
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    useEffect(() => {
        if (open) {
            setQuery('');
            setActive(0);
            setTimeout(() => inputRef.current?.focus(), 30);
        }
    }, [open]);

    const history = useMemo(() => (open ? readHistory() : []), [open]);

    const results = useMemo(() => {
        const q = query.trim();
        if (!q) {
            const recent = history
                .map((path) => commands.find((c) => c.id === path))
                .filter(Boolean)
                .map((c) => ({ ...c, _section: '直近' }));
            const screens = commands
                .filter((c) => c.kind === 'route')
                .map((c) => ({ ...c, _section: '画面' }));
            const actions = commands
                .filter((c) => c.kind === 'action')
                .map((c) => ({ ...c, _section: 'アクション' }));
            return [...recent, ...screens, ...actions];
        }
        const scored = commands
            .map((c) => {
                const text = `${c.label} ${c.subtitle || ''} ${c.keywords || ''}`;
                const r = fuzzyMatch(q, text);
                return r.matched ? { ...c, _score: r.score, _section: c.kind === 'route' ? '画面' : 'アクション' } : null;
            })
            .filter(Boolean)
            .sort((a, b) => b._score - a._score)
            .slice(0, 18);
        return scored;
    }, [query, commands, history]);

    useEffect(() => {
        if (active >= results.length) setActive(0);
    }, [results.length, active]);

    const run = (cmd) => {
        if (!cmd) return;
        const next = [cmd.id, ...readHistory().filter((p) => p !== cmd.id)];
        writeHistory(next);
        onClose();
        cmd.run?.();
    };

    const onKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, Math.max(results.length - 1, 0)));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            run(results[active]);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };

    useEffect(() => {
        if (!listRef.current) return;
        const el = listRef.current.querySelector(`[data-cmd-idx="${active}"]`);
        el?.scrollIntoView({ block: 'nearest' });
    }, [active]);

    if (!open) return null;

    let lastSection = null;

    return (
        <Backdrop
            open
            onClick={onClose}
            sx={{
                zIndex: 2000,
                background: 'var(--scrim)',
                backdropFilter: 'blur(6px)',
                alignItems: 'flex-start',
                pt: { xs: 8, md: 12 },
            }}
        >
            <Box
                onClick={(e) => e.stopPropagation()}
                sx={{
                    width: { xs: 'min(94vw, 560px)', md: 640 },
                    background: 'var(--surface-overlay)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-3)',
                    overflow: 'hidden',
                    animation: 'recrovaFloatIn 220ms cubic-bezier(.2,.8,.2,1)',
                }}
            >
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    sx={{ paddingInline: 2.5, paddingBlock: 2, borderBottom: '1px solid var(--ink-line)' }}
                >
                    <SearchRoundedIcon sx={{ color: 'var(--ink-tertiary)' }} />
                    <Box
                        component="input"
                        ref={inputRef}
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                        onKeyDown={onKeyDown}
                        placeholder="やりたいことを入力（画面名・操作・ステータスなど）"
                        sx={{
                            all: 'unset',
                            flex: 1,
                            fontSize: 17,
                            color: 'var(--ink-primary)',
                            '::placeholder': { color: 'var(--ink-muted)' },
                        }}
                    />
                    <KeyHint keys={['Esc']} />
                </Stack>
                <Box
                    ref={listRef}
                    sx={{
                        maxHeight: 'min(64vh, 520px)',
                        overflowY: 'auto',
                        paddingBlock: 1,
                    }}
                >
                    {results.length === 0 && (
                        <Box sx={{ paddingInline: 3, paddingBlock: 4, textAlign: 'center', color: 'var(--ink-tertiary)' }}>
                            <Typography variant="body2">マッチする項目はありません。</Typography>
                            <Typography variant="caption">違うキーワードで試してください。</Typography>
                        </Box>
                    )}
                    {results.map((cmd, idx) => {
                        const showHeader = cmd._section !== lastSection;
                        lastSection = cmd._section;
                        const Icon = cmd.icon;
                        const isActive = idx === active;
                        return (
                            <Box key={`${cmd.id}-${idx}`}>
                                {showHeader && (
                                    <Stack
                                        direction="row"
                                        alignItems="center"
                                        spacing={0.5}
                                        sx={{
                                            paddingInline: 2.5,
                                            paddingBlock: 0.75,
                                            color: 'var(--ink-muted)',
                                            fontSize: 11,
                                            fontWeight: 700,
                                            letterSpacing: 1.4,
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {cmd._section === '直近' && <HistoryRoundedIcon sx={{ fontSize: 14 }} />}
                                        <span>{cmd._section}</span>
                                    </Stack>
                                )}
                                <Box
                                    data-cmd-idx={idx}
                                    onMouseEnter={() => setActive(idx)}
                                    onClick={() => run(cmd)}
                                    sx={{
                                        marginInline: 1,
                                        paddingInline: 1.5,
                                        paddingBlock: 1,
                                        borderRadius: 'var(--radius-md)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        cursor: 'pointer',
                                        background: isActive ? 'var(--accent-primary-soft)' : 'transparent',
                                        color: isActive ? 'var(--accent-primary-ink)' : 'var(--ink-primary)',
                                        transition: 'var(--motion-fast)',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 'var(--radius-sm)',
                                            display: 'grid',
                                            placeItems: 'center',
                                            background: isActive ? 'var(--surface-raised)' : 'var(--surface-sunken)',
                                            color: 'var(--accent-primary)',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {Icon ? <Icon sx={{ fontSize: 18 }} /> : <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />}
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography
                                            sx={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {cmd.label}
                                        </Typography>
                                        {cmd.subtitle && (
                                            <Typography
                                                variant="caption"
                                                sx={{ color: isActive ? 'var(--accent-primary-ink)' : 'var(--ink-tertiary)' }}
                                            >
                                                {cmd.subtitle}
                                            </Typography>
                                        )}
                                    </Box>
                                    {isActive && (
                                        <KeyHint keys={['Enter']} />
                                    )}
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    sx={{
                        borderTop: '1px solid var(--ink-line)',
                        paddingInline: 2.5,
                        paddingBlock: 1.25,
                        color: 'var(--ink-tertiary)',
                        fontSize: 12,
                    }}
                >
                    <Stack direction="row" spacing={0.75} alignItems="center">
                        <KeyHint keys={['↑']} />
                        <KeyHint keys={['↓']} />
                        <Typography variant="caption">移動</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                        <KeyHint keys={['Enter']} />
                        <Typography variant="caption">実行</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                        <KeyHint keys={['Esc']} />
                        <Typography variant="caption">閉じる</Typography>
                    </Stack>
                </Stack>
            </Box>
        </Backdrop>
    );
};

export default CommandPalette;
