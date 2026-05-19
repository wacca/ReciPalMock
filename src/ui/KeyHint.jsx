import { Box, Stack } from '@mui/material';
import { useMemo } from 'react';

const isMacLike = () => {
    if (typeof navigator === 'undefined') return false;
    return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '');
};

const symbolMap = {
    Mod: { mac: '⌘', other: 'Ctrl' },
    Cmd: { mac: '⌘', other: 'Ctrl' },
    Ctrl: { mac: 'Ctrl', other: 'Ctrl' },
    Alt: { mac: '⌥', other: 'Alt' },
    Shift: { mac: '⇧', other: 'Shift' },
    Enter: { mac: '↵', other: 'Enter' },
    Esc: { mac: 'Esc', other: 'Esc' },
};

const renderKey = (key, mac) => {
    const cfg = symbolMap[key];
    if (cfg) return mac ? cfg.mac : cfg.other;
    return key;
};

export const KeyHint = ({ keys, size = 'sm', sx }) => {
    const mac = useMemo(() => isMacLike(), []);
    const list = Array.isArray(keys) ? keys : keys.split('+').map((s) => s.trim());
    const tone = size === 'md' ? { font: 11.5, pad: '3px 8px' } : { font: 10.5, pad: '2px 6px' };
    return (
        <Stack direction="row" spacing={0.5} sx={{ display: 'inline-flex', ...sx }}>
            {list.map((k, i) => (
                <Box
                    key={`${k}-${i}`}
                    component="kbd"
                    sx={{
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        fontSize: tone.font,
                        padding: tone.pad,
                        borderRadius: 6,
                        background: 'var(--surface-sunken)',
                        color: 'var(--ink-tertiary)',
                        border: '1px solid var(--ink-line)',
                        lineHeight: 1,
                        fontWeight: 600,
                    }}
                >
                    {renderKey(k, mac)}
                </Box>
            ))}
        </Stack>
    );
};

export default KeyHint;
