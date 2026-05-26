import { useEffect, useState } from 'react';
import {
    Box, Dialog, DialogContent, DialogTitle, IconButton, Stack, Tooltip, Typography, Button,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import RotateRightRoundedIcon from '@mui/icons-material/RotateRightRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded';
import { isPdfReceipt, isImageReceipt } from '../../features/expense/expenseApplicationStore';

/**
 * 領収書プレビューダイアログ。
 * 画像（image/*）は <img> + 回転、PDF（application/pdf）は <iframe> でブラウザ標準ビューアに任せる。
 * MIMEタイプが取れないレガシーデータは画像として表示を試みる（旧データは画像のみだった）。
 */
function ReceiptPreviewDialog({
    open,
    onClose,
    src,
    name = '',
    mimeType = '',
}) {
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
        if (open) setRotation(0);
    }, [open]);

    if (!src) return null;

    const isPdf = isPdfReceipt(mimeType) || (!mimeType && /\.pdf(\?|$)/i.test(name || src));
    // MIMEが空でPDFでもなければ画像扱い（旧 receiptPreview は dataURL 画像のみだった）
    const isImage = isImageReceipt(mimeType) || (!mimeType && !isPdf);

    const handleRotate = () => setRotation((r) => (r + 90) % 360);
    const handleReset = () => setRotation(0);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { background: 'var(--surface-raised)' } }}>
            <DialogTitle sx={{ paddingBlock: 1.5, paddingInline: 2, borderBottom: '1px solid var(--ink-line)' }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                        sx={{
                            width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                            display: 'grid', placeItems: 'center',
                            background: isPdf ? 'var(--accent-rose-soft)' : 'var(--accent-iris-soft)',
                            color: isPdf ? 'var(--accent-rose)' : 'var(--accent-iris)',
                            flexShrink: 0,
                        }}
                    >
                        {isPdf ? <PictureAsPdfRoundedIcon fontSize="small" />
                            : isImage ? <ImageRoundedIcon fontSize="small" />
                                : <InsertDriveFileRoundedIcon fontSize="small" />}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 700, color: 'var(--ink-primary)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}
                            title={name || '領収書'}
                        >
                            {name || '領収書プレビュー'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'var(--ink-tertiary)' }}>
                            {isPdf ? 'PDF' : isImage ? '画像' : 'ファイル'}
                            {mimeType ? ` ・ ${mimeType}` : ''}
                        </Typography>
                    </Box>
                    {isImage && (
                        <>
                            <Tooltip title="90°回転">
                                <IconButton size="small" onClick={handleRotate}>
                                    <RotateRightRoundedIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            {rotation !== 0 && (
                                <Tooltip title="回転をリセット">
                                    <IconButton size="small" onClick={handleReset}>
                                        <RestartAltRoundedIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </>
                    )}
                    <Tooltip title="新しいタブで開く">
                        <IconButton size="small" component="a" href={src} target="_blank" rel="noreferrer">
                            <OpenInNewRoundedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="ダウンロード">
                        <IconButton size="small" component="a" href={src} download={name || true}>
                            <DownloadRoundedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="閉じる">
                        <IconButton size="small" onClick={onClose}>
                            <CloseRoundedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </DialogTitle>
            <DialogContent sx={{ padding: 0, background: 'var(--surface-sunken)' }}>
                {isPdf ? (
                    <Box sx={{ width: '100%', height: '78vh', background: '#525659' }}>
                        <iframe
                            src={src}
                            title={name || 'PDF プレビュー'}
                            style={{ width: '100%', height: '100%', border: 0 }}
                        />
                        {/* iframe で PDF が表示できないブラウザ向けのフォールバック */}
                        <noscript>
                            <Stack alignItems="center" spacing={1} sx={{ padding: 4 }}>
                                <Typography variant="body2" sx={{ color: 'var(--ink-secondary)' }}>
                                    PDF を表示できません。ダウンロードしてご確認ください。
                                </Typography>
                                <Button variant="contained" startIcon={<DownloadRoundedIcon />} href={src} download={name || true}>
                                    ダウンロード
                                </Button>
                            </Stack>
                        </noscript>
                    </Box>
                ) : isImage ? (
                    <Box
                        sx={{
                            width: '100%',
                            minHeight: '60vh',
                            maxHeight: '82vh',
                            display: 'grid',
                            placeItems: 'center',
                            padding: 2,
                            overflow: 'auto',
                        }}
                    >
                        <img
                            src={src}
                            alt={name || '領収書プレビュー'}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '78vh',
                                objectFit: 'contain',
                                transform: `rotate(${rotation}deg)`,
                                transition: 'transform 200ms cubic-bezier(.2,.8,.2,1)',
                                background: '#FFFFFF',
                                boxShadow: 'var(--shadow-2)',
                                borderRadius: 'var(--radius-sm)',
                            }}
                        />
                    </Box>
                ) : (
                    <Stack alignItems="center" spacing={1.5} sx={{ paddingBlock: 8, paddingInline: 3 }}>
                        <InsertDriveFileRoundedIcon sx={{ fontSize: 48, color: 'var(--ink-tertiary)' }} />
                        <Typography variant="body2" sx={{ color: 'var(--ink-secondary)', textAlign: 'center' }}>
                            このファイル形式はプレビューできません。ダウンロードしてご確認ください。
                        </Typography>
                        <Button variant="contained" startIcon={<DownloadRoundedIcon />} href={src} download={name || true}>
                            ダウンロード
                        </Button>
                    </Stack>
                )}
            </DialogContent>
        </Dialog>
    );
}

/**
 * テーブル行などに置く小さな領収書サムネ。
 * 画像はそのまま縮小表示、PDF はアイコン表示。クリック時のハンドラは親側で渡す。
 */
export function ReceiptThumbnail({
    src,
    name = '',
    mimeType = '',
    size = 40,
    onClick,
    title,
}) {
    if (!src) {
        return (
            <Box
                aria-label="領収書なし"
                sx={{
                    width: size, height: size,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-sunken)',
                    color: 'var(--ink-muted)',
                    display: 'grid', placeItems: 'center',
                    fontSize: 11, fontWeight: 600,
                }}
            >
                —
            </Box>
        );
    }

    const isPdf = isPdfReceipt(mimeType) || (!mimeType && /\.pdf(\?|$)/i.test(name || src));
    const tooltip = title || name || (isPdf ? 'PDF を表示' : '領収書を表示');

    const common = {
        width: size, height: size,
        borderRadius: 'var(--radius-sm)',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-1)',
        transition: 'var(--motion-fast)',
        '&:hover': onClick ? { transform: 'scale(1.06)', boxShadow: 'var(--shadow-2)' } : undefined,
    };

    if (isPdf) {
        return (
            <Tooltip title={tooltip}>
                <Box
                    onClick={onClick}
                    role={onClick ? 'button' : undefined}
                    tabIndex={onClick ? 0 : undefined}
                    onKeyDown={(e) => {
                        if (!onClick) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onClick(e);
                        }
                    }}
                    sx={{
                        ...common,
                        background: 'var(--accent-rose-soft)',
                        color: 'var(--accent-rose)',
                        display: 'grid', placeItems: 'center',
                    }}
                >
                    <PictureAsPdfRoundedIcon sx={{ fontSize: size * 0.55 }} />
                </Box>
            </Tooltip>
        );
    }

    return (
        <Tooltip title={tooltip}>
            <Box
                onClick={onClick}
                role={onClick ? 'button' : undefined}
                tabIndex={onClick ? 0 : undefined}
                onKeyDown={(e) => {
                    if (!onClick) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onClick(e);
                    }
                }}
                sx={{ ...common, background: '#FFFFFF' }}
            >
                <img
                    src={src}
                    alt={name || '領収書'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
            </Box>
        </Tooltip>
    );
}

export default ReceiptPreviewDialog;
