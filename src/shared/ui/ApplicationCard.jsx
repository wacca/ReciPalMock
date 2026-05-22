import { forwardRef } from 'react';
import { Box } from '@mui/material';
import { statusBarColor } from './StatusChip.jsx';

// 決着フロー:
//   親側で余計な wrapper Box を噛ませると Stack の gap が collapse 時に詰まらず
//   ガタつきの原因になるため、focus outline 描画もこのコンポーネントに集約する。
//   離脱時は opacity フェード + 高さ collapse を GPU 合成だけで滑らかに行う。
export const ApplicationCard = forwardRef(function ApplicationCard(
    { statusKey, onClick, children, sx, hoverable = true, decidingAs = null, focused = false },
    ref,
) {
    const isLeaving = Boolean(decidingAs);

    return (
        <Box
            ref={ref}
            sx={{
                display: 'grid',
                gridTemplateRows: isLeaving ? '0fr' : '1fr',
                marginBottom: isLeaving ? -12 : 0,
                transition: [
                    'grid-template-rows 220ms cubic-bezier(.4,0,.2,1)',
                    'margin-bottom 220ms cubic-bezier(.4,0,.2,1)',
                ].join(', '),
                pointerEvents: isLeaving ? 'none' : 'auto',
            }}
        >
            <Box
                sx={{
                    minHeight: 0,
                    overflow: 'hidden',
                    opacity: isLeaving ? 0 : 1,
                    transform: isLeaving ? 'scale(0.985)' : 'scale(1)',
                    transformOrigin: 'top center',
                    transition: 'opacity 140ms ease-out, transform 220ms cubic-bezier(.4,0,.2,1)',
                    willChange: isLeaving ? 'opacity, transform' : 'auto',
                }}
            >
                <Box
                    onClick={isLeaving ? undefined : onClick}
                    sx={{
                        position: 'relative',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--surface-raised)',
                        boxShadow: 'var(--shadow-1)',
                        overflow: 'hidden',
                        outline: focused ? '2px solid var(--accent-primary)' : '2px solid transparent',
                        outlineOffset: 2,
                        transition: 'box-shadow var(--motion-fast), outline-color var(--motion-fast)',
                        cursor: !isLeaving && onClick ? 'pointer' : 'default',
                        ...(hoverable && !isLeaving && { '&:hover': { boxShadow: 'var(--shadow-2)' } }),
                        ...sx,
                    }}
                >
                    <Box
                        aria-hidden
                        sx={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: 4,
                            background: statusBarColor(statusKey),
                        }}
                    />
                    {children}
                </Box>
            </Box>
        </Box>
    );
});

export default ApplicationCard;
