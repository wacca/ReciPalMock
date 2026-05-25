import { createTheme } from '@mui/material/styles';
import { densityMap, getPalette, radius } from './tokens.js';

const fontStack = [
    'Inter',
    'Noto Sans JP',
    'Yu Gothic',
    'Hiragino Kaku Gothic ProN',
    'Meiryo',
    'system-ui',
    'sans-serif',
].join(',');

export const createAppTheme = (mode = 'light', density = 'comfortable') => {
    const p = getPalette(mode);
    const d = densityMap[density] || densityMap.comfortable;
    const isDark = mode === 'dark';

    return createTheme({
        palette: {
            mode,
            primary: {
                main: p.accent.primary,
                dark: isDark ? p.accent.primary : '#0B7E66',
                light: p.accent.primarySoft,
                contrastText: isDark ? p.ink.invert : '#FFFFFF',
            },
            secondary: {
                main: p.accent.iris,
                light: p.accent.irisSoft,
            },
            warning: {
                main: p.accent.amber,
                light: p.accent.amberSoft,
            },
            error: {
                main: p.accent.rose,
                light: p.accent.roseSoft,
            },
            success: {
                main: p.accent.leaf,
                light: p.accent.leafSoft,
            },
            info: {
                main: p.accent.iris,
                light: p.accent.irisSoft,
            },
            background: {
                default: p.surface.base,
                paper: p.surface.raised,
            },
            text: {
                primary: p.ink.primary,
                secondary: p.ink.secondary,
                disabled: p.ink.muted,
            },
            divider: p.ink.line,
        },
        shape: {
            borderRadius: radius.md,
        },
        typography: {
            fontFamily: fontStack,
            fontSize: 14 * d.scale,
            htmlFontSize: 16,
            h4: { fontWeight: 700, letterSpacing: -0.2, lineHeight: 1.2 },
            h5: { fontWeight: 700, letterSpacing: -0.1, lineHeight: 1.25 },
            h6: { fontWeight: 700, letterSpacing: 0, lineHeight: 1.3 },
            subtitle1: { fontWeight: 700, lineHeight: 1.35 },
            subtitle2: { fontWeight: 600, lineHeight: 1.4 },
            body1: { lineHeight: 1.55 },
            body2: { lineHeight: 1.5 },
            caption: { lineHeight: 1.4, letterSpacing: 0.2 },
            overline: { letterSpacing: 1.2, fontWeight: 700 },
            button: {
                fontWeight: 700,
                textTransform: 'none',
                letterSpacing: 0,
            },
        },
        density,
        custom: {
            density: d,
            tokens: p,
            mode,
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        backgroundColor: p.surface.base,
                        color: p.ink.primary,
                        WebkitFontSmoothing: 'antialiased',
                    },
                    '@media (prefers-reduced-motion: reduce)': {
                        '*, *::before, *::after': {
                            animationDuration: '0.01ms !important',
                            animationIterationCount: '1 !important',
                            transitionDuration: '40ms !important',
                            scrollBehavior: 'auto !important',
                        },
                    },
                    // BottomNav 表示中(=md未満)は Snackbar をその上に出すため bottom を底上げする。
                    // MuiSnackbar.defaultProps.sx で書くと MUI v6 のバグで ClickAwayListener に
                    // ownerState が伝播してしまうため、CssBaseline 経由でグローバル CSS を当てる。
                    '@media (max-width: 899.95px)': {
                        '.MuiSnackbar-anchorOriginBottomCenter, .MuiSnackbar-anchorOriginBottomLeft, .MuiSnackbar-anchorOriginBottomRight': {
                            bottom: '88px !important',
                        },
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        boxShadow: 'none',
                        backgroundImage: 'none',
                    },
                },
            },
            MuiButton: {
                defaultProps: {
                    disableElevation: true,
                },
                styleOverrides: {
                    root: {
                        borderRadius: radius.md,
                        minHeight: 40 * d.scale,
                        paddingInline: 16,
                        transition: `background ${p.motion.base}, color ${p.motion.base}, transform ${p.motion.fast}, box-shadow ${p.motion.base}`,
                        '&:active': { transform: 'translateY(1px) scale(0.99)' },
                    },
                    sizeSmall: {
                        minHeight: 32 * d.scale,
                        paddingInline: 12,
                    },
                    sizeLarge: {
                        minHeight: 48 * d.scale,
                        paddingInline: 22,
                        fontSize: '1rem',
                    },
                    containedPrimary: {
                        boxShadow: 'none',
                        '&:hover': { boxShadow: p.shadow.glow },
                    },
                    outlined: {
                        borderColor: p.ink.lineStrong,
                        '&:hover': {
                            borderColor: p.accent.primary,
                            background: p.accent.primarySoft,
                        },
                    },
                    text: {
                        '&:hover': { background: p.accent.primarySoft },
                    },
                },
            },
            MuiContainer: {
                defaultProps: { maxWidth: false },
                styleOverrides: {
                    root: { paddingLeft: 0, paddingRight: 0 },
                },
            },
            MuiPaper: {
                defaultProps: { elevation: 0 },
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                        backgroundColor: p.surface.raised,
                        border: 'none',
                        transition: `background ${p.motion.base}, box-shadow ${p.motion.base}`,
                    },
                },
            },
            MuiTable: {
                defaultProps: { size: 'small' },
            },
            MuiTableCell: {
                styleOverrides: {
                    head: {
                        backgroundColor: p.surface.sunken,
                        color: p.ink.tertiary,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        letterSpacing: 0.3,
                        textTransform: 'uppercase',
                        lineHeight: 1.45,
                        padding: '10px 12px',
                        whiteSpace: 'nowrap',
                        borderBottom: `1px solid ${p.ink.line}`,
                    },
                    root: {
                        borderBottomColor: p.ink.line,
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                        padding: `${10 * d.scale}px 12px`,
                        color: p.ink.primary,
                    },
                },
            },
            MuiTableRow: {
                styleOverrides: {
                    root: {
                        transition: `background ${p.motion.fast}`,
                        '&.MuiTableRow-hover:hover': {
                            backgroundColor: isDark
                                ? 'rgba(255,255,255,0.03)'
                                : 'rgba(14,158,129,0.04)',
                        },
                    },
                },
            },
            MuiTextField: {
                defaultProps: { variant: 'outlined' },
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        backgroundColor: p.surface.raised,
                        borderRadius: radius.md,
                        transition: `border-color ${p.motion.fast}, box-shadow ${p.motion.fast}`,
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: p.ink.line,
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: p.ink.lineStrong,
                        },
                        '&.Mui-focused': {
                            boxShadow: p.shadow.glow,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: p.accent.primary,
                            borderWidth: 1,
                        },
                    },
                    input: {
                        padding: `${10 * d.scale}px 12px`,
                    },
                },
            },
            MuiSelect: {
                defaultProps: {},
            },
            MuiChip: {
                styleOverrides: {
                    root: {
                        borderRadius: radius.pill,
                        fontWeight: 600,
                    },
                },
            },
            MuiIconButton: {
                styleOverrides: {
                    root: {
                        borderRadius: radius.md,
                        transition: `background ${p.motion.fast}, color ${p.motion.fast}`,
                    },
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        backgroundColor: p.surface.raised,
                        borderRadius: radius.lg,
                        boxShadow: p.shadow[3],
                    },
                },
            },
            MuiSnackbar: {
                defaultProps: {
                    anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
                },
                // MUI v6 のバグで styleOverrides を入れると ClickAwayListener に
                // ownerState が伝播してしまうため、ここには書かない。
                // Snackbar 内 Alert の反転スタイルは MuiAlert.root の親セレクタ側に置く。
            },
            MuiSnackbarContent: {
                styleOverrides: {
                    root: {
                        borderRadius: radius.md,
                        backgroundColor: isDark ? '#F1F5FA' : '#0F172A',
                        color: isDark ? '#0B0F17' : '#FFFFFF',
                        boxShadow: p.shadow[3],
                        fontWeight: 500,
                    },
                },
            },
            MuiAlert: {
                styleOverrides: {
                    // インライン Alert は severity に応じた淡色バナーとして描画。
                    // Snackbar 内で使われる場合は MuiSnackbar.root の親セレクタで反転スタイルに上書きする。
                    root: {
                        borderRadius: radius.md,
                        border: '1px solid transparent',
                        boxShadow: 'none',
                        '& .MuiAlert-action': { color: 'inherit' },
                        '& .MuiAlert-action .MuiButton-root': { color: 'inherit' },
                        // Snackbar 内 Alert はトーストとして高コントラスト反転にする。
                        // 親セレクタの分だけ詳細度が上がり severity 別の地色より優先される。
                        '.MuiSnackbar-root &': {
                            backgroundColor: isDark ? '#F1F5FA' : '#0F172A',
                            color: isDark ? '#0B0F17' : '#FFFFFF',
                            boxShadow: p.shadow[3],
                            borderColor: 'transparent',
                        },
                    },
                    standardSuccess: {
                        backgroundColor: p.accent.leafSoft,
                        color: isDark ? p.ink.primary : '#14532D',
                        borderColor: isDark ? 'transparent' : 'rgba(22,163,74,0.24)',
                        '& .MuiAlert-icon': { color: p.accent.leaf },
                        '& .MuiAlertTitle-root': { color: 'inherit' },
                    },
                    standardError: {
                        backgroundColor: p.accent.roseSoft,
                        color: isDark ? p.ink.primary : '#7F1D1D',
                        borderColor: isDark ? 'transparent' : 'rgba(220,38,38,0.24)',
                        '& .MuiAlert-icon': { color: p.accent.rose },
                        '& .MuiAlertTitle-root': { color: 'inherit' },
                    },
                    standardWarning: {
                        backgroundColor: p.accent.amberSoft,
                        color: isDark ? p.ink.primary : '#7C2D12',
                        borderColor: isDark ? 'rgba(245,158,11,0.32)' : 'rgba(217,119,6,0.28)',
                        '& .MuiAlert-icon': { color: p.accent.amber },
                        '& .MuiAlertTitle-root': { color: 'inherit' },
                    },
                    standardInfo: {
                        backgroundColor: p.accent.irisSoft,
                        color: isDark ? p.ink.primary : '#1E3A8A',
                        borderColor: isDark ? 'transparent' : 'rgba(91,108,255,0.24)',
                        '& .MuiAlert-icon': { color: p.accent.iris },
                        '& .MuiAlertTitle-root': { color: 'inherit' },
                    },
                },
            },
            MuiListItemButton: {
                styleOverrides: {
                    root: {
                        borderRadius: radius.md,
                        transition: `background ${p.motion.fast}, color ${p.motion.fast}`,
                    },
                },
            },
            MuiTooltip: {
                styleOverrides: {
                    tooltip: {
                        background: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(15,23,42,0.92)',
                        color: isDark ? '#0B0F17' : '#FFFFFF',
                        borderRadius: 8,
                        padding: '6px 10px',
                        fontSize: 12,
                        fontWeight: 500,
                    },
                },
            },
        },
    });
};

export default createAppTheme;
