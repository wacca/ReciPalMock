// Design tokens for Recrova.
// Brain-science driven: tonal elevation > borders for grouping,
// desaturated state colors to reduce attentional fatigue,
// motion durations tuned to feel responsive (<200ms) without
// jitter, "perfect fourth" typography ramp for clear hierarchy.

export const surface = {
    light: {
        canvas: '#F1F4F9',
        base: '#F7F9FC',
        raised: '#FFFFFF',
        overlay: '#FFFFFF',
        sunken: '#ECEFF4',
        railTop: 'rgba(255,255,255,0.78)',
        scrim: 'rgba(15,23,42,0.42)',
    },
    dark: {
        canvas: '#070A12',
        base: '#0B0F17',
        raised: '#141A26',
        overlay: '#1A2233',
        sunken: '#080B13',
        railTop: 'rgba(11,15,23,0.78)',
        scrim: 'rgba(2,6,15,0.62)',
    },
};

export const accent = {
    light: {
        primary: '#0E9E81',
        primarySoft: '#D4F0E7',
        primaryInk: '#055944',
        iris: '#5B6CFF',
        irisSoft: '#E4E7FF',
        amber: '#D97706',
        amberSoft: '#FFF1DA',
        rose: '#DC2626',
        roseSoft: '#FDE2E2',
        leaf: '#16A34A',
        leafSoft: '#D8F0DF',
        slate: '#475569',
        slateSoft: '#E5E9EF',
    },
    dark: {
        primary: '#34D8B5',
        primarySoft: 'rgba(52,216,181,0.16)',
        primaryInk: '#A7F0DC',
        iris: '#8A95FF',
        irisSoft: 'rgba(138,149,255,0.16)',
        amber: '#F59E0B',
        amberSoft: 'rgba(245,158,11,0.18)',
        rose: '#F87171',
        roseSoft: 'rgba(248,113,113,0.18)',
        leaf: '#4ADE80',
        leafSoft: 'rgba(74,222,128,0.18)',
        slate: '#94A3B8',
        slateSoft: 'rgba(148,163,184,0.16)',
    },
};

export const ink = {
    light: {
        primary: '#0F172A',
        secondary: '#475569',
        tertiary: '#64748B',
        muted: '#94A3B8',
        invert: '#FFFFFF',
        line: 'rgba(15,23,42,0.08)',
        lineStrong: 'rgba(15,23,42,0.14)',
    },
    dark: {
        primary: '#F1F5FA',
        secondary: '#A4AFC2',
        tertiary: '#8B97AC',
        muted: '#6F7B92',
        invert: '#0B0F17',
        line: 'rgba(255,255,255,0.08)',
        lineStrong: 'rgba(255,255,255,0.14)',
    },
};

export const radius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 22,
    pill: 9999,
};

export const motion = {
    fast: '120ms cubic-bezier(.2,.8,.2,1)',
    base: '180ms cubic-bezier(.2,.8,.2,1)',
    slow: '280ms cubic-bezier(.2,.8,.2,1)',
    spring: '220ms cubic-bezier(.34,1.56,.64,1)',
};

export const shadow = {
    light: {
        1: '0 1px 2px rgba(15,23,42,.05), 0 0 0 1px rgba(15,23,42,.04)',
        2: '0 6px 18px rgba(15,23,42,.06), 0 0 0 1px rgba(15,23,42,.04)',
        3: '0 22px 44px rgba(15,23,42,.10), 0 0 0 1px rgba(15,23,42,.06)',
        glow: '0 0 0 4px rgba(14,158,129,.18)',
    },
    dark: {
        1: '0 1px 2px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.04)',
        2: '0 6px 18px rgba(0,0,0,.46), 0 0 0 1px rgba(255,255,255,.05)',
        3: '0 22px 44px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.06)',
        glow: '0 0 0 4px rgba(52,216,181,.28)',
    },
};

export const fontScale = {
    xs: 12,
    sm: 13,
    md: 14,
    lg: 16,
    xl: 18,
    '2xl': 22,
    '3xl': 28,
    '4xl': 36,
};

export const densityMap = {
    comfortable: {
        scale: 1,
        rowMin: 44,
        rowGap: 12,
        sectionPad: 24,
        railRowMin: 44,
    },
    compact: {
        scale: 0.86,
        rowMin: 36,
        rowGap: 8,
        sectionPad: 18,
        railRowMin: 38,
    },
};

export const getPalette = (mode) => ({
    surface: surface[mode],
    accent: accent[mode],
    ink: ink[mode],
    shadow: shadow[mode],
    radius,
    motion,
    fontScale,
});

export const buildCssVars = (mode) => {
    const p = getPalette(mode);
    return {
        '--surface-canvas': p.surface.canvas,
        '--surface-base': p.surface.base,
        '--surface-raised': p.surface.raised,
        '--surface-overlay': p.surface.overlay,
        '--surface-sunken': p.surface.sunken,
        '--surface-rail-top': p.surface.railTop,
        '--scrim': p.surface.scrim,

        '--accent-primary': p.accent.primary,
        '--accent-primary-soft': p.accent.primarySoft,
        '--accent-primary-ink': p.accent.primaryInk,
        '--accent-iris': p.accent.iris,
        '--accent-iris-soft': p.accent.irisSoft,
        '--accent-amber': p.accent.amber,
        '--accent-amber-soft': p.accent.amberSoft,
        '--accent-rose': p.accent.rose,
        '--accent-rose-soft': p.accent.roseSoft,
        '--accent-leaf': p.accent.leaf,
        '--accent-leaf-soft': p.accent.leafSoft,
        '--accent-slate': p.accent.slate,
        '--accent-slate-soft': p.accent.slateSoft,

        '--ink-primary': p.ink.primary,
        '--ink-secondary': p.ink.secondary,
        '--ink-tertiary': p.ink.tertiary,
        '--ink-muted': p.ink.muted,
        '--ink-invert': p.ink.invert,
        '--ink-line': p.ink.line,
        '--ink-line-strong': p.ink.lineStrong,

        '--shadow-1': p.shadow[1],
        '--shadow-2': p.shadow[2],
        '--shadow-3': p.shadow[3],
        '--shadow-glow': p.shadow.glow,

        '--radius-sm': `${radius.sm}px`,
        '--radius-md': `${radius.md}px`,
        '--radius-lg': `${radius.lg}px`,
        '--radius-xl': `${radius.xl}px`,
        '--radius-pill': `${radius.pill}px`,

        '--motion-fast': motion.fast,
        '--motion-base': motion.base,
        '--motion-slow': motion.slow,
        '--motion-spring': motion.spring,

        '--top-strip-h': '64px',
        '--page-max-w': '1280px',
    };
};
