# Development and packaging

The [README](../README.md) is the player guide. This document keeps source, release, and test details needed when maintaining the extension.

## Source and branches

`main` is stable; work is reviewed on `beta`. A branch push runs the build and package workflow and publishes branch-specific GitHub releases. GitHub publication does not sign or submit a Firefox add-on. Mozilla signs the Firefox XPI after an upload is approved.

The runtime is `index.html`, `background.js`, `style.css`, compiled `main.js`, and `assets/`. Edit TypeScript under `source/`; `source/main.ts` assembles the bundle. Music is in `source/audio.ts`, contacts in `source/gameplay.ts`, scenery in `source/chapters.ts` and the scene render files, characters in their render files, and menus in `source/hud-render.ts` and `source/progression-ui.ts`.

For each packaged update, increment both browser manifests, `package.json`, `package-lock.json`, and the `main.js?v=` query in `index.html`. Add a matching `CHANGELOG.md` section; the release workflow copies that section into release notes.

## Build and package

Install Node.js and Python 3. Run `npm ci`, then `npm run check` and `npm run build`.

| Command | Output |
| --- | --- |
| `npm run package:sideload` | Chrome/Edge ZIP with an enclosing extension folder and local test controls |
| `npm run package:store` | Chrome Web Store ZIP without local test controls |
| `npm run package:firefox` | Unsigned Firefox upload ZIP with the Firefox manifest |
| `npm run package:amo-source` | Firefox upload ZIP plus matching source archive for Mozilla reviewers |

`scripts/package-extension.py --output <path>` can write a local test ZIP without replacing a versioned release ZIP. The packager checks archive integrity and asset references before replacing its target. New runtime art must be added to its allowlist.

Sideload builds include `test-build.js`. Press `Ctrl+Alt+T` to toggle test mode; `F` toggles flight, and `W/S` or Up/Down controls altitude. Test mode bypasses world and kitten locks and offers temporary fish in Settings. Test fish and purchases revert when test mode ends or the game reopens. Test runs do not earn permanent fish, achievements, or score board entries. Store packages exclude the test script and disable test mode.

## World consistency

Every world uses the same world → upper sky → starfield hierarchy. The first four worlds are free; the other eight use the same unlock and selection flow. Their targets, airborne visitors, particles, music, and stage art differ, while scoring and mode rules are shared.

| World | Ambient detail | Music direction |
| --- | --- | --- |
| Winter | Snowflakes | Piano, mallet, and low cello |
| Spring | Slanting rain and petals | Chimes and rising piano |
| Summer | Golden pollen | Bright piano and mallet |
| Autumn | Amber leaves | Slower piano and cello |
| Starlight Eve | Starlight motes | Seven-beat piano and chime replies |
| Great Egg Hunt | Decorated egg motes | Five-beat mallet and plucked notes |
| Fireworks Fair | Sparks and upper-sky bursts | Eight-beat piano and chimes |
| Moonlit Masquerade | Mask-shaped motes | Six-beat cello and piano |
| The Great Yarn Tangle | Yarn pom-poms and thread curls | Five-beat plucked music box |
| Turtleback World | Shell-pattern motes | Six-beat cello and chime replies |
| Cat Lockup Expedition | Floating golden keys | Seven-beat cello and mallet calls |
| Moonlit Aquarium | Rising bubbles | Eight-beat pad and chimes |

The climb uses upward world coordinates. Bells move downward through `fieldDrop`; painted panels stay at fixed altitude anchors in `source/chapters.ts`. Mystery crates have fixed world positions. Review the transition at several altitudes and on more than one viewport size when changing scenery.

Existing `zima-skybells-*` local storage keys hold scores and preferences; `cats-changing-sky-progression-v1` holds fish, gear, equipped slots, and supplies. Keep imports compatible with prior saves. Validate every cat, world, and mode in a browser before release.
