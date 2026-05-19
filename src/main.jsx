import { StrictMode, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import './index.css';
import App from './App.jsx';
import { UiPreferencesProvider, useUiPreferences } from './ui/UiPreferencesContext.jsx';
import { createAppTheme } from './ui/createAppTheme.js';
import { AppGlobalStyles } from './ui/globalStyles.jsx';

function ThemedApp() {
    const { resolvedMode, prefs } = useUiPreferences();
    const theme = useMemo(() => createAppTheme(resolvedMode, prefs.density), [resolvedMode, prefs.density]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline enableColorScheme />
            <AppGlobalStyles mode={resolvedMode} />
            <App />
        </ThemeProvider>
    );
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <UiPreferencesProvider>
            <BrowserRouter>
                <ThemedApp />
            </BrowserRouter>
        </UiPreferencesProvider>
    </StrictMode>,
);
