from pathlib import Path
import html
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    PageBreak,
    Table,
    TableStyle,
    Preformatted,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "documento-academico.md"
OUTDIR = ROOT / "docs" / "entregables"
PDF_PATH = OUTDIR / "Tarea_3_Pruebas_Automatizadas.pdf"

BLUE = colors.HexColor("#2E74B5")
DARK_BLUE = colors.HexColor("#1F4D78")
LIGHT_BLUE = colors.HexColor("#E8EEF5")
LIGHT_GRAY = colors.HexColor("#F2F4F7")
BORDER = colors.HexColor("#C9D3DF")
INK = colors.HexColor("#1F2937")
MUTED = colors.HexColor("#64748B")


def inline(text):
    text = html.escape(text)
    text = re.sub(r"`([^`]+)`", r"<font name='Courier' color='#1F4D78'>\1</font>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"\*([^*]+)\*", r"<i>\1</i>", text)
    return text


def styles():
    base = getSampleStyleSheet()
    base.add(
        ParagraphStyle(
            name="CoverTitle",
            fontName="Helvetica-Bold",
            fontSize=24,
            leading=30,
            textColor=BLUE,
            alignment=TA_CENTER,
            spaceAfter=20,
        )
    )
    base.add(
        ParagraphStyle(
            name="Cover",
            fontName="Helvetica",
            fontSize=12,
            leading=16,
            textColor=INK,
            alignment=TA_CENTER,
            spaceAfter=6,
        )
    )
    base.add(
        ParagraphStyle(
            name="BodyAcademic",
            fontName="Helvetica",
            fontSize=10.5,
            leading=13,
            textColor=INK,
            alignment=TA_LEFT,
            spaceAfter=7,
        )
    )
    base.add(
        ParagraphStyle(
            name="H1Academic",
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=19,
            textColor=BLUE,
            spaceBefore=14,
            spaceAfter=8,
        )
    )
    base.add(
        ParagraphStyle(
            name="H2Academic",
            fontName="Helvetica-Bold",
            fontSize=12.5,
            leading=16,
            textColor=DARK_BLUE,
            spaceBefore=10,
            spaceAfter=6,
        )
    )
    base.add(
        ParagraphStyle(
            name="BulletAcademic",
            parent=base["BodyAcademic"],
            leftIndent=18,
            bulletIndent=6,
            spaceAfter=4,
        )
    )
    base.add(
        ParagraphStyle(
            name="CodeAcademic",
            fontName="Courier",
            fontSize=8.5,
            leading=11,
            textColor=INK,
            backColor=LIGHT_GRAY,
            borderColor=colors.HexColor("#E5E7EB"),
            borderWidth=0.5,
            borderPadding=6,
            spaceAfter=8,
        )
    )
    base.add(
        ParagraphStyle(
            name="SmallTable",
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=INK,
        )
    )
    return base


def add_cover(story, st):
    story.append(Paragraph("<b>Universidad del Valle de Guatemala</b>", st["Cover"]))
    for line in [
        "Facultad de Ingenieria",
        "Departamento de Ciencias de la Computacion",
        "CC3091 - Ingenieria de Software 2",
        "Semestre II - 2026",
    ]:
        story.append(Paragraph(line, st["Cover"]))
    story.append(Spacer(1, 0.35 * inch))
    story.append(Paragraph("Tarea 3<br/>Pruebas Automatizadas", st["CoverTitle"]))
    story.append(Spacer(1, 0.15 * inch))
    story.append(
        Paragraph(
            "<b>Proyecto:</b><br/>App de Apoyo y Orientacion para Solicitantes de Visa",
            st["Cover"],
        )
    )
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph("<b>Integrantes:</b>", st["Cover"]))
    for line in [
        "Diego Quan - 24336",
        "Diego Sebastian Guevara Casasola - 24128",
        "Juan Francisco Orozco Mijangos - 24647",
        "Norman Aguirre - 24479",
    ]:
        story.append(Paragraph(line, st["Cover"]))
    story.append(Spacer(1, 0.25 * inch))
    story.append(Paragraph("Ciudad de Guatemala, Guatemala<br/>Julio de 2026", st["Cover"]))
    story.append(PageBreak())


def add_toc(story, st):
    story.append(Paragraph("Contenido", st["H1Academic"]))
    sections = [
        "1. Resumen ejecutivo",
        "2. Introduccion",
        "3. Descripcion del proyecto",
        "4. Arquitectura real del sistema",
        "5. Importancia de las pruebas automatizadas",
        "6. Fundamentos de pruebas",
        "7. Herramientas investigadas para frontend",
        "8. Herramientas investigadas para backend",
        "9. Comparacion de herramientas",
        "10. Seleccion de herramientas",
        "11. Justificacion de Vitest y React Testing Library",
        "12. Justificacion de Jest y Supertest",
        "13. Configuracion implementada",
        "14. Estrategia de pruebas",
        "15. Pruebas implementadas en frontend",
        "16. Pruebas implementadas en backend",
        "17. Resultados",
        "18. Cobertura",
        "19. Ventajas",
        "20. Desventajas",
        "21. Tiempo empleado",
        "22. Hallazgos tecnicos",
        "23. Conclusiones",
        "24. Recomendaciones",
        "25. Referencias",
        "26. Anexos",
    ]
    for section in sections:
        story.append(Paragraph(section, st["BodyAcademic"]))
    story.append(PageBreak())


def add_table(story, rows, st):
    data = []
    for row in rows:
        cells = [cell.strip() for cell in row.strip().strip("|").split("|")]
        data.append([Paragraph(inline(cell), st["SmallTable"]) for cell in cells])
    if not data:
        return
    col_count = len(data[0])
    available = 6.5 * inch
    widths = [available / col_count for _ in range(col_count)]
    table = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), LIGHT_BLUE),
                ("TEXTCOLOR", (0, 0), (-1, 0), DARK_BLUE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.35, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(table)
    story.append(Spacer(1, 8))


def page_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawCentredString(letter[0] / 2, 0.45 * inch, f"Tarea 3 - Pruebas Automatizadas | Pagina {doc.page}")
    canvas.restoreState()


def build():
    OUTDIR.mkdir(parents=True, exist_ok=True)
    st = styles()
    story = []
    add_cover(story, st)
    add_toc(story, st)

    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    skip_cover = False
    in_code = False
    code_lines = []
    table_rows = []

    for raw in lines:
        line = raw.rstrip()
        stripped = line.strip()

        if stripped == "## Portada":
            skip_cover = True
            continue
        if skip_cover:
            if stripped.startswith("## 1. "):
                skip_cover = False
            else:
                continue

        if stripped.startswith("```"):
            if in_code:
                story.append(Preformatted("\n".join(code_lines), st["CodeAcademic"]))
                code_lines = []
                in_code = False
            else:
                in_code = True
            continue

        if in_code:
            code_lines.append(line)
            continue

        if stripped.startswith("|") and "|" in stripped[1:]:
            if re.match(r"^\|\s*-+", stripped):
                continue
            table_rows.append(stripped)
            continue
        if table_rows:
            add_table(story, table_rows, st)
            table_rows = []

        if not stripped:
            continue
        if stripped.startswith("# "):
            continue
        if stripped.startswith("## "):
            story.append(Paragraph(inline(stripped[3:]), st["H1Academic"]))
            continue
        if stripped.startswith("### "):
            story.append(Paragraph(inline(stripped[4:]), st["H2Academic"]))
            continue
        if stripped.startswith("- "):
            story.append(Paragraph(inline(stripped[2:]), st["BulletAcademic"], bulletText="-"))
            continue
        number_match = re.match(r"^(\d+)\.\s+(.*)$", stripped)
        if number_match:
            story.append(Paragraph(inline(number_match.group(2)), st["BulletAcademic"], bulletText=f"{number_match.group(1)}."))
            continue

        story.append(Paragraph(inline(stripped.replace("  ", " ")), st["BodyAcademic"]))

    if table_rows:
        add_table(story, table_rows, st)

    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=letter,
        rightMargin=1 * inch,
        leftMargin=1 * inch,
        topMargin=1 * inch,
        bottomMargin=0.8 * inch,
        title="Tarea 3: Pruebas Automatizadas",
        author="Diego Quan, Diego Sebastian Guevara Casasola, Juan Francisco Orozco Mijangos, Norman Aguirre",
    )
    doc.build(story, onFirstPage=page_footer, onLaterPages=page_footer)
    print(PDF_PATH)


if __name__ == "__main__":
    build()
