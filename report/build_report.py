"""Build the ITU submission report (.docx) from the official template and a light Markdown source.

The official template (report/template/) is kept as is: page size, margins, styles, numbering and
document properties. Only the body is replaced by the content of report/technical-report.md.

Supported Markdown (deliberately small):
  `% Title line`            centred bold title (first line)
  `%% Label: value`          header line (team leader, members, GitHub link)
  `# Heading`                numbered section heading (template list numId 4)
  `## Sub-heading`           bold run-in paragraph
  paragraph text             justified body paragraph, `**bold**`, `*italic*`, `` `code` ``
  `- item`                   bullet (template list numId 3)
  `| a | b |` tables         first row is the header; a `|---|` separator line is skipped
  `<!-- comment -->`         ignored

Usage: python3 report/build_report.py [--out report/SONAH-technical-report.docx]
"""

from __future__ import annotations

import argparse
import re
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent
TEMPLATE = ROOT / "template" / "AI-for-Good-Sandbox-Hackathon-submission-template.docx"
SOURCE = ROOT / "technical-report.md"

FONT = (
    '<w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" '
    'w:hAnsi="Times New Roman" w:cs="Times New Roman"/>'
)
BODY_SIZE = 21  # half-points: 10.5 pt keeps the report within the 5-page limit
TABLE_SIZE = 16  # 8 pt
HEADING_NUM_ID = 4
BULLET_NUM_ID = 3
TABLE_WIDTH = 9360  # 6.5 in between 1 in margins (Letter)

INLINE = re.compile(r"\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`")


def run(text: str, size: int, bold: bool = False, italic: bool = False, mono: bool = False) -> str:
    props = [
        '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/>' if mono else FONT,
        "<w:b/><w:bCs/>" if bold else "",
        "<w:i/><w:iCs/>" if italic else "",
        '<w:color w:val="000000"/>',
        f'<w:sz w:val="{size}"/><w:szCs w:val="{size}"/>',
    ]
    return f'<w:r><w:rPr>{"".join(props)}</w:rPr><w:t xml:space="preserve">{escape(text)}</w:t></w:r>'


def inline_runs(text: str, size: int, bold: bool = False) -> str:
    out: list[str] = []
    position = 0
    for match in INLINE.finditer(text):
        if match.start() > position:
            out.append(run(text[position : match.start()], size, bold=bold))
        strong, emphasis, code = match.groups()
        if strong is not None:
            out.append(run(strong, size, bold=True))
        elif emphasis is not None:
            out.append(run(emphasis, size, bold=bold, italic=True))
        else:
            out.append(run(code or "", size - 2, bold=bold, mono=True))
        position = match.end()
    if position < len(text):
        out.append(run(text[position:], size, bold=bold))
    return "".join(out)


def paragraph(
    content: str,
    *,
    style: str | None = None,
    num_id: int | None = None,
    justify: str = "both",
    indent: int | None = None,
    after: int = 80,
    keep_next: bool = False,
) -> str:
    props = []
    if style:
        props.append(f'<w:pStyle w:val="{style}"/>')
    if keep_next:
        props.append("<w:keepNext/>")
    if num_id is not None:
        props.append(f'<w:numPr><w:ilvl w:val="0"/><w:numId w:val="{num_id}"/></w:numPr>')
    props.append(f'<w:spacing w:before="0" w:after="{after}" w:line="252" w:lineRule="auto"/>')
    if indent is not None:
        props.append(f'<w:ind w:left="{indent}"/>')
    props.append(f'<w:jc w:val="{justify}"/>')
    return f'<w:p><w:pPr>{"".join(props)}</w:pPr>{content}</w:p>'


def table(rows: list[list[str]]) -> str:
    columns = max(len(row) for row in rows)
    rows = [row + [""] * (columns - len(row)) for row in rows]
    # Column widths proportional to the longest text in each column, with a minimum share
    lengths = [max(len(row[i]) for row in rows) for i in range(columns)]
    weights = [max(length, 20) ** 0.75 for length in lengths]
    widths = [int(TABLE_WIDTH * weight / sum(weights)) for weight in weights]
    widths[-1] += TABLE_WIDTH - sum(widths)
    grid = "".join(f'<w:gridCol w:w="{width}"/>' for width in widths)
    body = []
    for index, row in enumerate(rows):
        header = index == 0
        cells = []
        for width, text in zip(widths, row):
            shading = '<w:shd w:val="clear" w:color="auto" w:fill="D9E2F3"/>' if header else ""
            cells.append(
                f'<w:tc><w:tcPr><w:tcW w:w="{width}" w:type="dxa"/>{shading}'
                '<w:tcMar><w:left w:w="70" w:type="dxa"/><w:right w:w="70" w:type="dxa"/></w:tcMar>'
                "</w:tcPr>"
                f'<w:p><w:pPr><w:spacing w:before="10" w:after="10" w:line="216" w:lineRule="auto"/></w:pPr>'
                f"{inline_runs(text, TABLE_SIZE, bold=header)}</w:p></w:tc>"
            )
        repeat = "<w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>" if header else "<w:trPr><w:cantSplit/></w:trPr>"
        body.append(f"<w:tr>{repeat}{''.join(cells)}</w:tr>")
    borders = "".join(
        f'<w:{side} w:val="single" w:sz="4" w:space="0" w:color="808080"/>'
        for side in ("top", "left", "bottom", "right", "insideH", "insideV")
    )
    return (
        "<w:tbl><w:tblPr><w:tblStyle w:val=\"TableGridLight\"/>"
        f'<w:tblW w:w="{TABLE_WIDTH}" w:type="dxa"/><w:tblBorders>{borders}</w:tblBorders>'
        '<w:tblLayout w:type="fixed"/><w:tblLook w:val="0420" w:firstRow="1" w:lastRow="0" '
        'w:firstColumn="0" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr>'
        f"<w:tblGrid>{grid}</w:tblGrid>{''.join(body)}</w:tbl>"
        + paragraph("", after=40)
    )


def split_row(line: str) -> list[str]:
    return [cell.strip() for cell in line.strip().strip("|").split("|")]


def convert(markdown: str) -> str:
    markdown = re.sub(r"<!--.*?-->", "", markdown, flags=re.S)
    parts: list[str] = []
    lines = markdown.splitlines()
    i = 0
    buffer: list[str] = []

    def flush() -> None:
        if buffer:
            parts.append(paragraph(inline_runs(" ".join(buffer), BODY_SIZE)))
            buffer.clear()

    while i < len(lines):
        line = lines[i].rstrip()
        stripped = line.strip()
        if not stripped:
            flush()
        elif stripped.startswith("%% "):
            flush()
            label, _, value = stripped[3:].partition(":")
            parts.append(
                paragraph(
                    run(f"{label}:", BODY_SIZE, bold=True) + inline_runs(f" {value.strip()}", BODY_SIZE),
                    justify="left",
                    after=0,
                )
            )
        elif stripped.startswith("% "):
            flush()
            parts.append(paragraph(inline_runs(stripped[2:], 28, bold=True), justify="center", after=120))
        elif stripped.startswith("## "):
            flush()
            parts.append(
                paragraph(inline_runs(stripped[3:], BODY_SIZE, bold=True), after=40, keep_next=True)
            )
        elif stripped.startswith("# "):
            flush()
            parts.append(
                paragraph(
                    inline_runs(stripped[2:], 24, bold=True),
                    style="ListParagraph",
                    num_id=HEADING_NUM_ID,
                    justify="left",
                    after=60,
                    keep_next=True,
                )
            )
        elif stripped.startswith("- "):
            flush()
            parts.append(paragraph(inline_runs(stripped[2:], BODY_SIZE), style="ListParagraph", num_id=BULLET_NUM_ID, after=20))
        elif stripped.startswith("|"):
            flush()
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                if not re.fullmatch(r"\|[\s:|-]+\|?", lines[i].strip()):
                    rows.append(split_row(lines[i]))
                i += 1
            parts.append(table(rows))
            continue
        else:
            buffer.append(stripped)
        i += 1
    flush()
    return "".join(parts)


def build(out: Path) -> None:
    with zipfile.ZipFile(TEMPLATE) as source:
        document = source.read("word/document.xml").decode("utf-8")
        body_start = document.index("<w:body>") + len("<w:body>")
        sect = re.search(r"<w:sectPr\b.*?</w:sectPr>\s*</w:body>", document, re.S)
        if not sect:
            raise SystemExit("Template without a final section properties block")
        new_document = document[:body_start] + convert(SOURCE.read_text("utf-8")) + document[sect.start() :]
        with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as target:
            for item in source.infolist():
                data = new_document.encode("utf-8") if item.filename == "word/document.xml" else source.read(item.filename)
                target.writestr(item, data)
    print(f"Written {out}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--out", type=Path, default=ROOT / "SONAH-technical-report.docx")
    build(parser.parse_args().out)
