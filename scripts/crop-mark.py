"""Crop Mark Larson out of band photos. Run from repo root.

Restore full originals first (Windows - do NOT use git show > file):
  .\\scripts\\restore-originals.ps1

Then:
  python scripts\\crop-mark.py
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent

# name -> (x0, y0, x1, y1) as fractions of width/height
CROPS = {
    "Jason_Plus_the_MLC_2021.JPG": (0.38, 0.0, 1.0, 1.0),
    "JASON_AND_THE_MLC_020.JPG": (0.0, 0.04, 0.70, 0.96),
    "JASON_AND_THE_MLC_036.JPG": (0.0, 0.0, 0.56, 1.0),
    "tosco_2022_christmas_pic.JPG": (0.0, 0.0, 0.34, 1.0),
}

for name, (x0, y0, x1, y1) in CROPS.items():
    path = ROOT / name
    if not path.exists():
        print("skip (missing):", name)
        continue
    im = Image.open(path)
    w, h = im.size
    box = (int(w * x0), int(h * y0), int(w * x1), int(h * y1))
    out = im.crop(box)
    out.save(path, quality=92, optimize=True)
    print("cropped", name, "->", out.size)
