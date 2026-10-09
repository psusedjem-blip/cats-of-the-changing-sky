"""Rebuild the submitted AMO add-on ZIP from this source archive."""

from pathlib import Path
import os
import subprocess


ROOT = Path(__file__).resolve().parents[1]
NPM = "npm.cmd" if os.name == "nt" else "npm"

for args in ((NPM, "ci"), (NPM, "run", "check"),
             (NPM, "run", "package:store")):
    subprocess.run(args, cwd=ROOT, check=True)
