from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
IMG_DIR = ROOT / "docs" / "entregables" / "pdf-rendered"
OUT = ROOT / "docs" / "entregables" / "pdf_contact_sheet.png"


def build():
    pages = sorted(IMG_DIR.glob("page-*.png"))
    thumbs = []
    for idx, path in enumerate(pages, start=1):
        img = Image.open(path).convert("RGB")
        img.thumbnail((300, 390))
        canvas = Image.new("RGB", (320, 430), "white")
        x = (320 - img.width) // 2
        canvas.paste(img, (x, 20))
        draw = ImageDraw.Draw(canvas)
        draw.text((12, 402), f"Pagina {idx}", fill=(30, 41, 59))
        thumbs.append(canvas)

    cols = 2
    rows = (len(thumbs) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 320, rows * 430), (240, 244, 248))
    for i, thumb in enumerate(thumbs):
        sheet.paste(thumb, ((i % cols) * 320, (i // cols) * 430))
    sheet.save(OUT)
    print(OUT)


if __name__ == "__main__":
    build()
