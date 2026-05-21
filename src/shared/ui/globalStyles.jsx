import { GlobalStyles } from '@mui/material';
import { buildCssVars } from './tokens.js';

export const AppGlobalStyles = ({ mode = 'light' }) => {
    const vars = buildCssVars(mode);
    return (
        <GlobalStyles
            styles={{
                ':root': vars,
                'html, body, #root': {
                    minHeight: '100vh',
                },
                body: {
                    backgroundColor: 'var(--surface-base)',
                    color: 'var(--ink-primary)',
                    margin: 0,
                    minWidth: 320,
                    fontFamily: 'var(--font-sans)',
                    fontFeatureSettings: '"cv11", "ss01", "ss03"',
                    textRendering: 'optimizeLegibility',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                },
                '*': { boxSizing: 'border-box' },
                a: { color: 'inherit', textDecoration: 'none' },
                'img, svg': { maxWidth: '100%' },
                '::selection': {
                    background: 'var(--accent-primary-soft)',
                    color: 'var(--accent-primary-ink)',
                },
                ':focus-visible': {
                    outline: 'none',
                    boxShadow: 'var(--shadow-glow)',
                    borderRadius: 'var(--radius-md)',
                },
                'input, textarea, select, button': {
                    fontFamily: 'inherit',
                },
                'kbd': {
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    fontSize: '0.72rem',
                    padding: '2px 6px',
                    borderRadius: 6,
                    background: 'var(--surface-sunken)',
                    color: 'var(--ink-secondary)',
                    border: '1px solid var(--ink-line)',
                },
                '.tabular-nums': { fontVariantNumeric: 'tabular-nums' },
                '@keyframes recrovaPulse': {
                    '0%, 100%': { transform: 'scale(1)', opacity: 0.85 },
                    '50%': { transform: 'scale(1.18)', opacity: 1 },
                },
                '@keyframes recrovaFloatIn': {
                    from: { opacity: 0, transform: 'translateY(8px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                },
                '@keyframes recrovaShimmer': {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                '@media (prefers-reduced-motion: reduce)': {
                    '*, *::before, *::after': {
                        animationDuration: '0.001ms !important',
                        animationIterationCount: '1 !important',
                        transitionDuration: '0.001ms !important',
                        scrollBehavior: 'auto !important',
                    },
                },
            }}
        />
    );
};

export default AppGlobalStyles;
