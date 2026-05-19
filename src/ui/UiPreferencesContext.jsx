import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'recrova:ui:preferences:v1';

const defaultPrefs = {
    mode: 'auto',
    density: 'comfortable',
    pulse: true,
};

const readPrefs = () => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...defaultPrefs };
        const parsed = JSON.parse(raw);
        return { ...defaultPrefs, ...parsed };
    } catch {
        return { ...defaultPrefs };
    }
};

const writePrefs = (prefs) => {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
        /* ignore quota */
    }
};

const resolveAutoMode = () => {
    if (typeof window === 'undefined') return 'light';
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const hour = new Date().getHours();
    const lateHour = hour >= 19 || hour < 6;
    if (mq?.matches) return 'dark';
    if (lateHour) return 'dark';
    return 'light';
};

const UiPreferencesContext = createContext({
    prefs: defaultPrefs,
    resolvedMode: 'light',
    setMode: () => {},
    setDensity: () => {},
    setPulse: () => {},
});

export const UiPreferencesProvider = ({ children }) => {
    const [prefs, setPrefs] = useState(() => (typeof window === 'undefined' ? defaultPrefs : readPrefs()));
    const [systemMode, setSystemMode] = useState(() => resolveAutoMode());

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => setSystemMode(resolveAutoMode());
        mq.addEventListener?.('change', onChange);
        const tick = window.setInterval(() => setSystemMode(resolveAutoMode()), 15 * 60 * 1000);
        return () => {
            mq.removeEventListener?.('change', onChange);
            window.clearInterval(tick);
        };
    }, []);

    useEffect(() => {
        writePrefs(prefs);
    }, [prefs]);

    const resolvedMode = prefs.mode === 'auto' ? systemMode : prefs.mode;

    const setMode = useCallback((mode) => {
        setPrefs((prev) => ({ ...prev, mode }));
    }, []);

    const setDensity = useCallback((density) => {
        setPrefs((prev) => ({ ...prev, density }));
    }, []);

    const setPulse = useCallback((pulse) => {
        setPrefs((prev) => ({ ...prev, pulse }));
    }, []);

    const value = useMemo(
        () => ({ prefs, resolvedMode, setMode, setDensity, setPulse }),
        [prefs, resolvedMode, setMode, setDensity, setPulse],
    );

    return <UiPreferencesContext.Provider value={value}>{children}</UiPreferencesContext.Provider>;
};

export const useUiPreferences = () => useContext(UiPreferencesContext);

export default UiPreferencesContext;
