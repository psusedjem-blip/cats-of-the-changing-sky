"""Build a runnable extension ZIP from the local runtime files."""

import json
import argparse
import atexit
from pathlib import Path
import re
import zipfile


ROOT = Path(__file__).resolve().parents[1]
VERSION = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))["version"]
parser = argparse.ArgumentParser(description=__doc__)
format_group = parser.add_mutually_exclusive_group()
format_group.add_argument("--store", action="store_true", help="Build the Chrome Web Store upload")
format_group.add_argument("--firefox", action="store_true", help="Build the Firefox signing upload")
args = parser.parse_args()
release_build = args.store or args.firefox
suffix = "-firefox-upload" if args.firefox else "-store" if args.store else ""
OUTPUT = ROOT.parent / f"cats-of-the-changing-sky-v{VERSION}{suffix}.zip"
TEMP_OUTPUT = OUTPUT.with_name(OUTPUT.name + ".tmp")
atexit.register(lambda: TEMP_OUTPUT.unlink(missing_ok=True))
# Keep the original extracted directory so an unpacked-extension update uses
# the same path and Chrome can retain its local scores and settings.
PREFIX = "" if release_build else "zima-skybells-extension/"

# The ZIP is an allowlist. Art masters, review captures, and superseded assets
# may live beside the project without becoming part of an installed extension.
runtime_assets = {
    "manifest.json", "background.js", "index.html", "main.js", "style.css",
}
if not release_build:
    runtime_assets.add("test-build.js")
zima_poses = (
    "animation-clean-atlas.webp", "turn-pose.webp", "idle-four-keys.webp",
    "turn-front.webp", "turn-middle.webp", "idle-sixteen.webp",
    "walk-sixteen.webp", "crouch-sixteen.webp", "launch-sixteen.webp",
    "rise-sixteen.webp", "apex-sixteen.webp", "fall-sixteen.webp",
    "contact-sixteen.webp", "side-contact-sixteen.webp", "land-sixteen.webp",
    "top-contact.webp", "underside-contact.webp", "airborne-boost.webp",
    "fall-pose.png", "fall-tuck.png",
)
runtime_assets.update(f"assets/characters/zima/{pose}" for pose in zima_poses)

companion_poses = (
    "apex-keys.webp", "apex.webp", "boost-contact.webp",
    "contact.png", "crouch-keys.webp", "fall-keys.webp", "fall-tuck.webp",
    "fall.png", "idle-sixteen.webp", "idle.png", "land.png",
    "launch-keys.webp", "launch.webp", "recover.webp", "rise-keys.webp",
    "rise.png", "side-contact.webp", "top-contact.webp", "turn.webp",
    "underside-contact.webp", "walk-keys.webp", "walk-sixteen.webp", "walk.png",
)
cats = ("zima", "earl-grey", "betty-davis", "gracie-bell")
for cat in cats[1:]:
    runtime_assets.update(f"assets/characters/{cat}/{pose}" for pose in companion_poses)
for cat in cats:
    runtime_assets.add(f"assets/characters/{cat}/kitten.webp")
    runtime_assets.add(f"assets/characters/{cat}/kitten-poses.webp")
    runtime_assets.add(f"assets/characters/{cat}/kitten-air-poses.webp")

progression_art = (
    "fish", "crate", "cat-bed", "windstep-boots", "softstep-boots",
    "aurora-compass", "echo-charm", "bellwake", "softfall",
    "camp-provision", "route-reroll",
)
runtime_assets.update(f"assets/progression/{name}.webp" for name in progression_art)
for season in ("winter", "spring", "summer", "autumn"):
    runtime_assets.update(f"assets/seasonal/{season}-painted-{part}.png"
                          for part in ("bg", "ground"))
    runtime_assets.update(f"assets/themes/{season}/{season}-{part}.webp"
                          for part in ("bridge", "high-terrain"))
    runtime_assets.update(f"assets/themes/{season}/{season}-{part}-v1.png"
                          for part in ("continuous-world", "upper-sky", "starfield"))
    runtime_assets.update(f"assets/themes/{season}/{name}.webp"
                          for name in ("airborne-atlas", "objects-atlas", "sky", "upper-foothold"))
    if season == "winter":
        runtime_assets.update(f"assets/themes/winter/{name}.webp" for name in (
            "far-mountains", "ground-front", "mid-pines", "mid-village", "winter-snow-reeds"))
        runtime_assets.add("assets/themes/winter/winter-mid-terrain-v2.png")
    else:
        runtime_assets.update(f"assets/themes/{season}/{name}.webp"
                              for name in ("far", "ground", "mid", "near", f"{season}-mid-terrain"))
        runtime_assets.add(f"assets/themes/{season}/" + {
            "spring": "spring-flower-bank",
            "summer": "windmill-prop",
            "autumn": "scarecrow-prop",
        }[season] + ".webp")

festival_routes = ("starlight-eve", "great-egg-hunt", "fireworks-fair", "moonlit-masquerade")
new_world_routes = ("great-yarn-tangle", "turtleback-world", "cat-lockup-expedition", "moonlit-aquarium")
festival_parts = ("world", "upper-sky", "starfield", "ground", "targets", "visitor", "foothold", "cat-bed")
runtime_assets.update(f"assets/themes/{route}/{part}.png"
                      for route in festival_routes for part in festival_parts)
runtime_assets.update(f"assets/themes/{route}/{part}.webp"
                      for route in new_world_routes for part in festival_parts)
runtime_assets.add("assets/achievements/atlas.webp")

for size in (16, 32, 48, 128):
    runtime_assets.add(f"icons/icon{size}.png")
    runtime_assets.update(f"icons/cats/{cat}-{size}.png" for cat in cats)
files = [ROOT / name for name in sorted(runtime_assets)]

for path in files:
    if not path.is_file():
        raise FileNotFoundError(path)

with zipfile.ZipFile(TEMP_OUTPUT, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for path in sorted(set(files)):
        member = PREFIX + path.relative_to(ROOT).as_posix()
        if args.firefox and path.name == "manifest.json":
            firefox_manifest = ROOT / "manifest.firefox.json"
            if json.loads(firefox_manifest.read_text(encoding="utf-8"))["version"] != VERSION:
                raise RuntimeError("Firefox manifest version differs from Chrome manifest")
            archive.write(firefox_manifest, member)
        elif release_build and path.name == "index.html":
            html = path.read_text(encoding="utf-8")
            html = re.sub(r'\s*<!-- LOCAL TEST START -->.*?<!-- LOCAL TEST END -->\s*', "\n", html, flags=re.S)
            html = re.sub(r'^\s*<script src="test-build\.js" data-local-test></script>\s*\n', "", html, flags=re.M)
            if 'test-build.js' in html or 'dev-controls' in html or 'dev-status' in html:
                raise RuntimeError("Store page still references local test mode")
            archive.writestr(member, html)
        elif release_build and path.name == "main.js":
            javascript = path.read_text(encoding="utf-8")
            flag = "const LOCAL_TEST_BUILD = globalThis.SKYBELLS_LOCAL_TEST_BUILD === true;"
            if javascript.count(flag) != 1:
                raise RuntimeError("Store build could not disable local test mode")
            archive.writestr(member, javascript.replace(flag, "const LOCAL_TEST_BUILD = false;"))
        else:
            archive.write(path, member)

with zipfile.ZipFile(TEMP_OUTPUT) as archive:
    if bad_file := archive.testzip():
        raise RuntimeError(f"Corrupt archive member: {bad_file}")
    if any(name.endswith("animation-atlas-256.png") for name in archive.namelist()):
        raise RuntimeError("Unneeded source atlas was included")
    if len(archive.namelist()) != len(set(archive.namelist())):
        raise RuntimeError("Archive contains duplicate members")
    if any(name.endswith(".md") or "/media/" in name or "/docs/" in name for name in archive.namelist()):
        raise RuntimeError("Archive contains documentation or media")
    icon_assets = [f"icons/icon{size}.png" for size in (16, 32, 48, 128)]
    icon_assets += [f"icons/cats/{cat}-{size}.png"
                    for cat in ("zima", "earl-grey", "betty-davis", "gracie-bell")
                    for size in (16, 32, 48, 128)]
    missing_icons = [ref for ref in icon_assets if PREFIX + ref not in archive.namelist()]
    if missing_icons:
        raise RuntimeError(f"Missing extension icon assets: {missing_icons}")
    if release_build:
        if "manifest.json" not in archive.namelist() or "README.md" in archive.namelist():
            raise RuntimeError("Store archive layout is invalid")
    else:
        if PREFIX + "manifest.json" not in archive.namelist():
            raise RuntimeError("Sideload archive layout is invalid")
    html = archive.read(PREFIX + "index.html").decode("utf-8")
    if release_build and ("test-build.js" in html or "test-build.js" in archive.namelist()):
        raise RuntimeError("Local test controls leaked into the store package")
    if f'main.js?v={VERSION}' not in html:
        raise RuntimeError("Preview page script version differs from manifest")
    javascript = archive.read(PREFIX + "main.js").decode("utf-8")
    if release_build and ("const LOCAL_TEST_BUILD = false;" not in javascript or
                       "SKYBELLS_LOCAL_TEST_BUILD" in javascript):
        raise RuntimeError("Store code still allows local test mode")
    asset_refs = set(re.findall(r"assets/[A-Za-z0-9_./-]+\.(?:webp|png)", javascript))
    missing_assets = sorted(ref for ref in asset_refs if PREFIX + ref not in archive.namelist())
    if missing_assets:
        raise RuntimeError(f"Missing runtime asset references: {missing_assets}")
    terrain_assets = [
        f"assets/themes/{season}/{season}-{stage}.webp"
        for season in ("winter", "spring", "summer", "autumn")
        for stage in ("bridge", "high-terrain")
    ]
    terrain_assets += ["assets/themes/winter/winter-mid-terrain-v2.png"]
    terrain_assets += [f"assets/themes/{season}/{season}-mid-terrain.webp"
                       for season in ("spring", "summer", "autumn")]
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

    progression_assets = [
        f"assets/progression/{name}.webp"
        for name in ("fish", "crate", "cat-bed", "windstep-boots", "softstep-boots",
                     "aurora-compass", "echo-charm", "bellwake", "softfall",
                     "camp-provision", "route-reroll")
    ]
    missing_progression = [ref for ref in progression_assets if PREFIX + ref not in archive.namelist()]
    if missing_progression:
        raise RuntimeError(f"Missing progression art: {missing_progression}")

    festival_assets = [f"assets/themes/{route}/{part}.png"
                       for route in festival_routes for part in festival_parts]
    missing_festival = [ref for ref in festival_assets if PREFIX + ref not in archive.namelist()]
    if missing_festival:
        raise RuntimeError(f"Missing festival route art: {missing_festival}")

TEMP_OUTPUT.replace(OUTPUT)
print(f"{OUTPUT} ({OUTPUT.stat().st_size:,} bytes; {len(files)} files; {len(asset_refs)} static, {len(terrain_assets)} terrain, {len(continuous_assets)} continuous-world, {len(dynamic_character_assets)} character, and {len(progression_assets)} progression references checked)")
