# Cats of the Changing Sky — Chrome Extension

A self-contained seasonal climbing game featuring Zima, Earl Grey, Betty Davis, and Gracie Bell. Formerly Zima's Skybells.

## Version 3.38.0 — world art, high sky, and score clarity

- Repainted the Yarn Tangle and Turtleback ascents. Yarn forms and buttons are rounder; Turtleback shows the turtle's head and front limbs below the world it carries.
- Updated the title-screen previews to show those same paintings. Reworked the player README around installation, one twelve-world gallery, and adult/kitten stills; moved build details to a development guide.
- Reviewed all twelve worlds at multiple heights. Upper-sky painted wisps now have irregular edges and varied fixed positions. The four new worlds retain ambience after the authored panels end, with sky colors matched to their starfield art. Starfield panels keep their original proportions instead of stretching circular details into ovals.
- Replaced the boxed score bar with shadowed Score and mode Best readouts. Removed the redundant lower-right gear and added Settings to the main menu.
- Kept the shared 10/20/30 bronze, silver, and crystal bell values across all worlds. Results now split each run's score into base points and multiplier bonus; Settings explains when the multiplier applies.
- Adjusted new-world ground placement and kitten paw anchoring. Raised early achievement milestones while retaining tiers already earned in older saves.
- Recompressed two existing world paintings without changing their pixels so the Firefox upload and matching source archives fit Mozilla's size limit.

This beta passed TypeScript, package integrity, four-world kitten gameplay, all-world sky captures, new-world transition captures, and all-world scoring checks. A manual Chrome install and final audio listening review remain. Permanent Firefox installation requires Mozilla signing of this version's XPI.

## Version 3.37.1 — four new worlds and Firefox packaging

- Added The Great Yarn Tangle, Turtleback World, Cat Lockup Expedition, and Moonlit Aquarium as fish-unlocked worlds in a thumbnail carousel. Each has its own ground, targets, airborne visitor, scenery, particles, and musical arrangement. Their painted ascents now move from a distinct ground scene through middle scenery into an illustrated star-filled upper sky.
- Gave all twelve worlds distinct ambient particles: snow, rain and petals, pollen, and leaves for the original seasons; starlight, decorated eggs, fireworks, and masks for the festivals; yarn pom-poms, shell patterns, keys, and rising bubbles for the four new worlds. Festival and new-world contact effects use those same world-specific shapes.
- Added separate procedural music arrangements for the four new worlds: Yarn Tangle's five-beat plucked music-box motif, Turtleback's six-beat low cello and high chime replies, Cat Lockup's seven-beat escape motif, and Aquarium's eight-beat floating pad and chimes. All twelve worlds route to their own melody, chord progression, and arrangement rather than reusing another world's score.
- Added fish-unlocked kitten forms for the four original cats. Each form has separate ground and airborne pose sheets; frame isolation prevents neighboring atlas cells from appearing during animation.
- Added 25 illustrated achievement tracks with Bronze, Silver, and Gold milestones, persistent stat tracking, in-game announcements, and a title-screen collection.
- Made the score panel slimmer and more transparent, and kept mystery crates fixed at world positions.
- Added **Import game data** in Settings alongside export. Import validates the JSON and confirms before replacing the current browser save.
- Split the Chrome and Firefox manifests so Chrome no longer receives the unsupported `background.scripts` warning. Chrome/Edge sideload and store ZIPs use the Chrome manifest; the Firefox upload ZIP and reproducible source archive use the Firefox manifest. Firefox installation still requires a Mozilla-signed XPI.

This beta was checked with TypeScript, package integrity checks, browser rendering at multiple altitudes in the four new worlds, all-world particle smoke checks, music route checks, save import checks, and kitten gameplay checks. A loaded Chrome extension and final music listening review remain to be checked manually.

## Version 3.34.26 — airborne interception

- Seasonal birds choose a reachable world altitude before crossing and keep it while the camera rises or falls. They enter from the nearer edge, give a visible warning, and continue moving during a fall.
- A deliberate-steering route caught birds in all four seasons and three modes. A controlled falling-cat route caught one in every season and mode, with the multiplier and recovery launch intact. The birds still cross the full screen.

## Version 3.34.25 — Zima body-turn bridge

- A cleaned middle-angle body pose now bridges Zima's side and front turn views. Four-season handoff captures show entry, front, and exit angles with zero browser errors.
- Twelve longer input-driven recordings cover walking, one launch, fall, and landing in every season and mode. Short launch recordings separately cover bell contact. Full-speed motion, scenery, and audio acceptance remain open.

## Version 3.34.24 — Zima expressive motion candidate

- A newly assembled 256-cell Zima art-source atlas covers idle, travel, crouch, launch, rise, apex, fall, bell contact, and landing. Sixteen cleaned family cuts passed alpha, boundary, and exact-duplicate audits; the source remains a review candidate until full motion timing is accepted.
- Zima now previews the new crouch, launch, rise, apex, fall, contact, landing, and front-facing turn art in play, with the prior poses as loading fallbacks. Art changes leave collision, scoring, and movement rules unchanged.
- Twelve short natural-input launch routes cover four seasons and Classic, Zen, and Expedition with zero browser errors. Direct uninterrupted full-route motion review and release visual/audio acceptance remain open.

## Version 3.34.23 — Zima expressive ground-motion preview

- Zima has distinct sixteen-pose idle and walking cycles, including a blink and curious head lift. The source figures were cleaned and registered to one paw baseline; his earlier atlas remains the loading fallback. Walk playback advances by ground distance.
- All four seasonal scarf colors and ground contact were reviewed at game scale. Four normal-input seasonal walks reached every new pose without leaving ground or producing browser errors. Contacts, scoring, and collision rules are unchanged. Milestone 39 still requires the airborne and contact families, a full 256-cell source, and uninterrupted play review.

## Version 3.34.22 — companion motion scale

- Betty and Gracie's airborne motion frames now match the visible body size of their event paintings, using the same correction introduced for Earl in 3.34.21. Grounded poses and all collision bodies are unchanged.
- Fixed-scale Canvas captures and eight new normal-timing Zen recordings cover both cats in all four seasons. The motion and four-cat/three-mode checks passed. See `docs/COMPANION-ART-PRODUCTION.md` for the remaining milestone gates.

## Version 3.34.12 — lower-ascent background joins

- The bridge and middle terrain now overlap the established mountain and hill layers during the climb. Their visible crop edges are feathered before the screen boundary, closing the horizontal breaks above the towns at wide aspect ratios.
- Upper terrain is cached after image decoding. The single sky covers the top of the frame and fades into open atmosphere higher in the climb, without tiling.
- Four 0–6,000–0 seasonal recordings and 2048×915 fixed-height probes are in `review/temporal-background/`. The controlled transform checks found no jumps or duplicate sky draws. Direct in-game visual acceptance remains open.

## Version 3.34.11 — longer high-ridge traversal

- Each season's existing high-terrain painting now moves at a slower distant depth and remains visible through more of the upper climb. It enters once at cameraY 5,100 and leaves at 17,100; sky and terrain do not tile.
- Four full-height ascent/descent recordings, 1,801-frame transform checks at two viewport sizes, and normal Zen play were reviewed. See `docs/TEMPORAL-BACKGROUND-DIAGNOSTIC.md` for evidence and the remaining visible-review limits.

## Version 3.34.10 — single-traversal painted skies

- The seasonal sky painting now moves slowly downward once as the camera climbs. Its softened upper edge reveals a source-matched atmosphere color; the same moon, sun, clouds, and aurora no longer stay fixed at every altitude.
- Four full 0–12,000–0 camera recordings, four normal Zen climbs, a boost/fall return, and transform traces are recorded in `review/temporal-background/`. See `docs/TEMPORAL-BACKGROUND-DIAGNOSTIC.md` for the corrected diagnosis and remaining visual-review limits.

## Version 3.34.9 — temporal background composition

- Upper seasonal paintings now enter and leave through fixed world anchors and one camera-derived parallax transform. Their existing solid lower edges receive a cached alpha feather; the paintings draw behind the near scenery.
- Spring's near-layer low-alpha wash is reduced in the runtime canvas. Source artwork and gameplay rules are unchanged.
- The architecture, source-alpha measurements, transform trace, continuous climbs, boost, fall, and ground return are recorded in `docs/TEMPORAL-BACKGROUND-DIAGNOSTIC.md` and `review/temporal-background/`. Direct visible-session art acceptance remains open.

## Version 3.34.8 — Winter middle ridge refinement

- A new transparent Winter middle ridge gives the bridge-to-observatory climb a distinct valley silhouette. The original middle terrain stays in the project as a comparison asset.
- Controlled up-and-down camera sweeps compare the old and new handoff in `review/winter-mid-v2-candidate/`. This is visual transition evidence, not a natural-play or final art acceptance signoff. Gameplay, collision, scoring, and movement rules are unchanged.
- GPU-backed Chrome and Edge on the host NVIDIA GTX 1660 SUPER held a 13.3 ms median and at most 13.5 ms p95 across eight live 1920×1080 routes. The actual unpacked extension in GPU-backed Edge also passed seven live routes and a controlled 6,000-unit Winter ridge check at a 13.3 ms median and at most 13.5 ms p95. A visible browser-session check remains open.
- TypeScript, the four-cat/three-mode character check, the all-season descent check, and the versioned ZIP validation passed. See `docs/WINTER-MIDDLE-RIDGE-3.34.8.md` for the art and review record.

## Version 3.34.7 — four-cat integration review

- All four cats now have uninterrupted ten-second review clips in every season and mode: 48 routes with no browser errors. The 256-cell Earl, Betty, and Gracie source sheets pass their cell audits; Betty and Gracie each report 256 authored cells.
- A full 32-route Classic/Zen long-climb matrix, 48 long-fall mode checks, 16 Expedition checkpoint and finish checks, score persistence, audio controls, and responsive menu checks passed. See `docs/MILESTONE-38-RELEASE-REVIEW.md` for evidence and limits.
- Switching cats clears the previous cat's tinted canvas cache. In the measured one-season switch path, retained tint canvases fell from about 161 MB to at most 58 MB. The artwork and game rules are unchanged.
- The bundled headless Chromium used SwiftShader and held near 60 fps through 1366×768, but about 30 fps at 1920×1080. The later 3.34.8 GPU-backed browser measurements are summarized above; direct motion and visual signoff remain open.

## Version 3.34.6 — Classic and Expedition motion review

- Recorded Betty and Gracie in Classic and Expedition across all four seasons. The 16 uninterrupted clips include normal top, side, and underside contacts in every route; 14 routes also include an airborne boost. All reported zero browser errors. Seven Expedition routes finished in ten seconds; Gracie's Spring route reached a checkpoint.
- A targeted Gracie Spring Classic fall reached the ground and showed the correct landing screen. A targeted Expedition miss reached base camp, relaunched with the crouch, and finished.
- Reaching an Expedition checkpoint now clears the old falling warning, so it does not linger over base camp or the relaunch. Collision, scoring, and movement calculations are unchanged.
- Earl also has twelve uninterrupted seasonal Classic, Zen, and Expedition recordings, plus focused Winter ground landing and Autumn checkpoint-to-finish clips. The source atlas audit and all browser recordings passed; direct motion-timing signoff remains open.

## Version 3.34.5 — visible launch anticipation

- Ready-state walking now uses each companion's painted walk cycle, and launch input shows its crouch sequence for 120 ms before takeoff. The same brief anticipation applies when relaunching from Zen ground or an Expedition checkpoint. Launch velocity, collision, and scoring calculations are unchanged.
- Top bell landings now hold their dedicated contact painting until launch resumes, removing the visible switch to a lower-anchored generic pose. Side, underside, and boost handoffs retain their existing art.
- Browser checks confirmed idle, walk, and crouch art selection for all three companions, the crouch-to-launch transition, and pause behavior. Four-cat/three-mode contact and save checks, roster checks, and responsive release checks passed. The full motion milestones still need continuous contact and mode review.

## Version 3.34.4 — companion motion cut preview

- Betty and Gracie now use compact painted crouch, launch, rise, apex, and fall sequences selected from their complete 256-pose source atlases. Their approved event paintings still lead the shortest contacts and recoveries, and the earlier still art remains a loading fallback.
- Rise and apex select poses from vertical speed; Gracie's seasonal neckerchief tint follows the new animation cells. Gameplay collision, scoring, and movement rules are unchanged.
- Eighty forced-state captures across four seasons and 432 sampled live-play frames across all three modes reported no browser errors. This is an interim visual build; uninterrupted motion signoff remains open. See `docs/COMPANION-ART-PRODUCTION.md`.

## Version 3.34.3 — companion motion preview

- Earl, Betty, and Gracie each have registered 16-pose idle and walking cycles, with earlier paintings as loading fallbacks. All three now use distinct painted launch, apex, fall tuck, recovery, turn, and directional contact art.
- Betty's approved cream-cat paintings now have pale blue eyes. Her petite shape and lavender bow are preserved.
- Landing overlays and Winter/Autumn expedition ending text use the selected cat's name.
- The 16-pose walks and sampled idle keys were checked across all four seasons in Chromium (240 frames, no page errors). See `docs/COMPANION-ART-PRODUCTION.md` for the identity rules, crop failures, accepted prompt changes, and remaining work.
- This is an interim build. Earl, Betty, and Gracie each have a complete 256-pose source atlas that passes the cell audit. Full natural-timing review remains open for all three companions.

## Version 3.34.2 — Earl Grey event motion preview

- Earl now has painted launch, apex, tucked fall, and landing recovery poses. His fall alternates between extended and tucked silhouettes; seasonal neckerchief colors carry through the new art.
- Winter and Summer game-scale reviews of all eight motion states are in `review/m35-earl-events`. The four-key walk preview from 3.34.1 remains in place.
- This is still an interim Milestone 35 build. Earl's 256-frame source and directional contact suite, plus Betty and Gracie's animation suites, remain to be produced.

## Version 3.34.1 — Earl Grey walk preview

- Earl Grey now has four painted, paw-aligned walking keys driven by ground travel. If the new atlas fails to load, his previous walk sprites remain available.
- His seasonal neckerchief colors carry through the new poses. Winter's painted snow surface sits closer to the cats' world-ground paw line.
- This is an interim Milestone 35 build. Earl's 256-frame source, other motion families, and the Betty and Gracie suites are still planned. Art decisions and review captures are in `docs/MILESTONE-35-EARL-PRODUCTION.md`.

## Version 3.34.0 — Seasonal depth and ground contact

- Spring, Summer, and Autumn have painted transparent bridge, middle, and high terrain. Each season keeps one sky owner as its landmarks move gradually into high air.
- Spring's flowers and Autumn's pumpkins cross the cats' paws at the ground. Summer uses the existing painted sunflower and stone edges for contact after rejecting a glowing cutout that read as a floating strip.
- The three season falls were captured with fixed 60 Hz physics and reached their ground state without runtime errors. Art composition, rejected prompts, and remaining visual review points are in `docs/MILESTONE-34-SEASON-ART.md`.

## Version 3.33.0 — Scenic descent pacing

- Sustained falls slow through painted ridges and near the ground, while empty high sky remains faster. Short bounce arcs retain their previous timing.
- The fall camera tracks a stable zone around the cat. Catches restore normal bounce behavior immediately; Classic, Zen, and Expedition still resolve at their actual ground or checkpoint positions.
- A real timed Winter descent preview is in `review/m33-winter-fall/descent.webp`, with timing and mode checks in `docs/MILESTONE-33-DESCENT.md`.

## Version 3.32.0 — Winter scene ownership prototype

- Winter's climb now keeps one moon and aurora sky while three transparent painted terrain stages introduce foothills, middle peaks, and high ridges.
- Snow-covered reed banks sit behind and in front of the walking lane, and a stronger registered snow edge overlaps the paws.
- The 111-frame ascent/descent visual review is in `review/m32-winter-review/ascent-descent.webp`; art source and composition notes are in `art-source/winter-transition` and `docs/MILESTONE-32-WINTER-ART.md`.

Descent speed and the other seasons were delivered in Milestones 33 and 34.

## Version 3.31.0 — New game identity

- The title now names the four-cat adventure across all painted seasons. The extension, menu, and game canvas use the same name.
- Existing scores, selected cat, season, mode, and audio settings remain under their original local storage keys so an update in the same extension location retains them.
- The release ZIP has a new filename but keeps the original extracted folder name to preserve the unpacked extension's path. The cat icon remains recognizable at small toolbar sizes.

## Version 3.30.0 — Airborne pacing and long climbs

- Seasonal birds now cross at a more readable speed, with a painted edge preview and a clear entry cue. Their contact area is more forgiving and the geometric ring is removed from the loaded art.
- The ascent camera keeps the cat below the command panel during fast launches. At great height, the existing painted sky shifts subtly without bringing back lower terrain.
- Long-run object drawing and collision use sorted height lookup, keeping frame work low even after thousands of generated targets. Scores, x20 stacking, modes, and character collision rules remain intact.

See `docs/AIRBORNE-PACING-MILESTONE-30.md` for the timing, interception, route, visual, and performance checks.

## Version 3.29.0 — Four cats and seasonal music

- Earl Grey, Betty Davis, and Gracie Bell join Zima in the character selector. Each has separate painted idle, walk, rise, fall, contact, and landing poses. The game remembers the selected cat and labels saved scores with its name.
- Their painted neckwear takes on seasonal colors while the cats keep their own markings and body shapes. All four use the same fair collision dimensions in Classic, Zen, and Expedition.
- Seasonal arrangements now breathe between phrases, add a soft mallet voice, and shift their texture with ascent and descent. Music and effects have separate saved level controls. Short WAV previews are in `docs/audio-captures`.

See `docs/MILESTONES-27-29-ACCEPTANCE.md` for checks and remaining optional art polish. Full-resolution character masters and composition notes live in `art-source/characters` and `docs/CHARACTER-MOTION-ART-REFERENCE.md`.

The version notes below describe what was still open in each earlier build.

## Version 3.26.3 — Falling motion cycle

- A second hand-painted fall pose gives Zima a visible reach-and-tuck cycle during long descents. The two poses share one scale and anchor; seasonal scarf colors apply to both.
- If the new pose cannot load, the first fall pose continues to display.

See `docs/ZIMA-FALL-CYCLE-V3.26.3.md` for the art and runtime check. Milestone 27's distinct seasonal accessory shapes and complete motion review remain open.

## Version 3.26.2 — Seasonal scarf colors

- Zima keeps his painted blue scarf in Winter. Its painted folds and highlights take on rose in Spring, teal in Summer, and berry in Autumn across atlas, fall, turn, and contact poses.
- Only scarf-colored pixels are changed; his fur and blue eyes stay the same. Poses are processed when first needed and cached for the selected season.

See `docs/ZIMA-SEASONAL-SCARF-V3.26.2.md` for visual and performance checks. Distinct seasonal accessory shapes remain Milestone 27 work.

## Version 3.26.1 — Falling pose and art reference

- Zima now turns into a dedicated painted, head-down fall pose during descent. His atlas remains the fallback if the pose cannot load.
- `docs/CHARACTER-ART-REFERENCE.md` records the canonical character references, a reusable generation brief, and the normal-size four-season acceptance check so future art attempts are judged consistently.

Milestone 27's seasonal clothing and full motion sequence are still in progress. See `docs/ZIMA-FALL-POSE-V3.26.1.md` for this update's acceptance checks.

## Version 3.26.0 — Continuous ascent and descent

- Painted middle and high terrain now recedes over broad altitude ranges. It returns in the same order when Zima falls, ending in each season's original open sky at the top.
- The ground and close front details remain tied to the world ground; upper paintings do not cycle back during extended climbs.

See `docs/ASCENT-DESCENT-MILESTONE-26.md` for the transition and runtime checks.

## Version 3.25.0 — Ground scene depth

- Close painted ground details now pass in front of Zima's paws and partially in front of him near seasonal edge props. The play lane stays open, and the front art shares the ground's world anchor as the camera rises or falls.
- Autumn's town painting is placed higher in the scene, where the village and water are easier to read without a visible lower-layer cutoff.
- A missing scenery image now uses local painted fallback art rather than a procedurally drawn landscape.

See `docs/SCENE-DEPTH-MILESTONE-25.md` for the depth rule, visual checks, and remaining upper-climb work.

## Version 3.24.0 — Painted upper realms

- Each season now has two painted upper-realm backgrounds. Broad altitude blends replace the abrupt 500-unit chapter changes and the flat procedural hills, trees, and structures.
- The original season sky remains stable while distant painted scenery enters beneath it. The Expedition camp and summit use small painted seasonal ledges beneath Zima.
- The musical chapter form, three-stage Expedition route, scoring, and Classic and Zen controls remain available.

See `docs/UPPER-REALMS-V3.24.0.md` for the art inventory and visual checks.

## Version 3.23.0 — Expedition

- Expedition adds a finite three-stage climb in every season, two base camps, a visible destination, and a seasonal summit ending. A fall returns Zima to the latest base camp with his score kept and multiplier reset to x1.
- Completed Expeditions earn records on their own score board. An unfinished route does not set an Expedition best. Classic and Zen remain available.
- The season menu and score board now use focusable page controls. Score rows scroll and keep every digit of large scores visible at small and large window sizes.

See `docs/EXPEDITION-MILESTONE-23.md` for route rules and verification.

## Version 3.22.0 — Renewable climb chapters

- Each season gains three altitude bands and seven reusable scenic motifs. Painted source skies and landscape textures blend with new terrain, props, and atmosphere while keeping the central play lane open.
- The chapter system follows altitude rather than score. Four seeded variants per band recur through long climbs; at most twelve capped-resolution chapter canvases remain decoded for the selected season.
- Each seasonal track now has a 32-bar form with quieter brush percussion, counterlines, and bar-aligned chapter cues. Music and contact effects run through separate gain nodes.

See `docs/CLIMB-CHAPTERS-MILESTONE-22.md` for the art inventory and endurance checks.

## Version 3.21.0 — Grounded Zima

- The selected idle, walk, crouch, and landing poses now use measured paw anchors so their solid lower pixels meet the same ground line. The turn and top-contact poses use measured image bounds too.
- Walk frames and a small weight shift follow actual horizontal travel; feet stop cycling when movement stops.
- A stronger contact shadow, narrow foreground surface detail, and fading season-specific steps make snow, spring grass, summer dust, and autumn leaves respond under Zima's paws.

See `docs/GROUNDED-ZIMA-MILESTONE-21.md` for measurements and checks.

## Version 3.20.0 — Exact tier scoring and score board

- Bronze, silver, and crystal targets pay 10, 20, and 30 base points. Airborne targets show matching tier rings, pay at the current multiplier, then raise it by one up to x20.
- Scores, mode-specific bests, and records use exact integers stored as decimal strings. Legacy numeric records remain visible; values originally saved outside JavaScript's safe integer range are marked approximate.
- The score board separates Classic and Zen, wraps every score digit, and pages through records with mouse or arrow/Page keys. Opening it freezes gameplay movement so scores can be read.
- The HUD and landing screen wrap large scores into full decimal lines rather than scientific notation.

See `docs/SCORING-MILESTONE-20.md` for the scoring contract and checks. Milestone 21 is intentionally held for review.

## Version 3.19.0 — Long-run pacing

- Object size tapers from 112 at the start to 102 at object 100, 96 at 200, and 84 at 600, then varies within 84–104. A modest high-resolution adjustment keeps late objects legible.
- Airborne crossing time now follows viewport width: roughly 2.2–2.45 seconds early and at least 1.6 seconds late. Speed caps at 1700 world units per second and no longer increases after the late plateau.
- A small edge shimmer and chime announces an airborne entry without text. Later airborne spawns are slightly closer together, making a sustained multiplier more attainable.

See `docs/PACING-MILESTONE-19.md` for the sampled curve.

## Version 3.18.0 — All-angle contact and quieter effects

- Zima now catches seasonal objects from top, bottom, sides, and diagonals with a swept collision shape that follows each object's bob and rotation. Side and underside catches provide an immediate lift.
- Airborne catches also use a swept hit check. Contact keeps sparkles, seasonal bursts, sound, and camera response without floating score or boost text.
- Repeated contact remains one award per object; Zen can reuse an object after its cooldown for movement only.

See `docs/CONTACT-MILESTONE-18.md` for the collision checks.

## Version 3.17.0 — Complete foreground silhouettes

- Transparent near scenery now scales uniformly and anchors its left and right groups to the screen edges. Winter tree tips and Summer sunflower heads stay visible without stretching the art.
- The open play lane and ground-aligned landmark positions are retained.

See `docs/SCENE-SILHOUETTES-MILESTONE-17.md` for the visual checks.

## Version 3.16.0 — Playability and music pass

- Escape or the visible Menu button returns to season and mode selection from play, pause, landing, or game over. A scored run is saved before leaving.
- The score and command panels now use dark, high contrast backgrounds across every season. The command panel shows the music state and has a mouse accessible Menu button.
- Airborne targets begin at roughly 320–450 world units per second and ramp toward 650–930 by later levels. Each catch still adds one to the multiplier, capped at x10.
- A narrow side graze can count as a landing, and an object or airborne catch during a Classic fall can recover the run. Clear misses still continue to the ground.
- All four seasonal tracks retain their melodies and 8 bit tone, with a quiet warm pad and pixel pluck part. Music resumes cleanly after muting, pausing, or a hidden tab.

See `docs/PLAYABILITY-AND-AUDIO-PASS-16.md` for tests and recommendations from the game review.

## Version 3.15.0 — Scene scale and ground recovery

- Seasonal landscape, vegetation, and ground layers now preserve their source proportions while covering the window, matching the existing sky renderer. Summer windmill and Autumn scarecrow stand on the world ground and leave view with it.
- The falling camera keeps Zima visible through a ground landing. Classic settles into game over; Zen settles on the ground, keeps the run's score and multiplier, and waits for click, Space, or Enter to launch again onto a reachable new path.
- Ground landing uses crouch-to-stand poses without the airborne recovery frame. The horizontal edge margin also keeps Zima's sprite inside the window.

See `docs/SCENE-AND-FALL-MILESTONE-15.md` for checks and remaining acceptance work.

## Version 3.14.0 — Rise animation timing

- Zima's four curated rise poses now follow his vertical speed from launch to apex. The previous timed playback normally reached only three poses before the state changed.
- Apex keeps the velocity-based four-pose timing introduced in 3.13.0. Movement physics and art assets are unchanged.

See `docs/ZIMA-RISE-MILESTONE-14.md` for the timing check.

## Version 3.13.0 — Apex animation timing

- Zima's four curated apex poses now follow his upward-to-downward velocity through the jump crest. This lets all four poses appear during the short apex state while leaving the movement physics unchanged.
- A new illustrated apex candidate was rejected because its backdrop was not transparent. The runtime continues to use the compact lossless atlas.

See `docs/ZIMA-APEX-MILESTONE-13.md` for checks and the remaining animation work.

## Version 3.12.0 — Underside contact pose

- Added a transparent Zima pose for the first 50 ms after an underside traversal-object hit, using the original 256-pose atlas as the character reference. The compact atlas supplies the remaining recovery frames and the fallback if the new image cannot load.
- Kept collision, scoring, boost velocity, and contact timing unchanged.

See `docs/ZIMA-UNDERSIDE-MILESTONE-12.md` for the visual and build checks.

## Version 3.11.0 — Airborne boost pose

- Added a transparent Zima pose for the first 85 ms after an airborne target boost. The curated atlas completes the recovery, and it remains the fallback if the new image cannot load.
- Confirmed the new artwork does not change bird collision, multiplier increments, upward velocity, or boost timing.

See `docs/ZIMA-AIRBORNE-MILESTONE-11.md` for the visual and collision checks. Underside contact still uses the clean atlas because the attempted new cutouts retained a visible halo.

## Version 3.10.0 — Top-object contact

- Added a transparent Zima contact pose for the first 50 ms of a top-object landing. The existing clean atlas supplies the recovery frames; collision, bounce timing, and scoring are unchanged.
- A just-hit traversal object stays readable during the contact pose, then fades to its previous used-object opacity. This makes Zima's paws visibly meet the painted object.

See `docs/ZIMA-CONTACT-MILESTONE-10.md` for the visual and collision checks.

## Version 3.9.0 — Authored ground turn

- Added a new transparent, painterly Zima pose for the midpoint of a ground turn. Airborne turns continue to use the clean atlas, keeping Zima's flying posture intact. Steering remains immediate.
- The runnable ZIP now contains the assets the extension loads, including its fallback scenery, while the large 256-cell source atlas stays in the development project for rebuilding the compact runtime atlas.

See `docs/ZIMA-TURN-MILESTONE-9.md` for visual checks and the remaining animation work. Build the runnable ZIP with `python scripts/package-extension.py`.

## Version 3.8.0 — Input and overlay polish

- Zima now pivots through a short width change when reversing direction. Steering and facing change immediately; the visual transition uses the existing clean sprite poses.
- The scoreboard consumes clicks over the title and ready screens and blocks menu keys while open. Steering still works during an active run.
- Mouse-only play, title selection, and the overlay behavior were checked in Chromium. The preview page now uses a local favicon and a versioned script URL.

See `docs/INPUT-ACCEPTANCE-8.md` for checks and the remaining Zima art limit.

## Version 3.7.0 — Landmark and acceptance pass

- Added separate painted Summer windmill and Autumn scarecrow props at middle-scene depth. They move with the landscape and leave the existing layered ground and object art intact.
- Top-object contact now plays a three-pose recovery across 120 ms without changing bounce timing. Ground contact after a Classic fall briefly plays its own landing sequence. The lossless runtime atlas was rebuilt with the 38 poses now in use.
- Restarting a scored run persists the Best value along with score history. On load, a saved history entry can repair an older stale Best value.
- A ten-minute automated Zen simulation remained active with a bounded object list; all four seasons were visually checked at high camera positions.

See `docs/ACCEPTANCE-PASS-7.md` for art sources, checks, and remaining limits.

## Version 3.6.0 — Play-balance verification and loading cleanup

- Verified tier boosts, equal tier scoring, long Classic falls, Zen ground recovery, no repeat score on Zen objects, and the airborne multiplier cap in Chromium. The existing movement and scoring values were retained.
- Objects that have descended far below ground are removed from the active list, keeping extended Zen runs from accumulating unreachable objects.
- Runtime Zima art now loads from a lossless 40-pose atlas (1.97 MB) instead of the 256-cell source atlas (19.45 MB). The source PNG remains in the project for rebuilding. The eight legacy concept crops load only if a layered scene fails.

See `docs/PLAY-BALANCE-MILESTONE-6.md` for the measurements and checks.

## Version 3.5.0 — Selector and overlay polish

- Compacted the title selector for short windows while preserving separate season and mode controls.
- Season cards now preview their painted traversal object. The ready screen has a readable panel that clears the HUD.
- The scoreboard fits ten rows at 640×480 and has a more opaque background for legibility.

See `docs/UI-MILESTONE-5.md` for viewport and input checks.

## Version 3.4.0 — Zima animation cleanup

- Playback now uses the clean source poses in the existing 256-cell Zima atlas. Cells with doubled, semi-transparent limbs are skipped.
- Added short underside and airborne boost contact poses; top-object contact continues through the landing pose.
- Kept the stable idle pose and removed its extra procedural lift. Physics and scoring are unchanged.

See `docs/ZIMA-ANIMATION-MILESTONE-4.md` for the frame choices and remaining art limits.

## Version 3.3.0 — Four layered seasons

- Spring, Summer, and Autumn now use separate local sky, far landscape, middle landmark, near vegetation, and ground assets. The shared scene renderer gives each depth band its own parallax speed and aligns the painted ground with Zima's feet.
- Removed the old concept-sheet crops and procedural landmarks from the normal render path for all four seasons. They remain as load-failure fallbacks.
- Softened the near-layer top and bottom edges where needed so trees move without exposing hard image borders.

See `docs/SEASONAL-SCENES-MILESTONE-3.md` for scene layout and visual checks.

## Version 3.2.0 — Interactive art milestone

- Replaced the normal canvas vector path for all 12 traversal objects with four local transparent sprite atlases. Bronze/silver/crystal, raindrop/blossom/glow bloom, sunflower/golden bloom/radiant flower, and pumpkin/gourd/jack-o'-lantern each have distinct painted silhouettes.
- Added six-frame painted atlases for the aurora bird, dragonfly, swallow, and crow. Their frames are selected during play while their existing collision and multiplier rules remain unchanged.
- Preserved each object's proportions and the existing deterministic hitboxes. Art preloads before starting a run; the prior vector renderers remain available if an asset fails to load.

See `docs/INTERACTIVE-ART-MILESTONE-2.md` for asset layout and checks.

## Version 3.1.0 — Winter art milestone

- Winter now renders from five local, hand-painted layers: sky, mountains, village, pine forest, and snow ground. The mountain, village, and tree layers move at separate parallax speeds.
- The Winter scene no longer uses the old concept-sheet background or ground crops in normal play. Those files remain as loading-failure fallbacks, alongside the unchanged Spring, Summer, and Autumn scenes.
- Winter assets preload before a Winter run starts. A failed load falls back to the existing scenery so the game stays playable.
- Gameplay physics, object collision, scoring, modes, audio, and score history were not changed in this pass.

The new layers are in `assets/themes/winter/`. To rebuild `main.js` from the TypeScript source, run:

```powershell
npm exec --yes --package typescript@5.9.3 -- tsc source/main.ts --target es2022 --lib dom,es2022 --outFile main.js --noEmitOnError
```

The extension has no remote runtime dependencies. See `docs/WINTER-MILESTONE-1.md` for the renderer inventory and remaining visual work.

## Install
1. Extract the ZIP.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the extracted `zima-skybells-extension` folder.
6. Click the extension icon to open the game in its own tab.

For an existing unpacked installation, replace the files in the same `zima-skybells-extension` directory and click **Reload** on its Chrome extension card. Keep that directory path and extension entry so the extension origin, scores, and settings stay together.

## Controls
- **A / D** or **Left / Right** — steer Zima.
- **Mouse movement** — optional direct-follow steering.
- **Space / Enter / Click** — launch from the ground.
- **P** — pause.
- **M** — mute.
- **R** — restart to the ground.
- **L** — toggle the local scoreboard.

## Version 2.0.0 overhaul
- Rebuilt Zima's animation system around a normalized **26-frame animation atlas**. Every frame uses a fixed cell size and common ground/aerial anchor, eliminating the foot-position clipping and frame-to-frame body jumps from earlier builds.
- Distinct animation states for idle, walking, crouch, launch, ascent, apex, descent, bell landing, and recovery, with short crossfades between frames.
- Zima's physics coordinate now represents the feet directly, so the cat is physically anchored to the snow and lands on the visible top of bells instead of floating around an approximate center point.
- Horizontal navigation has no momentum or automatic drift. Keyboard input directly controls horizontal velocity; mouse steering follows the actual pointer only when mouse input is active.
- Bell layout is substantially sparser. Each landing calculates the next launch velocity from the vertical and horizontal distance to the next bell, producing visibly larger leaps while keeping generated paths physically reachable.
- Bell hitboxes are wider and use a proper top-crossing test, making visible paw/bell contacts register much more consistently.
- Bell size now shrinks gradually over a long run rather than collapsing too quickly.
- Reworked bell rendering with a handle, shoulders, flared skirt, open rim, and clapper so the silhouette clearly reads as a bell.
- Bonus targets do not appear until roughly bell 35 and recur only every 22–30 bells.
- Bonus targets are now fast-moving **aurora birds**, not slow drifting pickups. Hitting one causes a real upward bounce and increments the score multiplier by one.
- Score multiplier only increases from aurora birds. Ordinary bells no longer increase it.
- Scoring was rescaled dramatically: bells begin around 10 points and grow very slowly, with the multiplier capped at 12. A million-point run now requires an extremely long climb instead of occurring during an ordinary run.
- Added landing holds, particles, camera kick, smoother bell sway, and animated bird wing motion while keeping the core game readable.


Update 2.2.0
- Added a full 256-frame animation atlas for Zima, built from the existing adult sprite suite and normalized for smooth playback.
- Mapped the game animation system to the new atlas with dedicated long sequences for idle, walk, crouch, launch, rise, apex, fall, and land.
- Removed runtime cross-fading in favor of direct playback from the denser atlas, which makes motion cleaner and less ghosted.
- Increased animation playback smoothness, especially on ground movement.
- Boost birds now give a stronger upward bounce to better match their intended mobility role.
- Shortened bell contact hold slightly so successful chains feel snappier.


Update 2.3.0
- Gameplay cadence pass: stronger gravity, faster jumps, faster camera tracking, and more immediate horizontal speed.
- Bells now physically descend through the playfield via a continuous field-drop system instead of relying only on camera motion.
- Bell spacing is wider and later patterns become more sparse while remaining reachable.
- Consecutive bell hits build a small capped bounce-chain boost, creating increasing momentum without runaway energy.
- Boost birds now appear later, move substantially faster, use a larger fair collision region, raise the score multiplier by one, and provide a strong upward bounce toward future bells.
- Reduced score inflation: bell base values rise very slowly and the bird multiplier caps at x10.
- Restored/replaced the placeholder ambient loop with an original locally synthesized 6/8 piano-and-cello winter theme.
- Raised the simulation/render timestep cap to improve responsiveness on high-refresh displays.


Update 2.4.0
- Added three traversal bell types: bronze, silver, and crystal. They award identical score values; silver and crystal only change launch strength.
- Bell contacts now register from above or while rising through the underside. Bottom-side hits add upward momentum without forcing a landing pause.
- Aurora birds now begin much earlier, appear more often, move faster, raise the score multiplier by one, and provide a stronger recovery launch.
- Added a dedicated long-fall state: missing the chain makes Zima fall back through the world until he reaches the ground instead of ending the run immediately.
- Preserved all 256-frame animation states during the new traversal and falling behavior.


Update 2.4.1
- Removed the misleading UPWARD TAP feedback.
- All underside bell contacts now apply their vertical boost automatically.
- Automatic underside boosts now consider the next bell distance so they carry Zima forward through the chain without requiring W/Up input.
- During active play, controls are horizontal only: mouse, A/D, or Left/Right.
- W/Up are no longer treated as launch controls, which keeps mouse-only play fully viable.


Update 2.5.0
- Added four full seasonal art themes: Winter, Spring, Summer, and Autumn.
- Added a title-screen theme selector with clickable theme cards and keyboard cycling.
- Kept the core game loop intact while reskinning the bounce objects, airborne boosts, launch pad, particles, and scenery per season.
- Spring uses raindrops/blossoms with dragonflies, Summer uses sunflowers with swallows, and Autumn uses pumpkins/gourds with crows.
- HUD and instructional text now adapt to the selected season.


Update 2.6.0
- Polished all four seasonal themes with stronger scenery, particles, and object silhouettes for better readability.
- Upgraded the title selector into a richer theme-selection screen with clearer season previews and a stronger start button.
- Improved bounce object and airborne-boost readability with stronger outlines, shadows, and contrast.
- Added season-specific music variants for Winter, Spring, Summer, and Autumn while keeping the same core game loop.
- Refined HUD panel styling to match the chosen season more cleanly.


Update 2.8.0 — Seasonal distinction pass
- Added season-specific impact particles and interaction feedback without changing gameplay rules.
- Winter hits now burst into snowflake-like sparkles.
- Spring interactions mix water droplets and petals.
- Summer interactions use warm pollen/golden motes.
- Autumn interactions throw colored leaves.
- Airborne multiplier boosts now use the selected season accent and matching seasonal burst.
- Increased spring/autumn ambient particle density slightly to strengthen moment-to-moment identity.


Update 2.9.0 — Painted Environment Pass
- Added painted seasonal environment layers generated from the approved art direction.
- Replaced much of the flat procedural horizon and ground presentation with painted background and start-area layers.
- Winter now reads as a deeper alpine village scene, Spring as a blossom/stream landscape, Summer as a sunflower-lake countryside, and Autumn as a harvest valley.
- Reduced the procedural environment geometry to accents so the painted art carries the scene instead of competing with it.
- Kept all core gameplay, collision, scoring, controls, and seasonal object behavior unchanged.


Update 3.0.0
- Pass 3 animation polish: Zima now uses a stable idle frame with subtle procedural breathing instead of cycling idle artwork that could produce ghosted/out-of-phase outlines.
- Added facing and mouse dead zones to stop micro-flipping/jitter while resting.
- Rebuilt the start selector so theme cards, mode controls, descriptive text, and the Start button no longer overlap.
- Added Classic and Zen game modes. Zen never ends on a miss: Zima can fall, recover from the ground, and previously touched bounce objects become physically reusable after a short cooldown without awarding duplicate score.
- Added a local score board toggled with L. It shows the current run and up to 10 saved high-score runs, including theme, mode, bounce count, and multiplier.
- Scores are saved when a Classic run ends or when an active run is restarted.
