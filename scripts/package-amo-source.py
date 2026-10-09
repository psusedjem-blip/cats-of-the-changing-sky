"""Package the source and assets needed to reproduce the AMO upload."""

from pathlib import Path
import json
import zipfile


ROOT = Path(__file__).resolve().parents[1]
VERSION = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))["version"]
ADDON_ZIP = ROOT.parent / f"cats-of-the-changing-sky-v{VERSION}-store.zip"
SOURCE_ZIP = ROOT.parent / f"cats-of-the-changing-sky-v{VERSION}-amo-source.zip"
TEMP_ZIP = SOURCE_ZIP.with_suffix(".zip.tmp")
MAX_SIZE = 200_000_000

BUILD_README = """# Cats of the Changing Sky — AMO source submission

This archive is the source for the separately uploaded add-on ZIP of the same
version. It includes the TypeScript files used to generate `main.js`, the
packaging script, and the local art assets used by the extension. The add-on
does not download code or assets at runtime.

Build environment: Windows or Linux with Node.js 22, npm, and Python 3.12.
Install Node.js 22 (which includes npm) from https://nodejs.org/en/download .
Install Python 3.12 from https://www.python.org/downloads/ . Ensure `node`,
`npm`, and `python` are available on PATH. Check with `node --version`,
`npm --version`, and `python --version`. TypeScript 5.9.3 is pinned in
`package-lock.json` and installed by npm. The release automation builds on
Ubuntu with Node.js 22 and Python 3.12.

From this directory, run this single build script:

    python scripts/build-amo.py

It runs `npm ci`, `npm run check`, and `npm run package:store` in order.
The equivalent commands can also be run individually.

The resulting `cats-of-the-changing-sky-v<VERSION>-store.zip` is written to
the parent directory. Its `manifest.json` is at the archive root. Compare
the contents of that ZIP with the add-on ZIP uploaded alongside this source
archive. ZIP timestamps and compression may differ; member contents should
match. The packaging script removes local test controls and hard-disables
test mode in the store build.

No private framework, service, or API key is needed to build or run the add-on.
""".replace("<VERSION>", VERSION)


def main():
    if not ADDON_ZIP.is_file():
        raise FileNotFoundError(f"Build the matching store ZIP first: {ADDON_ZIP}")

    with zipfile.ZipFile(ADDON_ZIP) as addon:
        if addon.testzip():
            raise RuntimeError("The add-on ZIP is corrupt")
        addon_manifest = json.loads(addon.read("manifest.json"))
        if addon_manifest["version"] != VERSION:
            raise RuntimeError("The add-on ZIP does not match the source version")
        if addon.read("manifest.json") != (ROOT / "manifest.json").read_bytes():
            raise RuntimeError("The add-on ZIP manifest differs from the source")
        runtime_names = set(addon.namelist())

    # Use the submitted add-on's member list to include exactly its runtime
    # assets. Read local source files so the packager's transformations can be
    # reproduced, rather than copying transformed HTML or generated JS.
    source_names = runtime_names - {"main.js"}
    source_names.update({
        "package.json", "package-lock.json", "tsconfig.json",
        "scripts/package-extension.py", "scripts/build-amo.py",
        "test-build.js",
    })
    source_names.update(path.relative_to(ROOT).as_posix()
                        for path in (ROOT / "source").glob("*.ts"))

    try:
        with zipfile.ZipFile(TEMP_ZIP, "w", compression=zipfile.ZIP_DEFLATED,
                             compresslevel=6) as output:
            for name in sorted(source_names):
                path = ROOT / name
                if not path.is_file():
                    raise FileNotFoundError(path)
                output.write(path, name)
            output.writestr("README.md", BUILD_README)
        with zipfile.ZipFile(TEMP_ZIP) as output:
            if bad_file := output.testzip():
                raise RuntimeError(f"Corrupt source archive member: {bad_file}")
        if TEMP_ZIP.stat().st_size > MAX_SIZE:
            raise RuntimeError("Source archive exceeds AMO's 200 MB limit")
        TEMP_ZIP.replace(SOURCE_ZIP)
    finally:
        TEMP_ZIP.unlink(missing_ok=True)

    print(f"{SOURCE_ZIP} ({SOURCE_ZIP.stat().st_size:,} bytes; "
          f"{len(source_names) + 1} files)")


if __name__ == "__main__":
    main()
