"""モック用の最小 PDF を生成するスクリプト。
public/sample-receipts/ に1ページの領収書サンプル PDF を書き出す。
日本語フォント埋め込みは行わず、英文 + 数字のみで表現する。
"""
import os

OUTPUT = os.path.join(os.path.dirname(__file__), "..", "public", "sample-receipts", "sample-receipt.pdf")


def build_pdf(lines):
    """与えた行の配列からシンプルな単一ページ PDF を生成する。"""
    # ストリーム内容: 16pt Helvetica で 1 行ずつ描画
    stream_parts = ["BT", "/F1 16 Tf", "60 280 Td"]
    for i, text in enumerate(lines):
        # Td は相対移動。最初の行以外は次行へ移動する
        if i > 0:
            stream_parts.append("0 -22 Td")
        # 括弧と \ をエスケープ
        escaped = text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        stream_parts.append(f"({escaped}) Tj")
    stream_parts.append("ET")
    stream = "\n".join(stream_parts).encode("latin-1")

    objects = [
        b"<</Type/Catalog/Pages 2 0 R>>",
        b"<</Type/Pages/Kids[3 0 R]/Count 1>>",
        (
            b"<</Type/Page/Parent 2 0 R/MediaBox[0 0 420 320]"
            b"/Resources<</Font<</F1<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>>>>>"
            b"/Contents 4 0 R>>"
        ),
        b"<</Length " + str(len(stream)).encode() + b">>\nstream\n" + stream + b"\nendstream",
    ]

    out = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for i, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{i} 0 obj\n".encode() + body + b"\nendobj\n"

    xref_pos = len(out)
    out += f"xref\n0 {len(objects) + 1}\n".encode()
    out += b"0000000000 65535 f \n"
    for off in offsets[1:]:
        out += f"{off:010d} 00000 n \n".encode()
    out += (
        f"trailer\n<</Size {len(objects) + 1}/Root 1 0 R>>\nstartxref\n{xref_pos}\n%%EOF\n"
    ).encode()
    return bytes(out)


if __name__ == "__main__":
    content = build_pdf([
        "RECEIPT (Sample)",
        "Date: 2026-05-13",
        "Store: Tokyo Books",
        "Item: Accounting Practice (2 books)",
        "Subtotal: JPY 6,000",
        "Tax (10%): JPY 600",
        "Total: JPY 6,600",
        "-- This is a mock receipt for ReciPalMock --",
    ])
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "wb") as f:
        f.write(content)
    print(f"wrote {OUTPUT} ({len(content)} bytes)")
