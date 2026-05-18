import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#00796b',
            dark: '#005f56',
            light: '#e0f2ef',
        },
        secondary: {
            main: '#2563eb',
            light: '#eaf1ff',
        },
        warning: {
            main: '#b7791f',
            light: '#fff7e6',
        },
        background: {
            default: '#f4f7fb',
            paper: '#ffffff',
        },
        text: {
            primary: '#1f2937',
            secondary: '#667085',
        },
        divider: '#e4e8ee',
    },
    shape: {
        borderRadius: 8,
    },
    typography: {
        fontFamily: [
            'Inter',
            'Noto Sans JP',
            'Yu Gothic',
            'Hiragino Kaku Gothic ProN',
            'Meiryo',
            'system-ui',
            'sans-serif',
        ].join(','),
        h5: {
            fontWeight: 700,
            letterSpacing: 0,
        },
        h6: {
            fontWeight: 700,
            letterSpacing: 0,
        },
        button: {
            fontWeight: 700,
            textTransform: 'none',
            letterSpacing: 0,
        },
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: 'none',
                },
            },
        },
        MuiButton: {
            defaultProps: {
                disableElevation: true,
            },
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
        MuiContainer: {
            defaultProps: {
                maxWidth: false,
            },
            styleOverrides: {
                root: {
                    paddingLeft: 0,
                    paddingRight: 0,
                },
            },
        },
        MuiPaper: {
            defaultProps: {
                elevation: 0,
            },
            styleOverrides: {
                root: {
                    border: '1px solid #e4e8ee',
                    backgroundImage: 'none',
                },
            },
        },
        MuiTable: {
            defaultProps: {
                size: 'small',
            },
        },
        MuiTableCell: {
            styleOverrides: {
                head: {
                    backgroundColor: '#f8fafc',
                    color: '#475467',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    letterSpacing: 0,
                    lineHeight: 1.45,
                    padding: '10px 12px',
                    whiteSpace: 'nowrap',
                },
                root: {
                    borderBottomColor: '#edf1f6',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    padding: '10px 12px',
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    '&.MuiTableRow-hover:hover': {
                        backgroundColor: '#fbfefd',
                    },
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                variant: 'outlined',
            },
        },
    },
});

export default theme;
