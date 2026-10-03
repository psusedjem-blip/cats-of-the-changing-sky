"""Build a runnable extension ZIP from the local runtime files."""

import json
import argparse
from pathlib import Path
import re
import zipfile


ROOT = Path(__file__).resolve().parents[1]
VERSION = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))["version"]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--store", action="store_true", help="Place manifest.json at ZIP root for browser store upload")
args = parser.parse_args()
OUTPUT = ROOT.parent / f"cats-of-the-changing-sky-v{VERSION}{'-store' if args.store else ''}.zip"
# Keep the original extracted directory so an unpacked-extension update uses
# the same path and Chrome can retain its local scores and settings.
PREFIX = "" if args.store else "zima-skybells-extension/"

files = [ROOT / name for name in (
    "manifest.json", "background.js", "index.html", "main.js", "style.css",
    "assets/zima-animation-clean-atlas.webp", "assets/zima-turn-pose.webp",
    "assets/zima-idle-four-keys.webp",
    "assets/zima-turn-front.webp",
    "assets/zima-turn-middle.webp",
    "assets/zima-idle-sixteen.webp",
    "assets/zima-walk-sixteen.webp",
    "assets/zima-crouch-sixteen.webp",
    "assets/zima-launch-sixteen.webp",
    "assets/zima-rise-sixteen.webp",
    "assets/zima-apex-sixteen.webp",
    "assets/zima-fall-sixteen.webp",
    "assets/zima-contact-sixteen.webp",
    "assets/zima-side-contact-sixteen.webp",
    "assets/zima-land-sixteen.webp",
    "assets/zima-top-contact.webp",
    "assets/zima-underside-contact.webp",
    "assets/zima-airborne-boost.webp",
    "assets/zima-fall-pose.png",
    "assets/zima-fall-tuck.png",
)]
folders = ["assets/themes", "assets/seasonal", "assets/characters", "icons"]
for folder in folders:
    files.extend(path for path in (ROOT / folder).rglob("*") if path.is_file())

for path in files:
    if not path.is_file():
        raise FileNotFoundError(path)

with zipfile.ZipFile(OUTPUT, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for path in sorted(set(files)):
        archive.write(path, PREFIX + path.relative_to(ROOT).as_posix())

with zipfile.ZipFile(OUTPUT) as archive:
    if bad_file := archive.testzip():
        raise RuntimeError(f"Corrupt archive member: {bad_file}")
    assert PREFIX + "assets/zima-animation-atlas-256.png" not in archive.namelist()
    assert len(archive.namelist()) == len(set(archive.namelist()))
    assert not any(name.endswith(".md") or "/media/" in name or "/docs/" in name for name in archive.namelist())
    if args.store:
        assert "manifest.json" in archive.namelist()
        assert "README.md" not in archive.namelist()
    else:
        assert PREFIX + "manifest.json" in archive.namelist()
    html = archive.read(PREFIX + "index.html").decode("utf-8")
    if f'main.js?v={VERSION}' not in html:
        raise RuntimeError("Preview page script version differs from manifest")
    javascript = archive.read(PREFIX + "main.js").decode("utf-8")
    asset_refs = set(re.findall(r"assets/[A-Za-z0-9_./-]+\.(?:webp|png)", javascript))
    missing_assets = sorted(ref for ref in asset_refs if PREFIX + ref not in archive.namelist())
    if missing_assets:
        raise RuntimeError(f"Missing runtime asset references: {missing_assets}")
    terrain_assets = [
        f"assets/themes/{season}/{season}-{stage}.webp"
        for season in ("winter", "spring", "summer", "autumn")
        for stage in ("bridge", "mid-terrain", "high-terrain")
    ]
    missing_terrain = [ref for ref in terrain_assets if PREFIX + ref not in archive.namelist()]
    if missing_terrain:
        raise RuntimeError(f"Missing seasonal terrain assets: {missing_terrain}")
    continuous_assets = [
        f"assets/themes/{season}/{season}-{panel}-v1.png"
        for season in ("winter", "spring", "summer", "autumn")
        for panel in ("continuous-world", "upper-sky", "starfield")
    ]
    missing_continuous = [ref for ref in continuous_assets if PREFIX + ref not in archive.namelist()]
    if missing_continuous:
        raise RuntimeError(f"Missing continuous-world assets: {missing_continuous}")
    dynamic_character_assets = [
        f"assets/characters/{cat}/{pose}.png"
        for cat in ("earl-grey", "betty-davis", "gracie-bell")
        for pose in ("idle", "walk", "rise", "fall", "contact", "land")
    ]
    dynamic_character_assets += [
        f"assets/characters/{cat}/{pose}.webp"
        for cat in ("earl-grey", "betty-davis", "gracie-bell")
        for pose in ("walk-keys", "walk-sixteen", "idle-sixteen", "launch", "apex", "fall-tuck", "recover",
                     "side-contact", "top-contact", "underside-contact",
                     "boost-contact", "turn")
    ]
    dynamic_character_assets += [
        f"assets/characters/{cat}/{family}-keys.webp"
        for cat in ("earl-grey", "betty-davis", "gracie-bell")
        for family in ("crouch", "launch", "rise", "apex", "fall")
    ]
    missing_character_assets = [ref for ref in dynamic_character_assets if PREFIX + ref not in archive.namelist()]
    if missing_character_assets:
        raise RuntimeError(f"Missing character pose assets: {missing_character_assets}")

print(f"{OUTPUT} ({OUTPUT.stat().st_size:,} bytes; {len(files)} files; {len(asset_refs)} static, {len(terrain_assets)} terrain, {len(continuous_assets)} continuous-world, and {len(dynamic_character_assets)} character references checked)")
