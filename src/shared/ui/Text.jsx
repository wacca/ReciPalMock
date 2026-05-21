// Recrova Typography: 5-step ramp (Display / Title / Body / Label / Caption).
// 用途別の最小セットで Typography を統一する。
// 既存の <Typography variant="..."> はそのままでも動くが、新規追加は本コンポーネントを優先。

import { Box } from '@mui/material';

const baseSx = {
    margin: 0,
    color: 'inherit',
    fontFamily: 'var(--font-sans)',
};

const variants = {
    // 画面 hero / 数字 KPI / ランディング
    display: {
        fontSize: { xs: 28, md: 36 },
        lineHeight: 1.15,
        fontWeight: 800,
        letterSpacing: '-0.01em',
        color: 'var(--ink-primary)',
    },
    // ページタイトル h1 / Section の親見出し
    title: {
        fontSize: { xs: 20, md: 22 },
        lineHeight: 1.25,
        fontWeight: 700,
        color: 'var(--ink-primary)',
    },
    // 見出し h2 / カード内タイトル
    subtitle: {
        fontSize: { xs: 16, md: 18 },
        lineHeight: 1.3,
        fontWeight: 700,
        color: 'var(--ink-primary)',
    },
    // 本文
    body: {
        fontSize: 14,
        lineHeight: 1.6,
        fontWeight: 400,
        color: 'var(--ink-secondary)',
    },
    // フォームラベル・テーブルヘッダ・強調されたメタ
    label: {
        fontSize: 13,
        lineHeight: 1.4,
        fontWeight: 600,
        color: 'var(--ink-secondary)',
    },
    // 補助・キャプション
    caption: {
        fontSize: 12,
        lineHeight: 1.5,
        fontWeight: 500,
        color: 'var(--ink-tertiary)',
    },
    // タブラー数字（金額・件数 KPI 用）
    numeric: {
        fontFamily: 'var(--font-sans)',
        fontVariantNumeric: 'tabular-nums',
        fontWeight: 700,
        color: 'var(--ink-primary)',
    },
};

const variantToTag = {
    display: 'h1',
    title: 'h1',
    subtitle: 'h2',
    body: 'p',
    label: 'span',
    caption: 'span',
    numeric: 'span',
};

export const Text = ({
    variant = 'body',
    as,
    color,
    weight,
    truncate = false,
    sx,
    children,
    ...rest
}) => {
    const v = variants[variant] || variants.body;
    const Component = as || variantToTag[variant] || 'span';
    return (
        <Box
            component={Component}
            sx={{
                ...baseSx,
                ...v,
                ...(color ? { color } : null),
                ...(weight ? { fontWeight: weight } : null),
                ...(truncate
                    ? {
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'block',
                          minWidth: 0,
                      }
                    : null),
                ...sx,
            }}
            {...rest}
        >
            {children}
        </Box>
    );
};

export default Text;
